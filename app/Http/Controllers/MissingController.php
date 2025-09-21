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
     */
    public function index()
    {
        $missingList = Missing::latest()->get();

        // Assuming a dedicated view for missing persons, or part of a larger report
        return Inertia::render('IncidentMonitored/Index', [
            'missingList' => $missingList,
        ]);
    }

    /**
     * Store newly created missing person records in storage.
     * Handles bulk creation from the form.
     */
    public function store(Request $request)
    {
        // 2. Validate the 'missing' array and its fields
        $validated = $request->validate([
            'missing' => 'required|array',
            'missing.*.name' => 'nullable|string|max:255',
            'missing.*.age' => 'nullable|integer',
            'missing.*.sex' => 'nullable|string|max:255',
            'missing.*.address' => 'nullable|string',
            'missing.*.cause' => 'nullable|string', // Changed from diagnosis
            'missing.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['missing'] as $missingData) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter($missingData, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            // 3. Create a Missing record
            Missing::create([
                'name' => $missingData['name'] ?? null,
                'age' => $missingData['age'] ?? null,
                'sex' => $missingData['sex'] ?? null,
                'address' => $missingData['address'] ?? null,
                'cause' => $missingData['cause'] ?? null, // Changed from diagnosis
                'remarks' => $missingData['remarks'] ?? null,
                'user_id' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'Incidents Report saved successfully.');
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
    public function destroy(Missing $missing) {}
}
