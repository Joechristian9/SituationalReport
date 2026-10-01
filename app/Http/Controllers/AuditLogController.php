<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Typhoon;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

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
        if (!in_array($perPage, [5, 10, 20, 50], true)) {
            $perPage = 20;
        }
        $logs = $query->paginate($perPage)->withQueryString();

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

        // Get filter options
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $disasters = Typhoon::orderBy('created_at', 'desc')->get(['id', 'name']);

        // Get unique actions
        $actions = AuditLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->map(function ($action) {
                $log = new AuditLog(['action' => $action]);
                return [
                    'value' => $action,
                    'label' => $log->action_name,
                ];
            });

        // Get unique modules
        $modules = AuditLog::select('auditable_type')
            ->whereNotNull('auditable_type')
            ->distinct()
            ->get()
            ->map(function ($item) {
                $log = new AuditLog(['auditable_type' => $item->auditable_type]);
                return [
                    'value' => $item->auditable_type,
                    'label' => $log->model_name,
                ];
            })
            ->sortBy('label')
            ->values();

        // Today's activity (not affected by filters)
        $today = AuditLog::whereDate('created_at', Carbon::today());
        $summary = [
            'events' => (clone $today)->count(),
            'changes' => (clone $today)->whereIn('action', ['created', 'updated', 'deleted'])->count(),
            'active_users' => (clone $today)->whereNotNull('user_id')->distinct()->count('user_id'),
            'failed_logins' => (clone $today)->where('action', 'failed_login')->count(),
        ];

        return Inertia::render('Admin/AuditLogs', [
            'logs' => $logs,
            'summary' => $summary,
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
            'filterOptions' => [
                'users' => $users,
                'disasters' => $disasters,
                'actions' => $actions,
                'modules' => $modules,
            ],
        ]);
    }

    /**
     * Audit log query with the page's filters applied (shared by the list and the export)
     */
    private function filteredQuery(Request $request)
    {
        $query = AuditLog::with(['user:id,name,email', 'disaster:id,name'])
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('auditable_type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
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

        // Filter by date range
        if ($startDate = $request->input('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        return $query;
    }

    /**
     * Show detailed view of a specific audit log with before/after changes
     */
    public function show($id)
    {
        try {
            $log = AuditLog::with(['user:id,name,email', 'disaster:id,name', 'auditable'])
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
            \Log::error('Error loading audit log details: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to load audit log details',
                'message' => $e->getMessage()
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

        $filename = 'audit-logs-' . now()->format('Y-m-d-His') . '.csv';

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
