<?php

namespace App\Http\Controllers;

use App\Models\AffectedTourist;
use App\Models\Modification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AffectedTouristController extends Controller
{
    /**
     * Display a listing of the affected tourist records.
     */
    public function index()
    {
        $touristsList = AffectedTourist::latest()->get();

        // Assuming a dedicated view or part of a larger report
        return Inertia::render('IncidentMonitored/Index', [
            'touristsList' => $touristsList,
        ]);
    }

    /**
     * Store newly created affected tourist records in storage.
     * Handles bulk creation/update from the form with modification tracking.
     */
    public function store(Request $request)
    {
        // Stricter Validation Rules
        $validated = $request->validate([
            'affected_tourists' => 'required|array',
            'affected_tourists.*.id' => 'nullable|integer',
            'affected_tourists.*.province_city_municipality' => 'nullable|string|max:255',
            'affected_tourists.*.location' => 'nullable|string|max:255',
            'affected_tourists.*.local_tourists' => 'nullable|integer|min:0',
            'affected_tourists.*.foreign_tourists' => 'nullable|integer|min:0',
            'affected_tourists.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['affected_tourists'] as $touristData) {
            // If an ID exists and is numeric, try to find and update that specific record
            if (!empty($touristData['id']) && is_numeric($touristData['id'])) {
                $tourist = AffectedTourist::find($touristData['id']);
                if ($tourist) {
                    // Update existing record
                    $tourist->update([
                        'province_city_municipality' => $touristData['province_city_municipality'] ?? null,
                        'location' => $touristData['location'] ?? null,
                        'local_tourists' => $touristData['local_tourists'] ?? null,
                        'foreign_tourists' => $touristData['foreign_tourists'] ?? null,
                        'remarks' => $touristData['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]);
                } else {
                    // ID provided but doesn't exist in DB - treat as new record
                    // Skip empty rows
                    $isEmpty = empty(array_filter($touristData, function ($value) {
                        return !is_null($value) && $value !== '';
                    }));

                    if (!$isEmpty) {
                        AffectedTourist::create([
                            'province_city_municipality' => $touristData['province_city_municipality'] ?? null,
                            'location' => $touristData['location'] ?? null,
                            'local_tourists' => $touristData['local_tourists'] ?? null,
                            'foreign_tourists' => $touristData['foreign_tourists'] ?? null,
                            'remarks' => $touristData['remarks'] ?? null,
                            'user_id' => Auth::id(),
                            'updated_by' => Auth::id(),
                        ]);
                    }
                }
            }
            // If no ID or null, it's a new record. We create it.
            else {
                // Skip rows where all values are null or empty
                $isEmpty = empty(array_filter($touristData, function ($value) {
                    return !is_null($value) && $value !== '';
                }));

                if ($isEmpty) {
                    continue;
                }

                AffectedTourist::create([
                    'province_city_municipality' => $touristData['province_city_municipality'] ?? null,
                    'location' => $touristData['location'] ?? null,
                    'local_tourists' => $touristData['local_tourists'] ?? null,
                    'foreign_tourists' => $touristData['foreign_tourists'] ?? null,
                    'remarks' => $touristData['remarks'] ?? null,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        // Return the fresh data after save
        $updatedTourists = AffectedTourist::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Affected tourists saved successfully!',
            'affected_tourists' => $updatedTourists
        ]);
    }

    /**
     * Update the specified affected tourist record in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\AffectedTourist  $affectedTourist // 4. Use route-model binding for AffectedTourist
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, AffectedTourist $affectedTourist)
    {
        // 5. Validate the fields for a single affected tourist record
        $validated = $request->validate([
            'province_city_municipality' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'local_tourists' => 'nullable|integer|min:0',
            'foreign_tourists' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string',
        ]);

        $affectedTourist->update($validated);

        // The 'updated_by' field is handled automatically by the boot() method in the model.

        return back()->with('success', 'Affected tourist record updated successfully.');
    }

    /**
     * Remove the specified affected tourist record from storage.
     *
     * @param  \App\Models\AffectedTourist  $affectedTourist
     * @return \Illuminate\Http\RedirectResponse
     */
    /* public function destroy(AffectedTourist $affectedTourist)
    {
        $affectedTourist->delete();

        return back()->with('success', 'Affected tourist record deleted successfully.');
    } */

    /**
     * Get modification history for affected tourists
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'AffectedTourist')
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
