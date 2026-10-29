<?php

namespace App\Http\Controllers;

use App\Models\Modification;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Services\Barangays;
use App\Services\ReportHistory;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PreEmptiveReportController extends Controller
{
    use ValidatesDisasterStatus;

    /**
     * Save Pre-Emptive Reports (Modern Form API)
     */
    public function saveReports(Request $request)
    {
        $user = Auth::user();
        if (! $user->hasRole('admin') && ! $user->hasPermissionTo('access-pre-emptive-form')) {
            abort(403, 'Unauthorized access to pre-emptive evacuation form');
        }
        // A barangay edits only its own rows; city offices (CDRRMO, CSWDO) may correct any barangay's.
        $isBarangay = Barangays::accounts()->has($user->id);

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'reports' => 'required|array',
            'reports.*.id' => 'nullable',
            'reports.*.barangay' => ['nullable', 'string', 'max:255', Barangays::rule(Barangays::storedOn(PreEmptiveReport::class, $request->input('reports')))],
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
            $reportId = $reportData['id'] ?? null;

            // Skip empty new rows. The barangay alone doesn't count: new rows start with it filled in.
            // Saved rows always go through, since clearing one is the only way to correct it (no delete).
            $isEmpty = empty(array_filter($reportData, function ($value, $key) {
                return ! in_array($key, ['id', 'barangay'], true) && ! is_null($value) && $value !== '' && $value !== 0 && $value !== '0';
            }, ARRAY_FILTER_USE_BOTH));

            if ($isEmpty && ! is_numeric($reportId)) {
                continue;
            }

            // Totals are always the sum of inside and outside counts, computed here only.
            $reportData['total_families'] = (int) ($reportData['families'] ?? 0) + (int) ($reportData['outside_families'] ?? 0);
            $reportData['total_persons'] = (int) ($reportData['persons'] ?? 0) + (int) ($reportData['outside_persons'] ?? 0);

            // A barangay reports for itself only, whatever name the row carries.
            $reportData['barangay'] = $isBarangay ? $user->name : Barangays::forRow($reportData['barangay'] ?? null, $user);

            if ($reportId && is_numeric($reportId)) {
                // Update existing report
                $reportQuery = PreEmptiveReport::where('id', $reportId)->where('disaster_id', $activeTyphoon->id)
                    ->when($isBarangay, fn ($query) => $query->ofBarangay($user, 'write'));

                $report = $reportQuery->first();

                if ($report) {
                    // Only update fields that have changed
                    $fieldsToUpdate = [];

                    if ($report->barangay !== ($reportData['barangay'] ?? null)) {
                        $fieldsToUpdate['barangay'] = $reportData['barangay'] ?? null;
                    }
                    if ($report->evacuation_center !== ($reportData['evacuation_center'] ?? null)) {
                        $fieldsToUpdate['evacuation_center'] = $reportData['evacuation_center'] ?? null;
                    }
                    if ($report->families != ($reportData['families'] ?? null)) {
                        $fieldsToUpdate['families'] = $reportData['families'] ?? null;
                    }
                    if ($report->persons != ($reportData['persons'] ?? null)) {
                        $fieldsToUpdate['persons'] = $reportData['persons'] ?? null;
                    }
                    if ($report->outside_center !== ($reportData['outside_center'] ?? null)) {
                        $fieldsToUpdate['outside_center'] = $reportData['outside_center'] ?? null;
                    }
                    if ($report->outside_families != ($reportData['outside_families'] ?? null)) {
                        $fieldsToUpdate['outside_families'] = $reportData['outside_families'] ?? null;
                    }
                    if ($report->outside_persons != ($reportData['outside_persons'] ?? null)) {
                        $fieldsToUpdate['outside_persons'] = $reportData['outside_persons'] ?? null;
                    }
                    if ($report->total_families != ($reportData['total_families'] ?? null)) {
                        $fieldsToUpdate['total_families'] = $reportData['total_families'] ?? null;
                    }
                    if ($report->total_persons != ($reportData['total_persons'] ?? null)) {
                        $fieldsToUpdate['total_persons'] = $reportData['total_persons'] ?? null;
                    }

                    // Always update disaster_id and updated_by
                    $fieldsToUpdate['disaster_id'] = $activeTyphoon->id;
                    $fieldsToUpdate['updated_by'] = Auth::id();

                    // Only call update if there are changes
                    if (count($fieldsToUpdate) > 2) { // More than just disaster_id and updated_by
                        $report->update($fieldsToUpdate);
                    }
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
                    'disaster_id' => $activeTyphoon->id,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
                $savedReports[] = $report;
            }
        }

        // Return the fresh data (after save) so the frontend can reflect the changes
        // Same rows the page shows, so saving doesn't hide the other barangays from an office account.
        $reloadedQuery = PreEmptiveReport::where('disaster_id', $activeTyphoon->id)
            ->when($isBarangay, fn ($query) => $query->ofBarangay($user));

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
            $user = Auth::user();
            $modifications = Modification::forActiveDisaster(PreEmptiveReport::class)
                // A barangay gets the edit history of its own rows only, as on the form.
                ->when(Barangays::accounts()->has($user->id), fn ($query) => $query->whereIn('model_id', PreEmptiveReport::ofBarangay($user)->select('id')))
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

                if (! is_array($changedFields)) {
                    continue;
                }

                // Each modification can have multiple field changes
                foreach ($changedFields as $fieldName => $fieldData) {
                    $key = "{$mod->model_id}_{$fieldName}";

                    if (! isset($history[$key])) {
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
                'history' => (object) $history,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching PreEmptive modifications: '.$e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'history' => (object) [],
                'error' => 'Could not load the modification history.',
            ]);
        }
    }

    /**
     * Get Pre-Emptive Reports History
     */
    public function getPreEmptiveHistory(): JsonResponse
    {
        // As on the form: a barangay sees its own rows and those an office filed under its name;
        // city offices see every barangay's.
        $user = Auth::user();

        return response()->json(ReportHistory::forUser(
            PreEmptiveReport::class,
            ['barangay', 'evacuation_center', 'families', 'persons', 'outside_center', 'outside_families', 'outside_persons', 'total_families', 'total_persons'],
            $user,
            ownAccountsOnly: Barangays::accounts()->has($user->id),
            rows: fn ($query) => $query->ofBarangay($user),
        ));
    }
}
