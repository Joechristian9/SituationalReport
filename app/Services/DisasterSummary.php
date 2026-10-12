<?php

namespace App\Services;

use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;

/**
 * Totals for one disaster, shown in the Disaster Management "View details" dialog:
 * human impact, evacuation and how much reporting it received.
 */
class DisasterSummary
{
    /** Every report table tied to a disaster (audit_logs is not a report). */
    public const REPORT_TABLES = [
        'weather_reports', 'water_levels', 'electricity_services', 'water_services', 'communications',
        'roads', 'bridges', 'pre_emptive_reports', 'incident_monitored', 'casualties', 'injureds', 'missing',
        'damaged_house_reports', 'agriculture_reports', 'affected_tourists', 'suspension_of_classes',
        'suspension_of_works', 'usc_declarations', 'pre_positionings', 'response_operations',
        'assistance_extendeds', 'assistance_provided_lgus',
    ];

    /** Report tables without a user_id column, so they add to the count but not to the accounts. */
    private const WITHOUT_USER = ['agriculture_reports'];

    /**
     * @return array{impact: array<string, int>, evacuation: array<string, int>, reports: array<string, int>}
     */
    public static function for(Typhoon $disaster): array
    {
        $rows = fn (string $table) => DB::table($table)->where('disaster_id', $disaster->id);
        $evacuation = $rows('pre_emptive_reports')
            ->selectRaw('COALESCE(SUM(total_families), 0) as families, COALESCE(SUM(total_persons), 0) as persons')
            ->first();

        $total = 0;
        $accounts = collect();
        foreach (self::REPORT_TABLES as $table) {
            $total += $rows($table)->count();
            if (! in_array($table, self::WITHOUT_USER, true)) {
                $accounts = $accounts->merge($rows($table)->whereNotNull('user_id')->distinct()->pluck('user_id'));
            }
        }

        return [
            'impact' => [
                'dead' => $rows('casualties')->count(),
                'injured' => $rows('injureds')->count(),
                'missing' => $rows('missing')->count(),
                'housesDamaged' => (int) $rows('damaged_house_reports')->sum('total'),
            ],
            'evacuation' => [
                'families' => (int) $evacuation->families,
                'persons' => (int) $evacuation->persons,
            ],
            'reports' => [
                'total' => $total,
                'accounts' => $accounts->unique()->count(),
            ],
        ];
    }
}
