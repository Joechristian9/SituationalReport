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

        // Pagination
        $perPage = $request->input('per_page', 25);
        $logs = $query->paginate($perPage);

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

        return Inertia::render('Admin/AuditLogs', [
            'logs' => $logs,
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
     * Show detailed view of a specific audit log with before/after changes
     */
    public function show($id)
    {
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
                'disaster' => [
                    'id' => $log->disaster?->id,
                    'name' => $log->disaster?->name,
                ],
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'description' => $log->description,
                'created_at' => $log->created_at->format('F d, Y, h:i:s A'),
                'created_at_human' => $log->created_at->diffForHumans(),
            ],
            'changes' => $changes,
        ]);
    }

    /**
     * Export audit logs to Excel
     */
    public function export(Request $request)
    {
        // Log the export action
        AuditLogger::logExport(
            exportType: 'Audit Logs',
            description: 'Exported audit logs to Excel'
        );

        // TODO: Implement Excel export using Laravel Excel package
        return response()->json(['message' => 'Export functionality will be implemented']);
    }
}
