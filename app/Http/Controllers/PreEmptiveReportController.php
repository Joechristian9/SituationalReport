<?php

namespace App\Http\Controllers;

use App\Models\PreEmptiveReport;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PreEmptiveReportController extends Controller
{
    use ValidatesTyphoonStatus;

    /**
     * Show list of Pre-Emptive Reports
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $reportsQuery = PreEmptiveReport::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $reportsQuery->where('user_id', $user->id);
        }

        $reports = $reportsQuery->latest()->limit(200)->get();

        return Inertia::render('PreEmptiveReports/Index', [
            'initialReports' => $reports,
        ]);
    }

    /**
     * Store Pre-Emptive Reports
     */
    public function store(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'reports' => 'required|array',

            'reports.*.barangay'          => 'nullable|string|max:255',
            'reports.*.evacuation_center' => 'nullable|string|max:255',
            'reports.*.families'          => 'nullable|integer|min:0',
            'reports.*.persons'           => 'nullable|integer|min:0',
            'reports.*.outside_center'    => 'nullable|string|max:255',
            'reports.*.outside_families'  => 'nullable|integer|min:0',
            'reports.*.outside_persons'   => 'nullable|integer|min:0',
            'reports.*.total_families'    => 'nullable|integer|min:0',
            'reports.*.total_persons'     => 'nullable|integer|min:0',
        ]);

        foreach ($validated['reports'] as $report) {
            // ✅ Skip rows where all values are null, empty, or 0
            $isEmpty = empty(array_filter($report, function ($value) {
                return !is_null($value) && $value !== '' && $value !== 0 && $value !== '0';
            }));

            if ($isEmpty) {
                continue;
            }

            PreEmptiveReport::create([
                'barangay'          => $report['barangay'] ?? null,
                'evacuation_center' => $report['evacuation_center'] ?? null,
                'families'          => $report['families'] ?? null,
                'persons'           => $report['persons'] ?? null,
                'outside_center'    => $report['outside_center'] ?? null,
                'outside_families'  => $report['outside_families'] ?? null,
                'outside_persons'   => $report['outside_persons'] ?? null,
                'total_families'    => $report['total_families'] ?? null,
                'total_persons'     => $report['total_persons'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
                'typhoon_id'        => $activeTyphoon->id,
            ]);
        }

        return back()->with('success', 'Pre-Emptive Reports saved successfully.');
    }

    /**
     * Update specific Pre-Emptive Report
     */
    public function update(Request $request, PreEmptiveReport $preEmptiveReport)
    {
        $validated = $request->validate([
            'barangay'          => 'nullable|string|max:255',
            'evacuation_center' => 'nullable|string|max:255',
            'families'          => 'nullable|integer|min:0',
            'persons'           => 'nullable|integer|min:0',
            'outside_center'    => 'nullable|string|max:255',
            'outside_families'  => 'nullable|integer|min:0',
            'outside_persons'   => 'nullable|integer|min:0',
            'total_families'    => 'nullable|integer|min:0',
            'total_persons'     => 'nullable|integer|min:0',
        ]);

        $preEmptiveReport->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Pre-Emptive Report updated successfully.');
    }

    /**
     * Save Pre-Emptive Reports (Modern Form API)
     */
    public function saveReports(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'reports' => 'required|array',
            'reports.*.id' => 'nullable',
            'reports.*.barangay' => 'nullable|string|max:255',
            'reports.*.evacuation_center' => 'nullable|string|max:255',
            'reports.*.families' => 'nullable|integer|min:0',
            'reports.*.persons' => 'nullable|integer|min:0',
            'reports.*.outside_center' => 'nullable|string|max:255',
            'reports.*.outside_families' => 'nullable|integer|min:0',
            'reports.*.outside_persons' => 'nullable|integer|min:0',
            'reports.*.total_families' => 'nullable|integer|min:0',
            'reports.*.total_persons' => 'nullable|integer|min:0',
        ]);

        $savedReports = [];

        foreach ($validated['reports'] as $reportData) {
            // Skip empty rows
            $isEmpty = empty(array_filter($reportData, function ($value, $key) {
                return $key !== 'id' && !is_null($value) && $value !== '' && $value !== 0 && $value !== '0';
            }, ARRAY_FILTER_USE_BOTH));

            if ($isEmpty) {
                continue;
            }

            $reportId = $reportData['id'] ?? null;
            
            if ($reportId && is_numeric($reportId)) {
                // Update existing report
                $reportQuery = PreEmptiveReport::where('id', $reportId);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $reportQuery->where('user_id', $user->id);
                }

                $report = $reportQuery->first();

                if ($report) {
                    $report->update([
                        'barangay' => $reportData['barangay'] ?? null,
                        'evacuation_center' => $reportData['evacuation_center'] ?? null,
                        'families' => $reportData['families'] ?? null,
                        'persons' => $reportData['persons'] ?? null,
                        'outside_center' => $reportData['outside_center'] ?? null,
                        'outside_families' => $reportData['outside_families'] ?? null,
                        'outside_persons' => $reportData['outside_persons'] ?? null,
                        'total_families' => $reportData['total_families'] ?? null,
                        'total_persons' => $reportData['total_persons'] ?? null,
                        'typhoon_id' => $activeTyphoon->id,
                        'updated_by' => Auth::id(),
                    ]);
                    $savedReports[] = $report->fresh();
                }
            } else {
                // Create new report
                $report = PreEmptiveReport::create([
                    'barangay' => $reportData['barangay'] ?? null,
                    'evacuation_center' => $reportData['evacuation_center'] ?? null,
                    'families' => $reportData['families'] ?? null,
                    'persons' => $reportData['persons'] ?? null,
                    'outside_center' => $reportData['outside_center'] ?? null,
                    'outside_families' => $reportData['outside_families'] ?? null,
                    'outside_persons' => $reportData['outside_persons'] ?? null,
                    'total_families' => $reportData['total_families'] ?? null,
                    'total_persons' => $reportData['total_persons'] ?? null,
                    'typhoon_id' => $activeTyphoon->id,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
                $savedReports[] = $report;
            }
        }

        // Return the fresh data (after save) so the frontend can reflect the changes
        $reloadedQuery = PreEmptiveReport::where('typhoon_id', $activeTyphoon->id);

        $user = Auth::user();
        if ($user && !$user->isAdmin()) {
            $reloadedQuery->where('user_id', $user->id);
        }

        $reloaded = $reloadedQuery->latest()->limit(200)->get();

        return response()->json([
            'message' => 'Pre-Emptive Reports saved successfully.',
            'reports' => $reloaded,
        ]);
    }

    /**
     * Get modification history (Modern Form API)
     */
    public function getModifications()
    {
        try {
            // Fetch modifications for pre-emptive reports
            $modifications = Modification::where('model_type', 'PreEmptiveReport')
                ->with('user:id,name')
                ->latest()
                ->get();

            // Group by row ID and field
            $history = [];
            
            foreach ($modifications as $mod) {
                // Parse the changed_fields JSON
                $changedFields = is_string($mod->changed_fields) 
                    ? json_decode($mod->changed_fields, true) 
                    : $mod->changed_fields;
                
                if (!is_array($changedFields)) {
                    continue;
                }
                
                // Each modification can have multiple field changes
                foreach ($changedFields as $fieldName => $fieldData) {
                    $key = "{$mod->model_id}_{$fieldName}";
                    
                    if (!isset($history[$key])) {
                        $history[$key] = [];
                    }
                    
                    $history[$key][] = [
                        'user' => $mod->user ?? ['name' => $fieldData['user']['name'] ?? 'Unknown'],
                        'field' => $fieldName,
                        'old' => $fieldData['old'] ?? null,
                        'new' => $fieldData['new'] ?? null,
                        'date' => $mod->created_at,
                    ];
                }
            }

            // Force JSON to return an object, not an array, even when empty
            return response()->json([
                'history' => (object)$history,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching PreEmptive modifications: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'history' => (object)[],
                'error' => $e->getMessage()
            ]);
        }
    }
}
