<?php

namespace App\Services;

use App\Models\Casualty;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\Typhoon;
use App\Models\User;
use Carbon\CarbonPeriod;
use Illuminate\Support\Carbon;

/**
 * Aggregates Dead / Injured / Missing records for one disaster, straight from the
 * database (no row limits), for the admin dashboard visualizations.
 *
 * "Barangay" is the submitting account: every barangay has its own user account
 * named after it, with an email ending in @barangay.local (see BarangaySeeder).
 * Any other account (e.g. CDRRMO) is flagged as an office so it is not mistaken for a barangay.
 */
class HumanImpactStats
{
    /** @var array<string, class-string<\Illuminate\Database\Eloquent\Model>> */
    public const TYPES = [
        'dead' => Casualty::class,
        'injured' => Injured::class,
        'missing' => Missing::class,
    ];

    /** Column that describes each record in the live feed. */
    private const DETAIL = [
        'dead' => 'cause_of_death',
        'injured' => 'diagnosis',
        'missing' => 'cause',
    ];

    /**
     * Latest Dead / Injured / Missing reports for the live feed, newest first, with
     * the account that filed each one. Up to $limit per type, so the feed can show
     * the newest $limit overall or of a single type.
     */
    public static function recent(?Typhoon $disaster, int $limit = 20): array
    {
        if (! $disaster) {
            return [];
        }

        return collect(self::TYPES)
            ->flatMap(fn (string $model, string $type) => $model::query()
                ->where('disaster_id', $disaster->id)
                ->with('user:id,name,email')
                ->latest('created_at')
                ->latest('id')
                ->limit($limit)
                ->get(['id', 'user_id', 'name', self::DETAIL[$type], 'created_at'])
                ->map(fn ($record) => [
                    'key' => "{$type}-{$record->id}",
                    'type' => $type,
                    // Not shown in the feed; only used to open the record on its submissions page.
                    'name' => $record->name,
                    'detail' => $record->{self::DETAIL[$type]},
                    'reporter' => $record->user?->name ?? 'Unknown account',
                    'office' => self::isOffice($record->user),
                    'reportedAt' => $record->created_at?->toIso8601String(),
                ]))
            ->sortByDesc('reportedAt')
            ->values()
            ->all();
    }

    public static function forDisaster(?Typhoon $disaster): array
    {
        if (! $disaster) {
            return self::empty();
        }

        $totals = [];
        $last24h = [];
        $byAccount = [];
        $byDay = [];
        $since = now()->subDay();
        $hourly = self::emptyHours();
        $firstHour = Carbon::parse(array_key_first($hourly));
        $dayTypes = [];   // [user_id][type] => count, last 24 hours
        $dayHours = [];   // [user_id][hour key] => count, last 24 hours

        foreach (self::TYPES as $type => $model) {
            $base = $model::query()->where('disaster_id', $disaster->id);

            $totals[$type] = (clone $base)->count();
            $last24h[$type] = (clone $base)->where('created_at', '>=', $since)->count();

            // Bucketed in PHP so it works on MySQL and SQLite alike; at most a day of rows.
            (clone $base)
                ->where('created_at', '>=', $firstHour)
                ->get(['user_id', 'created_at'])
                ->each(function ($record) use (&$hourly, &$dayTypes, &$dayHours, $type) {
                    $key = Carbon::parse($record->created_at)->format('Y-m-d H:00');
                    if (! isset($hourly[$key])) {
                        return;
                    }
                    $userId = $record->user_id ?? 0;
                    $hourly[$key][$type]++;
                    $dayTypes[$userId][$type] = ($dayTypes[$userId][$type] ?? 0) + 1;
                    $dayHours[$userId][$key] = ($dayHours[$userId][$key] ?? 0) + 1;
                });

            (clone $base)
                ->selectRaw('user_id, COUNT(*) as aggregate')
                ->groupBy('user_id')
                ->get()
                ->each(function ($row) use (&$byAccount, $type) {
                    $byAccount[$row->user_id ?? 0][$type] = (int) $row->aggregate;
                });

            (clone $base)
                ->selectRaw('DATE(created_at) as day, COUNT(*) as aggregate')
                ->groupBy('day')
                ->get()
                ->each(function ($row) use (&$byDay, $type) {
                    $byDay[$row->day][$type] = (int) $row->aggregate;
                });
        }

        $totals['total'] = $totals['dead'] + $totals['injured'] + $totals['missing'];

        return [
            'totals' => $totals,
            'last24h' => $last24h,
            'byBarangay' => self::barangayRows($byAccount),
            'trend' => self::trendRows($byDay),
            'hourly' => array_values($hourly),
            'barangays24h' => self::barangaysLastDay($dayTypes, $dayHours, array_keys($hourly)),
            'generatedAt' => now()->toIso8601String(),
        ];
    }

