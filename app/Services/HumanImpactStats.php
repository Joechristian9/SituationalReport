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

        foreach (self::TYPES as $type => $model) {
            $base = $model::query()->where('disaster_id', $disaster->id);

            $totals[$type] = (clone $base)->count();
            $last24h[$type] = (clone $base)->where('created_at', '>=', $since)->count();

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
            'generatedAt' => now()->toIso8601String(),
        ];
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
                'office' => $user ? ! str_ends_with(strtolower($user->email), '@barangay.local') : false,
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
            'generatedAt' => now()->toIso8601String(),
        ];
    }
}
