<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Typhoon;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs with filtering and search
     */
    public function index(Request $request)
    {
        $query = $this->filteredQuery($request);

        // Pagination (limited to the options the page offers)
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, [5, 10, 20, 50], true)) {
            $perPage = 20;
        }
        // Every column the list shows except user_agent (long, only in the detail view).
        $logs = $query
            ->select(['id', 'user_id', 'action', 'auditable_type', 'auditable_id', 'old_values', 'new_values', 'ip_address', 'disaster_id', 'description', 'created_at'])
            ->paginate($perPage)
            ->withQueryString();

        // Transform data for frontend
        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'user' => [
                    'id' => $log->user?->id,
                    'name' => $log->user?->name ?? 'System',
                    'email' => $log->user?->email ?? 'system@system.local',
                ],
                'action' => $log->action,
                'action_name' => $log->action_name,
                'module' => $log->model_name,
                'auditable_type' => $log->auditable_type,
                'auditable_id' => $log->auditable_id,
                'disaster' => [
                    'id' => $log->disaster?->id,
                    'name' => $log->disaster?->name,
                ],
                'ip_address' => $log->ip_address,
                'description' => $log->description,
                'changes_count' => $log->changes_count,
                'created_at' => $log->created_at->format('M d, Y, h:i A'),
                'created_at_iso' => $log->created_at->toIso8601String(),
                'created_at_human' => $log->created_at->diffForHumans(),
            ];
        });

        return Inertia::render('Admin/AuditLogs', [
            'logs' => $logs,
            'summary' => $this->todaySummary(),
            'filters' => [
                'search' => $request->input('search'),
                'user_id' => $request->input('user_id'),
                'action' => $request->input('action'),
                'module' => $request->input('module'),
                'disaster_id' => $request->input('disaster_id'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'per_page' => $perPage,
            ],
            // Four queries (two of them DISTINCT over the whole log), so only on a full visit:
            // filter changes and live refreshes leave them out.
            'filterOptions' => fn () => $this->filterOptions(),
        ]);
    }

    /** The choices in the filter dropdowns. */
    private function filterOptions(): array
    {
        return [
            'users' => User::orderBy('name')->get(['id', 'name', 'email']),
            'disasters' => Typhoon::orderBy('created_at', 'desc')->get(['id', 'name']),
            'actions' => AuditLog::query()
                ->distinct()
                ->orderBy('action')
                ->pluck('action')
                ->map(fn ($action) => ['value' => $action, 'label' => (new AuditLog(['action' => $action]))->action_name]),
            'modules' => AuditLog::query()
                ->whereNotNull('auditable_type')
                ->distinct()
                ->pluck('auditable_type')
                ->map(fn ($type) => ['value' => $type, 'label' => (new AuditLog(['auditable_type' => $type]))->model_name])
                ->sortBy('label')
                ->values(),
        ];
    }

    /** Today's activity (not affected by the filters), in one query over today's rows only. */
    private function todaySummary(): array
    {
        $row = AuditLog::query()
            ->where('created_at', '>=', Carbon::today())
            ->where('created_at', '<', Carbon::tomorrow())
            ->toBase()
            ->selectRaw("
                COUNT(*) as events,
                SUM(CASE WHEN action IN ('created', 'updated', 'deleted') THEN 1 ELSE 0 END) as changes,
                COUNT(DISTINCT user_id) as active_users,
                SUM(CASE WHEN action = 'failed_login' THEN 1 ELSE 0 END) as failed_logins
            ")
            ->first();

        return [
            'events' => (int) ($row->events ?? 0),
            'changes' => (int) ($row->changes ?? 0),
            'active_users' => (int) ($row->active_users ?? 0),
            'failed_logins' => (int) ($row->failed_logins ?? 0),
        ];
    }

    /**
     * Audit log query with the page's filters applied (shared by the list and the export)
     */
    private function filteredQuery(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $query = AuditLog::with(['user:id,name,email', 'disaster:id,name'])
            ->orderBy('created_at', 'desc');

        // Search functionality (% and _ in the search are matched literally)
        if ($search = trim((string) $request->input('search'))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($q) use ($like) {
                $q->where('action', 'like', $like)
                    ->orWhere('auditable_type', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('ip_address', 'like', $like)
                    ->orWhereHas('user', function ($q) use ($like) {
                        $q->where('name', 'like', $like)
                            ->orWhere('email', 'like', $like);
                    });
            });
        }

        // Filter by user
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        // Filter by action
        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        // Filter by model/module
        if ($module = $request->input('module')) {
            $query->where('auditable_type', $module);
        }

        // Filter by disaster
        if ($disasterId = $request->input('disaster_id')) {
            $query->where('disaster_id', $disasterId);
        }

        // Filter by date range: ranges on created_at itself so its index can be used; the
        // end date includes that whole day.
        if ($startDate = $request->date('start_date')) {
            $query->where('created_at', '>=', $startDate->startOfDay());
        }

        if ($endDate = $request->date('end_date')) {
            $query->where('created_at', '<', $endDate->addDay()->startOfDay());
        }

        return $query;
    }

    /**
     * Show detailed view of a specific audit log with before/after changes
     */
    public function show($id)
    {
        try {
            // The audited record itself is not shown, so it is not loaded.
            $log = AuditLog::with(['user:id,name,email', 'disaster:id,name'])
                ->findOrFail($id);

            $changes = [];

            // Format changes for display
            if ($log->action === 'updated' && $log->old_values && $log->new_values) {
                foreach ($log->new_values as $field => $newValue) {
                    $oldValue = $log->old_values[$field] ?? null;

                    // Only show if values actually changed
                    if ($oldValue != $newValue) {
                        $changes[] = [
                            'field' => AuditLogger::getFieldLabel($field),
                            'field_key' => $field,
                            'old_value' => AuditLogger::formatValue($oldValue),
                            'new_value' => AuditLogger::formatValue($newValue),
                        ];
                    }
                }
            } elseif ($log->action === 'created' && $log->new_values) {
                foreach ($log->new_values as $field => $value) {
                    $changes[] = [
                        'field' => AuditLogger::getFieldLabel($field),
                        'field_key' => $field,
                        'value' => AuditLogger::formatValue($value),
                    ];
                }
            } elseif ($log->action === 'deleted' && $log->old_values) {
                foreach ($log->old_values as $field => $value) {
                    $changes[] = [
                        'field' => AuditLogger::getFieldLabel($field),
                        'field_key' => $field,
                        'value' => AuditLogger::formatValue($value),
                    ];
                }
            }

            return response()->json([
                'log' => [
                    'id' => $log->id,
                    'user' => [
                        'id' => $log->user?->id,
                        'name' => $log->user?->name ?? 'System',
                        'email' => $log->user?->email ?? 'system@system.local',
                    ],
                    'action' => $log->action,
                    'action_name' => $log->action_name,
                    'module' => $log->model_name,
                    'auditable_type' => $log->auditable_type,
                    'auditable_id' => $log->auditable_id,
                    'disaster' => $log->disaster ? [
                        'id' => $log->disaster->id,
                        'name' => $log->disaster->name,
                    ] : null,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'description' => $log->description,
                    'created_at' => $log->created_at->format('F d, Y, h:i:s A'),
                    'created_at_human' => $log->created_at->diffForHumans(),
                ],
                'changes' => $changes,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading audit log details: '.$e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to load audit log details',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export the filtered audit logs as a CSV file (opens in Excel)
     */
    public function export(Request $request)
    {
        $query = $this->filteredQuery($request);

        // Log the export action
        AuditLogger::logExport(
            exportType: 'Audit Logs',
            description: 'Exported audit logs to CSV'
        );

        $filename = 'audit-logs-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            // UTF-8 BOM so Excel shows names with ñ and other accents correctly
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Date and time', 'User', 'Email', 'Action', 'Module', 'Record ID', 'Disaster', 'IP address', 'Description']);

            $query->chunk(500, function ($logs) use ($out) {
                foreach ($logs as $log) {
                    fputcsv($out, [
                        $log->created_at->format('Y-m-d H:i:s'),
                        $log->user?->name ?? 'System',
                        $log->user?->email ?? '',
                        $log->action_name,
                        $log->model_name,
                        $log->auditable_id,
                        $log->disaster?->name,
                        $log->ip_address,
                        $log->description,
                    ]);
                }
            });

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
