<?php

namespace App\Http\Controllers;

use App\Models\SuspensionOfClass;
use App\Models\Modification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SuspensionOfClassController extends Controller
{
    /**
     * Display a listing of the suspension of class records.
     */
    public function index()
    {
        $suspensionList = SuspensionOfClass::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'suspensionList' => $suspensionList,
        ]);
    }

    /**
     * Store newly created suspension of class records in storage.
     * Handles bulk creation/update from the form with modification tracking.
     */
    public function store(Request $request)
    {
        // Stricter Validation Rules
        $validated = $request->validate([
            'suspension_of_classes' => 'required|array',
            'suspension_of_classes.*.id' => 'nullable|integer',
            'suspension_of_classes.*.province_city_municipality' => 'nullable|string|max:255',
            'suspension_of_classes.*.level' => 'nullable|string|max:255',
            'suspension_of_classes.*.date_of_suspension' => 'nullable|date',
            'suspension_of_classes.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['suspension_of_classes'] as $suspensionData) {
            // If an ID exists and is numeric, try to find and update that specific record
            if (!empty($suspensionData['id']) && is_numeric($suspensionData['id'])) {
                $suspension = SuspensionOfClass::find($suspensionData['id']);
                if ($suspension) {
                    // Update existing record
                    $suspension->update([
                        'province_city_municipality' => $suspensionData['province_city_municipality'] ?? null,
                        'level'                      => $suspensionData['level'] ?? null,
                        'date_of_suspension'         => $suspensionData['date_of_suspension'] ?? null,
                        'remarks'                    => $suspensionData['remarks'] ?? null,
                        'updated_by'                 => Auth::id(),
                    ]);
                } else {
                    // ID provided but doesn't exist in DB - treat as new record
                    // Skip empty rows
                    $isEmpty = empty(array_filter($suspensionData, function ($value) {
                        return !is_null($value) && trim((string)$value) !== '';
                    }));

                    if (!$isEmpty) {
                        SuspensionOfClass::create([
                            'province_city_municipality' => $suspensionData['province_city_municipality'] ?? null,
                            'level'                      => $suspensionData['level'] ?? null,
                            'date_of_suspension'         => $suspensionData['date_of_suspension'] ?? null,
                            'remarks'                    => $suspensionData['remarks'] ?? null,
                            'user_id'                    => Auth::id(),
                            'updated_by'                 => Auth::id(),
                        ]);
                    }
                }
            }
            // If no ID or null, it's a new record. We create it.
            else {
                // Skip rows where all values are null or empty
                $isEmpty = empty(array_filter($suspensionData, function ($value) {
                    return !is_null($value) && trim((string)$value) !== '';
                }));

                if ($isEmpty) {
                    continue;
                }

                SuspensionOfClass::create([
                    'province_city_municipality' => $suspensionData['province_city_municipality'] ?? null,
                    'level'                      => $suspensionData['level'] ?? null,
                    'date_of_suspension'         => $suspensionData['date_of_suspension'] ?? null,
                    'remarks'                    => $suspensionData['remarks'] ?? null,
                    'user_id'                    => Auth::id(),
                    'updated_by'                 => Auth::id(),
                ]);
            }
        }

        // Return the fresh data after save
        $updatedSuspensions = SuspensionOfClass::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Suspension of classes saved successfully!',
            'suspension_of_classes' => $updatedSuspensions
        ]);
    }

    /**
     * Update the specified suspension of class record in storage.
     */
    public function update(Request $request, SuspensionOfClass $suspensionOfClass)
    {
        $validated = $request->validate([
            'province_city_municipality' => 'nullable|string|max:255',
            'level'                      => 'nullable|string|max:255',
            'date_of_suspension'         => 'nullable|date',
            'remarks'                    => 'nullable|string',
        ]);

        $suspensionOfClass->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Incidents Report saved successfully.');
    }

    /**
     * Remove the specified suspension of class record from storage.
     */
    /* public function destroy(SuspensionOfClass $suspensionOfClass)
    {
        $suspensionOfClass->delete();

        return back()->with('success', 'Suspension of Class record deleted successfully.');
    } */

    /**
     * Get modification history for suspension of classes
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'SuspensionOfClass')
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
