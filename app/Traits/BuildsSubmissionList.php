<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Shared helpers for the admin "submissions" pages (casualties, injured, missing).
 */
trait BuildsSubmissionList
{
    /**
     * Rows-per-page from the request, limited to the options the UI offers.
     */
    protected function submissionPerPage(Request $request): int
    {
        $perPage = (int) $request->input('per_page', 20);

        return in_array($perPage, [5, 10, 20, 50], true) ? $perPage : 20;
    }

    /**
     * Summary figures for the filtered query (computed before pagination).
     */
    protected function submissionStats(Builder $query): array
    {
        $row = (clone $query)->toBase()
            ->reorder()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN LOWER(sex) = 'male' THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN LOWER(sex) = 'female' THEN 1 ELSE 0 END) as female,
                COUNT(DISTINCT user_id) as submitters,
                MAX(created_at) as latest_at
            ")
            ->first();

        return [
            'total' => (int) ($row->total ?? 0),
            'male' => (int) ($row->male ?? 0),
            'female' => (int) ($row->female ?? 0),
            'submitters' => (int) ($row->submitters ?? 0),
            'latest_at' => $row->latest_at ?? null,
        ];
    }
}
