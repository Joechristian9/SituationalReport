<?php

namespace App\Http\Controllers;

use App\Models\Missing; // 1. Use the Missing model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MissingController extends Controller
{
    /**
     * Display a listing of the missing person records.
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $missingList = Missing::latest()->limit(200)->get();

        // Assuming a dedicated view for missing persons, or part of a larger report
        return Inertia::render('IncidentMonitored/Index', [
            'missingList' => $missingList,
        ]);
    }

    /**
     * Store newly created missing person records in storage.
     * Handles bulk creation and updates from the form.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'missing' => 'required|array',
            'missing.*.id'      => 'nullable',
            'missing.*.name'    => 'nullable|string|max:255',
            'missing.*.age'     => 'nullable|integer',
            'missing.*.sex'     => 'nullable|string|max:255',
            'missing.*.address' => 'nullable|string',
            'missing.*.cause'   => 'nullable|string',
            'missing.*.remarks' => 'nullable|string',
        ]);

        $savedMissing = [];

        foreach ($validated['missing'] as $missingData) {
            // Copy missing data but exclude sex and id for empty check
            $dataToCheck = $missingData;
            unset($dataToCheck['sex']);
            unset($dataToCheck['id']);

            // Remove empty values (null, '', whitespace, 0, '0')
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return !is_null($value)
                    && trim((string)$value) !== ''
                    && $value !== 0
                    && $value !== '0';
            });

            // If nothing left → means only sex was filled OR everything else empty/zero → skip
            if (empty($dataToCheck)) {
                continue;
            }

            $data = [
                'name'       => $missingData['name'] ?? null,
                'age'        => $missingData['age'] ?? null,
                'sex'        => $missingData['sex'] ?? null,
                'address'    => $missingData['address'] ?? null,
                'cause'      => $missingData['cause'] ?? null,
                'remarks'    => $missingData['remarks'] ?? null,
                'updated_by' => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($missingData['id']) && is_numeric($missingData['id'])) {
                // Update existing record
                $missingRecord = Missing::find($missingData['id']);
                if ($missingRecord) {
                    $missingRecord->update($data);
                    $savedMissing[] = $missingRecord->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $savedMissing[] = Missing::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Missing persons report saved successfully.',
                'missing' => $savedMissing,
            ]);
        }

        return back()->with('success', 'Missing persons report saved successfully.');
    }

    /**
     * Update the specified missing person record in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Missing  $missing // 4. Use route-model binding for Missing
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Missing $missing)
    {
        // 5. Validate the fields for a single missing record
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'sex' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'cause' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $missing->update($validated);

        // The 'updated_by' field is handled automatically by the boot() method in the Missing model.

        return back()->with('success', 'Missing person record updated successfully.');
    }

    /**
     * Remove the specified missing person record from storage.
     *
     * @param  \App\Models\Missing  $missing
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Missing $missing)
    {
        $missing->delete();

        return back()->with('success', 'Missing person record deleted successfully.');
    }

    /**
     * Get modification history for Missing records
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'Missing')
            ->with('user')
            ->latest()
            ->get();

        $history = [];

        foreach ($modifications as $mod) {
            foreach ($mod->changed_fields as $field => $change) {
                $key = "{$mod->model_id}_{$field}";

                if (!isset($history[$key])) {
                    $history[$key] = [];
                }

                $history[$key][] = [
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'user' => [
                        'id'   => $change['user']['id'] ?? null,
                        'name' => $change['user']['name'] ?? 'Unknown',
                    ],
                    'date' => $mod->created_at,
                ];
            }
        }

        return response()->json(['history' => $history]);
    }
}
