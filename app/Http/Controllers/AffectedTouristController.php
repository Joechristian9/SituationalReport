<?php

namespace App\Http\Controllers;

use App\Models\AffectedTourist; // 1. Use the AffectedTourist model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
     * Handles bulk creation from the form.
     */
    public function store(Request $request)
    {
        // 2. Validate the 'affected_tourists' array and its fields
        $validated = $request->validate([
            'affected_tourists' => 'required|array',
            'affected_tourists.*.province_city_municipality' => 'nullable|string|max:255',
            'affected_tourists.*.location' => 'nullable|string|max:255',
            'affected_tourists.*.local_tourists' => 'nullable|integer|min:0',
            'affected_tourists.*.foreign_tourists' => 'nullable|integer|min:0',
            'affected_tourists.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['affected_tourists'] as $touristData) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter($touristData, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            // 3. Create an AffectedTourist record
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

        return back()->with('success', 'Affected tourist records saved successfully.');
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
}
