<?php

namespace App\Services;

use App\Models\Typhoon;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Model;

/**
 * What every "Report History" page reads: one page of disasters, newest first, each with
 * its reports: { data: [{ typhoon, reports[] }], meta: { current_page, last_page, per_page, total } }.
 * The page is read from the request: `page`, `per_page` (one of PER_PAGE) and `search`.
 */
class ReportHistory
{
    /** Disasters per page the history pages offer; the first is the default. */
    public const PER_PAGE = [5, 10, 20, 50];

    /**
     * The history of one report type for a user. Loads only the columns the page shows, and
     * only the reports of the disasters on this page. Admins read every account's reports.
     *
     * @param  class-string<Model>  $model
     * @param  array<int, string>  $fields  report columns to send, besides id, timestamps and user
     * @param  array<int, string>  $with  extra relations the $extra closure needs
     * @param  bool  $ownAccountsOnly  false for lists every account shares (one per disaster)
     * @param  Closure|null  $extra  (report) => extra values for a report, e.g. related rows
     */
    public static function forUser(string $model, array $fields, User $user, array $with = [], bool $ownAccountsOnly = true, ?Closure $extra = null): array
    {
        $limitToAccounts = $ownAccountsOnly && ! $user->isAdmin();
        $accountIds = $limitToAccounts ? $user->getAccessibleUserIds('read') : [];
        $request = request();
        $perPage = in_array((int) $request->query('per_page'), self::PER_PAGE, true) ? (int) $request->query('per_page') : self::PER_PAGE[0];
        $search = trim((string) $request->query('search', ''));

        $disasters = Typhoon::query()
            ->select('id', 'name', 'disaster_type', 'status', 'started_at', 'ended_at')
            // A report whose disaster was deleted has nothing to be listed under.
            ->whereIn('id', $model::query()->select('disaster_id')->when($limitToAccounts, fn ($query) => $query->whereIn('user_id', $accountIds)))
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.addcslashes($search, '%_\\').'%';
                $query->where(fn ($match) => $match->where('name', 'like', $like)->orWhere('disaster_type', 'like', $like));
            })
            ->orderByDesc('started_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        $reports = $disasters->isEmpty() ? collect() : $model::query()
            ->select(array_values(array_unique(['id', 'disaster_id', 'user_id', 'created_at', 'updated_at', ...$fields])))
            ->whereIn('disaster_id', $disasters->pluck('id'))
            ->when($limitToAccounts, fn ($query) => $query->whereIn('user_id', $accountIds))
            ->with(['user:id,name', ...$with])
            ->latest()
            ->get()
            ->groupBy('disaster_id');

        return [
            'data' => $disasters->getCollection()->map(fn (Typhoon $typhoon) => [
                'typhoon' => $typhoon,
                'reports' => ($reports[$typhoon->id] ?? collect())->map(fn ($report) => array_merge(
                    ['id' => $report->id],
                    $report->only($fields),
                    $extra ? $extra($report) : [],
                    ['created_at' => $report->created_at, 'updated_at' => $report->updated_at, 'user' => $report->user],
                ))->values()->all(),
            ])->values()->all(),
            'meta' => [
                'current_page' => $disasters->currentPage(),
                'last_page' => $disasters->lastPage(),
                'per_page' => $disasters->perPage(),
                'total' => $disasters->total(),
            ],
        ];
    }
}
