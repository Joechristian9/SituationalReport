<?php

namespace App\Http\Controllers;

use App\Models\AssistanceExtended;
use App\Models\Modification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssistanceExtendedController extends Controller
{
    /**
     * Display a listing of the resource.
     * Optimized: Uses pagination for efficient data loading
     */
    public function index()
    {
        $assistances = AssistanceExtended::latest()->limit(100)->get();
        return inertia('AssistanceExtended/AssistanceIndex', [
            'assistances' => $assistances,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Optimized: Validates and saves with ID tracking for updates
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'assistances' => 'required|array',
            'assistances.*.id' => ['nullable', 'integer'],
            'assistances.*.agency_officials_groups' => 'nullable|string|max:255',
            'assistances.*.type_kind_of_assistance' => 'nullable|string|max:255',
            'assistances.*.amount'                  => 'nullable|numeric|min:0',
            'assistances.*.beneficiaries'           => 'nullable|string|max:255',
        ]);

        foreach ($validated['assistances'] as $assistanceData) {
            // Skip empty rows
            if (empty(array_filter($assistanceData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($assistanceData['id']) && is_numeric($assistanceData['id'])) {
                $assistance = AssistanceExtended::find($assistanceData['id']);
                if ($assistance) {
                    $assistance->update([
                        'agency_officials_groups' => $assistanceData['agency_officials_groups'] ?? null,
                        'type_kind_of_assistance' => $assistanceData['type_kind_of_assistance'] ?? null,
                        'amount'                  => $assistanceData['amount'] ?? null,
                        'beneficiaries'           => $assistanceData['beneficiaries'] ?? null,
                        'updated_by'              => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                AssistanceExtended::create([
                    'agency_officials_groups' => $assistanceData['agency_officials_groups'] ?? null,
                    'type_kind_of_assistance' => $assistanceData['type_kind_of_assistance'] ?? null,
                    'amount'                  => $assistanceData['amount'] ?? null,
                    'beneficiaries'           => $assistanceData['beneficiaries'] ?? null,
                    'user_id'                 => Auth::id(),
                    'updated_by'              => Auth::id(),
                ]);
            }
        }

        // Return fresh data after save (limit to recent 100 records)
        $updatedAssistances = AssistanceExtended::with('user:id,name')
            ->where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Assistances saved successfully',
            'assistances' => $updatedAssistances
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AssistanceExtended $assistanceExtended)
    {
        $validated = $request->validate([
            'agency_officials_groups' => 'nullable|string|max:255',
            'type_kind_of_assistance' => 'nullable|string|max:255',
            'amount'                  => 'nullable|numeric|min:0',
            'beneficiaries'           => 'nullable|string|max:255', // ✅ FIXED (string)
        ]);

        $assistanceExtended->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Assistance updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssistanceExtended $assistanceExtended)
    {
        $assistanceExtended->delete();

        return redirect()->back()->with('success', 'Assistance deleted successfully.');
    }

    /**
     * Get modification history for assistance extended records
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'AssistanceExtended')
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
