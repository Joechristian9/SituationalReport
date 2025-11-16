<?php

namespace App\Http\Controllers;

use App\Models\DamagedHouseReport;
use App\Models\Modification;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DamagedHouseReportController extends Controller
{
    use ValidatesTyphoonStatus;
    /**
     * Display a listing of the resource.
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $damagedQuery = DamagedHouseReport::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $damagedQuery->where('user_id', $user->id);
        }

        $damagedHouses = $damagedQuery->latest()->limit(200)->get();

        return Inertia::render('IncidentMonitored/Index', [
            'damagedHouses' => $damagedHouses,
        ]);
    }

    /**
     * Store newly created resources in storage.
     * Handles bulk creation/update from the form with modification tracking.
     */
    public function store(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        // Stricter Validation Rules
        $validated = $request->validate([
            'damaged_houses' => 'required|array',
            'damaged_houses.*.id' => 'nullable|integer',
            'damaged_houses.*.barangay' => 'nullable|string|max:255',
            'damaged_houses.*.partially' => 'nullable|integer|min:0',
            'damaged_houses.*.totally' => 'nullable|integer|min:0',
        ]);

        foreach ($validated['damaged_houses'] as $reportData) {
            // If an ID exists and is numeric, try to find and update that specific record
            if (!empty($reportData['id']) && is_numeric($reportData['id'])) {
                $reportQuery = DamagedHouseReport::where('id', $reportData['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $reportQuery->where('user_id', $user->id);
                }

                $report = $reportQuery->first();

                if ($report) {
                    // Update existing record
                    $report->update([
                        'barangay' => $reportData['barangay'] ?? null,
                        'partially' => $reportData['partially'] ?? 0,
                        'totally' => $reportData['totally'] ?? 0,
                        'total' => ($reportData['partially'] ?? 0) + ($reportData['totally'] ?? 0),
                        'typhoon_id' => $activeTyphoon->id,
                        'updated_by' => Auth::id(),
                    ]);
                } else {
                    // ID provided but doesn't exist in DB - treat as new record
                    // Skip empty rows
                    if (is_null($reportData['barangay']) && ($reportData['partially'] ?? 0) == 0 && ($reportData['totally'] ?? 0) == 0) {
                        continue;
                    }

                    DamagedHouseReport::create([
                        'barangay' => $reportData['barangay'],
                        'partially' => $reportData['partially'] ?? 0,
                        'totally' => $reportData['totally'] ?? 0,
                        'total' => ($reportData['partially'] ?? 0) + ($reportData['totally'] ?? 0),
                        'user_id' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'typhoon_id' => $activeTyphoon->id,
                    ]);
                }
            }
            // If no ID or null, it's a new record. We create it.
            else {
                // Skip empty rows
                if (is_null($reportData['barangay']) && ($reportData['partially'] ?? 0) == 0 && ($reportData['totally'] ?? 0) == 0) {
                    continue;
                }

                DamagedHouseReport::create([
                    'barangay' => $reportData['barangay'],
                    'partially' => $reportData['partially'] ?? 0,
                    'totally' => $reportData['totally'] ?? 0,
                    'total' => ($reportData['partially'] ?? 0) + ($reportData['totally'] ?? 0),
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                    'typhoon_id' => $activeTyphoon->id,
                ]);
            }
        }

        // Return the fresh data after save
        $user = Auth::user();

        $updatedQuery = DamagedHouseReport::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedReports = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Damaged houses saved successfully!',
            'damaged_houses' => $updatedReports
        ]);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DamagedHouseReport $damagedHouseReport)
    {
        $validated = $request->validate([
            'barangay' => 'nullable|string|max:255',
            'partially' => 'nullable|integer|min:0',
            'totally' => 'nullable|integer|min:0',
        ]);

        // Add the server-calculated total
        $validated['total'] = ($validated['partially'] ?? 0) + ($validated['totally'] ?? 0);

        $damagedHouseReport->update($validated);
        // 'updated_by' is handled by the model's boot() method on update

        return back()->with('success', 'Damaged house record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    /*
    public function destroy(DamagedHouseReport $damagedHouseReport)
    {
        $damagedHouseReport->delete();

        return back()->with('success', 'Damaged house record deleted successfully.');
    }
    */

    /**
     * Get modification history for damaged houses
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'DamagedHouseReport')
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by model_id and field to track modifications per row
        $history = [];
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            foreach ($mod->changed_fields as $field => $change) {
                // Key format: "modelId_field" to track each row+field combination
                $key = $modelId . '_' . $field;
                $history[$key][] = [
                    'user' => $change['user'] ?? ['id' => $mod->user->id, 'name' => $mod->user->name],
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'date' => $mod->created_at,
                    'model_id' => $modelId,
                ];
            }
        }

        $latest = $modifications->first();
        if ($latest) {
            $latestChangedFields = [];
            foreach ($latest->changed_fields as $field => $change) {
                $latestChangedFields[$field] = [
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'user' => $change['user'] ?? ['id' => $latest->user->id, 'name' => $latest->user->name],
                ];
            }
            $latest->changed_fields = $latestChangedFields;
        }

        return response()->json([
            'history' => $history,
            'latest'  => $latest,
        ]);
    }
}
