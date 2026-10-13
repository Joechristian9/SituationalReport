<?php

namespace App\Traits;

use App\Models\ReportView;
use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Shared helpers for the admin "submissions" pages (casualties, injured, missing).
 */
trait BuildsSubmissionList
{
    /**
     * One submissions page: the records of the current disaster (active or paused; every
     * disaster when there is none), filtered, summarised and paged.
     *
     * @param  class-string<Model>  $model
     * @param  string  $category  ReportView type whose "new" badge this page clears
     * @param  array<int, string>  $searchColumns  columns the search box matches
     * @param  string  $prop  name of the paged records prop (casualties / injured / missing)
     */
    protected function submissionsPage(Request $request, string $model, string $category, array $searchColumns, string $component, string $prop): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        // Clear the "new reports" badge for this admin
        ReportView::markSeen($category);

        // Same disaster as the dashboard and the header, so a paused disaster still scopes the list.
        $disaster = Typhoon::getActiveTyphoon();
        $scope = $model::query()->when($disaster, fn (Builder $query) => $query->where('disaster_id', $disaster->id));

        $search = trim($filters['search'] ?? '');
        $like = '%'.addcslashes($search, '%_\\').'%';
        $query = (clone $scope)
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $match) use ($searchColumns, $like) {
                foreach ($searchColumns as $column) {
                    $match->orWhere($column, 'like', $like);
                }
            }))
            ->when($filters['user_id'] ?? null, fn (Builder $query, $userId) => $query->where('user_id', $userId))
            // Ranges on created_at itself (not DATE(created_at)) so the index can be used.
            ->when($filters['date_from'] ?? null, fn (Builder $query, $from) => $query->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['date_to'] ?? null, fn (Builder $query, $to) => $query->where('created_at', '<', Carbon::parse($to)->addDay()->startOfDay()));

        $perPage = $this->submissionPerPage($request);

        return Inertia::render($component, [
            $prop => (clone $query)
                ->with(['user:id,name', 'updater:id,name'])
                ->latest('created_at')
                ->latest('id')
                ->paginate($perPage)
                ->withQueryString(),
            'stats' => $this->submissionStats($query),
            // Only accounts that submitted here, and only on a full visit: filter changes and
            // live refreshes leave it out.
            'users' => fn () => User::query()
                ->whereIn('id', (clone $scope)->select('user_id')->distinct())
                ->orderBy('name')
                ->get(['id', 'name']),
            'disaster' => $disaster?->only(['id', 'name', 'status']),
            'filters' => [
                'search' => $filters['search'] ?? null,
                'user_id' => $filters['user_id'] ?? null,
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'per_page' => $perPage,
            ],
        ]);
    }

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
