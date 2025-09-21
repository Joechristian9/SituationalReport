<?php

namespace App\Http\Controllers;

use App\Models\Injured; // 1. Use the Injured model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InjuredController extends Controller
{
    /**
     * Display a listing of the injured records.
     *
     * In a real application, you might pass this to a different view
     * or handle it as part of a larger incident report page.
     */
    public function index()
    {
        $injuredList = Injured::latest()->get();

        // Assuming you have a component to display this data
        return Inertia::render('IncidentMonitored/Index', [
            'injuredList' => $injuredList,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Handles bulk creation from the form.
     */
    public function store(Request $request)
    {
        // 2. Validate the 'injured' array and its fields
        $validated = $request->validate([
            'injured' => 'required|array',
            'injured.*.name' => 'nullable|string|max:255',
            'injured.*.age' => 'nullable|integer',
            'injured.*.sex' => 'nullable|string|max:255',
            'injured.*.address' => 'nullable|string',
            'injured.*.diagnosis' => 'nullable|string',
            'injured.*.date_admitted' => 'nullable|date',
            'injured.*.place_of_incident' => 'nullable|string|max:255',
            'injured.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['injured'] as $injuredData) {
            // ✅ Skip rows where all values are null or empty (good practice)
            $isEmpty = empty(array_filter($injuredData, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            // 3. Create an Injured record instead of a Casualty
            Injured::create([
                'name' => $injuredData['name'] ?? null,
                'age' => $injuredData['age'] ?? null,
                'sex' => $injuredData['sex'] ?? null,
                'address' => $injuredData['address'] ?? null,
                'diagnosis' => $injuredData['diagnosis'] ?? null,
                'date_admitted' => $injuredData['date_admitted'] ?? null,
                'place_of_incident' => $injuredData['place_of_incident'] ?? null,
                'remarks' => $injuredData['remarks'] ?? null,
                'user_id' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'Injured records saved successfully.');
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Injured  $injured  // 4. Use route-model binding for Injured
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Injured $injured)
    {
        // 5. Validate the fields for a single injured record
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'sex' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'date_admitted' => 'nullable|date',
            'place_of_incident' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        $injured->update($validated);

        // Note: The 'updated_by' field is handled automatically by the boot() method in the Injured model.

        return back()->with('success', 'Injured record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Injured  $injured
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Injured $injured)
    {
        $injured->delete();

        return back()->with('success', 'Injured record deleted successfully.');
    }
}
