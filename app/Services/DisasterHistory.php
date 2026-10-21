<?php

namespace App\Services;

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * "Disaster history" for the admin dashboard while no disaster is active: totals, the
 * measure per disaster and per disaster type, a ranking of every barangay and one chosen
 * disaster (the latest by default) against the others, all for one set of filters
 * (type, barangay, measure). Every figure is computed here.
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

    /** Other disasters of the focused one's type needed before comparing only with those. */
    private const MIN_OTHERS_SAME_TYPE = 2;

    /** Within this share of the earlier average counts as "about the same". */
    private const SAME_BAND = 0.10;

    /** Every past disaster has evacuation numbers; casualties are rare, so they make a poor first view. */
    private const DEFAULT_METRIC = 'evacuatedPersons';

    /**
     * @param  array<string, mixed>  $input  Raw `type`, `barangay`, `metric` and `event` query values.
     * @return array<string, mixed>
     */
    public static function for(array $input): array
    {
        $barangays = Barangays::accounts();
        $type = in_array($input['type'] ?? null, Typhoon::TYPES, true) ? $input['type'] : null;

        // Every ended disaster, so the per-type comparison stays complete under a type filter.
        $all = Typhoon::where('status', 'ended')->orderBy('ended_at')->get(['id', 'name', 'disaster_type', 'ended_at']);
        $events = $type ? $all->where('disaster_type', $type)->values() : $all;
        $chosen = $events->firstWhere('id', (int) ($input['event'] ?? 0));

        $filters = [
            'type' => $type,
            'barangay' => $barangays->has((int) ($input['barangay'] ?? 0)) ? (int) $input['barangay'] : null,
            'metric' => array_key_exists($input['metric'] ?? '', self::METRICS) ? $input['metric'] : self::DEFAULT_METRIC,
            // null means "the latest disaster".
            'event' => $chosen?->id,
        ];

        [$citywide, $perAccount, $unplacedNames] = self::reported($all, $barangays);
        $metric = $filters['metric'];
        $selected = $filters['barangay'];
        // What the totals, line and latest-disaster sentences describe: one barangay or the whole city.
        $scoped = $selected ? ($perAccount[$selected] ?? []) : $citywide;
        $value = fn (array $byEvent, int $eventId, string $key) => $byEvent[$eventId][$key] ?? 0;

        $summary = ['events' => $events->count()];
        foreach (['affected', 'dead', 'injured', 'missing', 'housesDamaged', 'evacuatedPersons'] as $key) {
            $summary[$key] = $events->sum(fn (Typhoon $event) => $value($scoped, $event->id, $key));
        }

        // The barangay x disaster loops below use plain ids: Eloquent attribute reads cost most of the time there.
        $eventIds = $events->pluck('id')->all();
        $barangayRows = $barangays->map(fn (User $user) => $perAccount[$user->id] ?? [])->all();

        // With one barangay picked, the average barangay gives its line something to compare with.
        $averages = [];
        if ($selected) {
            foreach ($eventIds as $eventId) {
                $sum = 0;
                foreach ($barangayRows as $byEvent) {
                    $sum += $byEvent[$eventId][$metric] ?? 0;
                }
                $averages[$eventId] = round($sum / max(1, count($barangayRows)), 1);
            }
        }

        $series = $events->map(fn (Typhoon $event) => [
            'id' => $event->id,
            'name' => $event->name,
            'type' => $event->disaster_type,
            'endedAt' => $event->ended_at?->toIso8601String(),
            'value' => $value($scoped, $event->id, $metric),
            'average' => $averages[$event->id] ?? null,
        ])->values()->all();

        $ranking = $barangays->map(function (User $user) use ($eventIds, $barangayRows, $metric) {
            $byEvent = $barangayRows[$user->id];
            $perEvent = array_map(fn (int $eventId) => $byEvent[$eventId][$metric] ?? 0, $eventIds);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'value' => array_sum($perEvent),
                'eventsAffected' => count(array_filter($perEvent)),
            ];
        })->sortBy([['value', 'desc'], ['name', 'asc']])->values()->all();

        $byType = $all->groupBy(fn (Typhoon $event) => $event->disaster_type ?? '')
            ->map(function (Collection $group, string $groupType) use ($scoped, $value, $metric) {
                $values = $group->map(fn (Typhoon $event) => $value($scoped, $event->id, $metric));

                return ['type' => $groupType ?: null, 'events' => $group->count(), 'average' => round($values->avg(), 1), 'total' => $values->sum()];
            })
            ->sortBy([['average', 'desc'], ['type', 'asc']])->values()->all();

        return [
            'filters' => $filters,
            'options' => [
                'types' => $all->pluck('disaster_type')->filter()->unique()->sort()->values()->all(),
                'barangays' => $barangays->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->values()->all(),
                'metrics' => collect(self::METRICS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values()->all(),
            ],
            'summary' => $summary,
            'series' => $series,
            'ranking' => $ranking,
            'unassigned' => self::unassigned(
                $metric,
                $eventIds,
                $events->sum(fn (Typhoon $event) => $value($citywide, $event->id, $metric)),
                array_sum(array_column($ranking, 'value')),
                $unplacedNames,
            ),
            'byType' => $byType,
            'focus' => self::focus($events, $chosen ?? $events->last(), $scoped, $value),
        ];
    }

    /**
     * What was reported per disaster, citywide (every row) and per barangay account, plus what
     * could not be placed in a barangay. One grouped query per report table.
     *
     * Every row names its barangay (city offices such as CSWDO enter them for many barangays),
     * so it is credited by that name, not by the account that entered it.
     *
     * @param  Collection<int, Typhoon>  $events
     * @param  Collection<int, User>  $barangays
     * @return array{0: array<int, array<string, int>>, 1: array<int, array<int, array<string, int>>>, 2: array<string, array<int, array<string, int>>>}
     */
    private static function reported(Collection $events, Collection $barangays): array
    {
        $citywide = [];
        $perAccount = [];
        $unplacedNames = [];
        if ($events->isEmpty()) {
            return [$citywide, $perAccount, $unplacedNames];
        }

        $idByName = $barangays->pluck('id', 'name')->all();
        $grouped = fn (string $table, string $value) => DB::table($table)
            ->whereIn('disaster_id', $events->pluck('id'))
            ->groupBy('barangay', 'disaster_id')
            ->selectRaw("barangay, disaster_id, {$value} as v")
            ->get();

        foreach ([
            'dead' => $grouped('casualties', 'COUNT(*)'),
            'injured' => $grouped('injureds', 'COUNT(*)'),
            'missing' => $grouped('missing', 'COUNT(*)'),
            'housesDamaged' => $grouped('damaged_house_reports', 'COALESCE(SUM(total), 0)'),
            'evacuatedPersons' => $grouped('pre_emptive_reports', 'COALESCE(SUM(total_persons), 0)'),
        ] as $metric => $rows) {
            foreach ($rows as $row) {
                $v = (int) $row->v;
                $citywide[$row->disaster_id][$metric] = ($citywide[$row->disaster_id][$metric] ?? 0) + $v;
                $matched = Barangays::match($row->barangay);
                $account = $matched ? $idByName[$matched] : null;
                if ($account) {
                    // +=: "Alibagu" and " alibagu" are separate groups for the same barangay.
                    $perAccount[$account][$row->disaster_id][$metric] = ($perAccount[$account][$row->disaster_id][$metric] ?? 0) + $v;
                } else {
                    $name = trim((string) $row->barangay);
                    $unplacedNames[$metric][$row->disaster_id][$name] = ($unplacedNames[$metric][$row->disaster_id][$name] ?? 0) + $v;
                }
            }
        }

        // Once here, not per lookup: the ranking reads every barangay x disaster.
        $withAffected = fn (array $values) => $values + ['affected' => ($values['dead'] ?? 0) + ($values['injured'] ?? 0) + ($values['missing'] ?? 0)];
        $citywide = array_map($withAffected, $citywide);
        $perAccount = array_map(fn (array $byEvent) => array_map($withAffected, $byEvent), $perAccount);

        return [$citywide, $perAccount, $unplacedNames];
    }

    /**
     * What the chosen measure has citywide but no barangay in the ranking: rows naming no barangay
     * or one that is not a barangay account (typed before the barangay list).
     *
     * @param  array<int>  $eventIds
     * @param  array<string, array<int, array<string, int>>>  $unplacedNames
     * @return array{total: int, names: array<int, string>, withoutName: bool}
     */
    private static function unassigned(string $metric, array $eventIds, int $citywideTotal, int $rankedTotal, array $unplacedNames): array
    {
        $amounts = [];
        foreach ($eventIds as $eventId) {
            foreach ($unplacedNames[$metric][$eventId] ?? [] as $name => $v) {
                $amounts[$name] = ($amounts[$name] ?? 0) + $v;
            }
        }
        $names = array_keys(array_filter($amounts));
        $named = array_values(array_filter($names, fn ($name) => $name !== ''));
        sort($named);

        return [
            'total' => $citywideTotal - $rankedTotal,
            'names' => $named,
            'withoutName' => count($named) < count($names),
        ];
    }

    /**
     * One disaster against the others: of its own type when there are enough,
     * otherwise all others in scope.
     *
     * @param  Collection<int, Typhoon>  $events  Oldest first.
     * @param  array<int, array<string, int>>  $scoped
     * @return array<string, mixed>|null
     */
    private static function focus(Collection $events, ?Typhoon $focus, array $scoped, callable $value): ?array
    {
        if (! $focus) {
            return null;
        }

        $sameType = $focus->disaster_type
            ? $events->filter(fn (Typhoon $event) => $event->disaster_type === $focus->disaster_type)
            : collect();
        $useSameType = $sameType->count() - 1 >= self::MIN_OTHERS_SAME_TYPE;
        $group = $useSameType ? $sameType : $events;

        $insights = array_map(function (string $key) use ($group, $focus, $scoped, $value) {
            $current = $value($scoped, $focus->id, $key);
            $others = $group->reject(fn (Typhoon $event) => $event->id === $focus->id)
                ->map(fn (Typhoon $event) => $value($scoped, $event->id, $key));
            $average = $others->avg();

            return [
                'key' => $key,
                'label' => self::METRICS[$key],
                'value' => $current,
                'rank' => 1 + $others->filter(fn ($v) => $v > $current)->count(),
                'of' => $others->count() + 1,
                'average' => $average === null ? null : round($average, 1),
                'comparison' => self::comparison($current, $average),
                // Percent above (+) or below (-) the others' average; none when they average zero.
                'change' => $average ? (int) round(($current - $average) / $average * 100) : null,
            ];
        }, array_keys(self::METRICS));

        return [
            'id' => $focus->id,
            'name' => $focus->name,
            'type' => $focus->disaster_type,
            'endedAt' => $focus->ended_at?->toIso8601String(),
            'isLatest' => $focus->is($events->last()),
            'group' => ['type' => $useSameType ? $focus->disaster_type : null, 'count' => $group->count()],
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
