<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Collection;

/**
 * The shape every "Report History" page reads: a list of
 * { typhoon, reports[] }, one entry per disaster, newest disaster first.
 */
class ReportHistory
{
    /**
     * @param  Collection  $reports  reports with `typhoon` and `user:id,name` loaded
     * @param  array<int, string>  $fields  report columns to send, besides id, timestamps and user
     * @param  Closure|null  $extra  (report) => extra values for a report, e.g. related rows
     */
    public static function byDisaster(Collection $reports, array $fields, ?Closure $extra = null): array
    {
        return $reports
            // A report whose disaster was deleted has nothing to be listed under.
            ->filter(fn ($report) => $report->typhoon !== null)
            ->groupBy('disaster_id')
            ->map(fn (Collection $group) => [
                'typhoon' => $group->first()->typhoon,
                'reports' => $group->map(fn ($report) => array_merge(
                    ['id' => $report->id],
                    $report->only($fields),
                    $extra ? $extra($report) : [],
                    ['created_at' => $report->created_at, 'updated_at' => $report->updated_at, 'user' => $report->user],
                ))->values()->all(),
            ])
            ->sortByDesc(fn (array $group) => $group['typhoon']->started_at)
            ->values()
            ->all();
    }
}
