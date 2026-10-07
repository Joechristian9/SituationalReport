<?php

namespace App\Services;

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * "Disaster history" for the admin dashboard while no disaster is active: totals, a
 * per-disaster trend, a ranking of every barangay and the latest disaster in context,
 * all for one set of filters (type, barangay, measure). Every figure is computed here.
 */
class DisasterHistory
{
    public const METRICS = [
        'affected' => 'Persons affected',
        'dead' => 'Dead',
        'injured' => 'Injured',
        'missing' => 'Missing',
        'housesDamaged' => 'Houses damaged',
        'evacuatedPersons' => 'Persons evacuated',
    ];

    /** Measures the latest disaster is described by. */
    private const INSIGHT_METRICS = ['affected', 'housesDamaged', 'evacuatedPersons'];

    /** Earlier disasters of the latest one's type needed before comparing only with those. */
    private const MIN_EARLIER_SAME_TYPE = 2;

    /** Within this share of the earlier average counts as "about the same". */
    private const SAME_BAND = 0.10;

    /**
     * @param  array<string, mixed>  $input  Raw `type`, `barangay` and `metric` query values.
     * @return array<string, mixed>
     */
    public static function for(array $input): array
    {
        $barangays = self::barangayAccounts();
        $filters = [
            'type' => in_array($input['type'] ?? null, Typhoon::TYPES, true) ? $input['type'] : null,
            'barangay' => $barangays->has((int) ($input['barangay'] ?? 0)) ? (int) $input['barangay'] : null,
            'metric' => array_key_exists($input['metric'] ?? '', self::METRICS) ? $input['metric'] : 'affected',
        ];

        $events = Typhoon::where('status', 'ended')
            ->when($filters['type'], fn ($query) => $query->where('disaster_type', $filters['type']))
            ->orderBy('ended_at')
            ->get(['id', 'name', 'disaster_type', 'ended_at']);

        [$citywide, $perAccount] = self::reported($events);
        $metric = $filters['metric'];
        $selected = $filters['barangay'];
        // What the totals, line and latest-disaster sentences describe: one barangay or the whole city.
        $scoped = $selected ? ($perAccount[$selected] ?? []) : $citywide;
        $value = fn (array $byEvent, int $eventId, string $key) => self::withAffected($byEvent[$eventId] ?? [])[$key];

        $summary = ['events' => $events->count()];
        foreach (['affected', 'dead', 'injured', 'missing', 'housesDamaged', 'evacuatedPersons'] as $key) {
            $summary[$key] = $events->sum(fn (Typhoon $event) => $value($scoped, $event->id, $key));
        }

        $barangayCount = max(1, $barangays->count());
        $series = $events->map(fn (Typhoon $event) => [
            'id' => $event->id,
            'name' => $event->name,
            'type' => $event->disaster_type,
            'endedAt' => $event->ended_at?->toIso8601String(),
            'value' => $value($scoped, $event->id, $metric),
            // With one barangay picked, the average barangay gives its line something to compare with.
            'average' => $selected
                ? round($barangays->keys()->sum(fn ($id) => $value($perAccount[$id] ?? [], $event->id, $metric)) / $barangayCount, 1)
                : null,
        ])->values()->all();

        $ranking = $barangays->map(function (User $user) use ($events, $perAccount, $value, $metric) {
            $perEvent = $events->map(fn (Typhoon $event) => $value($perAccount[$user->id] ?? [], $event->id, $metric));

            return [
                'id' => $user->id,
                'name' => $user->name,
                'value' => $perEvent->sum(),
                'eventsAffected' => $perEvent->filter(fn ($v) => $v > 0)->count(),
            ];
        })->sortBy([['value', 'desc'], ['name', 'asc']])->values()->all();

        return [
            'filters' => $filters,
            'options' => [
                'types' => Typhoon::where('status', 'ended')->whereNotNull('disaster_type')->distinct()->orderBy('disaster_type')->pluck('disaster_type')->all(),
                'barangays' => $barangays->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->values()->all(),
                'metrics' => collect(self::METRICS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values()->all(),
            ],
            'summary' => $summary,
            'series' => $series,
            'ranking' => $ranking,
            'latest' => self::latest($events, $scoped, $value),
        ];
    }

    /**
     * Barangay accounts (not city office accounts), by name.
     *
     * @return Collection<int, User>
     */
    private static function barangayAccounts(): Collection
    {
        // whereHas, not User::role(): that throws when the role doesn't exist yet (fresh install).
        return User::whereHas('roles', fn ($query) => $query->where('name', 'user'))
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->reject(fn (User $user) => HumanImpactStats::isOffice($user))
            ->keyBy('id');
    }

    /**
     * What was reported per disaster, citywide (every account) and per account.
     * One grouped query per report table.
     *
     * @param  Collection<int, Typhoon>  $events
     * @return array{0: array<int, array<string, int>>, 1: array<int, array<int, array<string, int>>>}
     */
    private static function reported(Collection $events): array
    {
        $citywide = [];
        $perAccount = [];
        if ($events->isEmpty()) {
            return [$citywide, $perAccount];
        }

        $grouped = fn (string $table, string $value) => DB::table($table)
            ->whereIn('disaster_id', $events->pluck('id'))
            ->groupBy('user_id', 'disaster_id')
            ->selectRaw("user_id, disaster_id, {$value} as v")
            ->get();

        foreach ([
            'dead' => $grouped('casualties', 'COUNT(*)'),
            'injured' => $grouped('injureds', 'COUNT(*)'),
            'missing' => $grouped('missing', 'COUNT(*)'),
            'housesDamaged' => $grouped('damaged_house_reports', 'COALESCE(SUM(total), 0)'),
            'evacuatedPersons' => $grouped('pre_emptive_reports', 'COALESCE(SUM(total_persons), 0)'),
        ] as $metric => $rows) {
            foreach ($rows as $row) {
                $citywide[$row->disaster_id][$metric] = ($citywide[$row->disaster_id][$metric] ?? 0) + (int) $row->v;
                if ($row->user_id) {
                    $perAccount[$row->user_id][$row->disaster_id][$metric] = (int) $row->v;
                }
            }
        }

        return [$citywide, $perAccount];
    }

    /**
     * @param  array<string, int>  $values
     * @return array<string, int>
     */
    private static function withAffected(array $values): array
    {
        $values += ['dead' => 0, 'injured' => 0, 'missing' => 0, 'housesDamaged' => 0, 'evacuatedPersons' => 0];
        $values['affected'] = $values['dead'] + $values['injured'] + $values['missing'];

        return $values;
    }

    /**
     * The most recent disaster against earlier ones: of its own type when there are enough,
     * otherwise all earlier ones in scope.
     *
     * @param  Collection<int, Typhoon>  $events  Oldest first.
     * @param  array<int, array<string, int>>  $scoped
     * @return array<string, mixed>|null
     */
    private static function latest(Collection $events, array $scoped, callable $value): ?array
    {
        $latest = $events->last();
        if (! $latest) {
            return null;
        }

        $sameType = $latest->disaster_type
            ? $events->filter(fn (Typhoon $event) => $event->disaster_type === $latest->disaster_type)
            : collect();
        $useSameType = $sameType->count() - 1 >= self::MIN_EARLIER_SAME_TYPE;
        $group = $useSameType ? $sameType : $events;

        $insights = array_map(function (string $key) use ($group, $latest, $scoped, $value) {
            $current = $value($scoped, $latest->id, $key);
            $earlier = $group->reject(fn (Typhoon $event) => $event->id === $latest->id)
                ->map(fn (Typhoon $event) => $value($scoped, $event->id, $key));
            $average = $earlier->avg();

            return [
                'key' => $key,
                'label' => self::METRICS[$key],
                'value' => $current,
                'rank' => 1 + $earlier->filter(fn ($v) => $v > $current)->count(),
                'of' => $earlier->count() + 1,
                'average' => $average === null ? null : round($average, 1),
                'comparison' => self::comparison($current, $average),
            ];
        }, self::INSIGHT_METRICS);

        return [
            'name' => $latest->name,
            'type' => $latest->disaster_type,
            'endedAt' => $latest->ended_at?->toIso8601String(),
            'group' => ['type' => $useSameType ? $latest->disaster_type : null, 'count' => $group->count()],
            'insights' => $insights,
        ];
    }

    private static function comparison(int $value, ?float $average): ?string
    {
        if ($average === null) {
            return null;
        }
        if ($average == 0) {
            return $value > 0 ? 'above' : 'about';
        }
        if (abs($value - $average) / $average <= self::SAME_BAND) {
            return 'about';
        }

        return $value > $average ? 'above' : 'below';
    }
}