    /**
     * Every account that reported in the last 24 hours: a ranking with dead /
     * injured / missing counts, and per-hour totals keyed "a{user_id}" (one line
     * per barangay on the chart).
     */
    private static function barangaysLastDay(array $dayTypes, array $dayHours, array $hourKeys): array
    {
        $users = User::whereIn('id', array_filter(array_keys($dayTypes)))
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        $ranking = [];
        foreach ($dayTypes as $userId => $counts) {
            $user = $users->get($userId);
            $row = [
                'key' => "a{$userId}",
                'name' => $user?->name ?? 'Unknown account',
                'office' => self::isOffice($user),
                'dead' => $counts['dead'] ?? 0,
                'injured' => $counts['injured'] ?? 0,
                'missing' => $counts['missing'] ?? 0,
            ];
            $row['total'] = $row['dead'] + $row['injured'] + $row['missing'];
            $ranking[] = $row;
        }
        usort($ranking, fn ($a, $b) => [$b['total'], $a['name']] <=> [$a['total'], $b['name']]);

        // Zeros are included so every line stays continuous.
        $hourly = array_map(function (string $hourKey) use ($dayHours) {
            $row = ['hour' => Carbon::parse($hourKey)->toIso8601String()];
            foreach ($dayHours as $userId => $hours) {
                $row["a{$userId}"] = $hours[$hourKey] ?? 0;
            }

            return $row;
        }, $hourKeys);

        return [
            'ranking' => $ranking,
            'hourly' => $hourly,
        ];
    }

    /** The last 24 clock hours, current hour included, keyed "Y-m-d H:00", all zero. */
    private static function emptyHours(): array
    {
        $start = now()->startOfHour()->subHours(23);

        $hours = [];
        for ($i = 0; $i < 24; $i++) {
            $hour = $start->copy()->addHours($i);
            $hours[$hour->format('Y-m-d H:00')] = ['hour' => $hour->toIso8601String(), 'dead' => 0, 'injured' => 0, 'missing' => 0];
        }

        return $hours;
    }

    private static function barangayRows(array $byAccount): array
    {
        $users = User::whereIn('id', array_filter(array_keys($byAccount)))
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        $rows = [];
        foreach ($byAccount as $userId => $counts) {
            $user = $users->get($userId);
            $row = [
                'name' => $user?->name ?? 'Unknown account',
                'office' => self::isOffice($user),
                'dead' => $counts['dead'] ?? 0,
                'injured' => $counts['injured'] ?? 0,
                'missing' => $counts['missing'] ?? 0,
            ];
            $row['total'] = $row['dead'] + $row['injured'] + $row['missing'];
            $rows[] = $row;
        }

        usort($rows, fn ($a, $b) => [$b['total'], $a['name']] <=> [$a['total'], $b['name']]);

        return $rows;
    }

    /** City office (not barangay) account: anything outside the @barangay.local domain. */
    public static function isOffice(?User $user): bool
    {
        return $user ? ! str_ends_with(strtolower($user->email), '@barangay.local') : false;
    }

    /** One row per calendar day from the first to the last report, gaps filled with zeros. */
    private static function trendRows(array $byDay): array
    {
        if (empty($byDay)) {
            return [];
        }

        ksort($byDay);
        $period = CarbonPeriod::create(Carbon::parse(array_key_first($byDay)), Carbon::parse(array_key_last($byDay)));

        $rows = [];
        foreach ($period as $date) {
            $key = $date->toDateString();
            $rows[] = [
                'date' => $key,
                'dead' => $byDay[$key]['dead'] ?? 0,
                'injured' => $byDay[$key]['injured'] ?? 0,
                'missing' => $byDay[$key]['missing'] ?? 0,
            ];
        }

        return $rows;
    }

    private static function empty(): array
    {
        return [
            'totals' => ['dead' => 0, 'injured' => 0, 'missing' => 0, 'total' => 0],
            'last24h' => ['dead' => 0, 'injured' => 0, 'missing' => 0],
            'byBarangay' => [],
            'trend' => [],
            'hourly' => [],
            'barangays24h' => ['ranking' => [], 'hourly' => []],
            'generatedAt' => now()->toIso8601String(),
        ];
    }
}
