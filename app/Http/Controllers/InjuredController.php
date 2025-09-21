<?php

namespace App\Http\Controllers;

use App\Models\Injured;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InjuredController extends Controller
{
    /**
     * Display a listing of the injured records.
     */
    public function index()
    {
        $injuredList = Injured::latest()->get();

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
        $validated = $request->validate([
            'injured' => 'required|array',
            'injured.*.name'            => 'nullable|string|max:255',
            'injured.*.age'             => 'nullable|integer',
            'injured.*.sex'             => 'nullable|string|max:255',
            'injured.*.address'         => 'nullable|string',
            'injured.*.diagnosis'       => 'nullable|string',
            'injured.*.date_admitted'   => 'nullable|date',
            'injured.*.place_of_incident' => 'nullable|string|max:255',
            'injured.*.remarks'         => 'nullable|string',
        ]);

        foreach ($validated['injured'] as $injuredData) {
            // Copy injured data but exclude sex for empty check
            $dataToCheck = $injuredData;
            unset($dataToCheck['sex']);

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

            // Save injured record
            Injured::create([
                'name'              => $injuredData['name'] ?? null,
                'age'               => $injuredData['age'] ?? null,
                'sex'               => $injuredData['sex'] ?? null,
                'address'           => $injuredData['address'] ?? null,
                'diagnosis'         => $injuredData['diagnosis'] ?? null,
                'date_admitted'     => $injuredData['date_admitted'] ?? null,
                'place_of_incident' => $injuredData['place_of_incident'] ?? null,
                'remarks'           => $injuredData['remarks'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);
        }

        return back()->with('success', 'Incidents Report saved successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Injured $injured)
    {
        $validated = $request->validate([
            'name'              => 'nullable|string|max:255',
            'age'               => 'nullable|integer',
            'sex'               => 'nullable|string|max:255',
            'address'           => 'nullable|string',
            'diagnosis'         => 'nullable|string',
            'date_admitted'     => 'nullable|date',
            'place_of_incident' => 'nullable|string|max:255',
            'remarks'           => 'nullable|string',
        ]);

        $injured->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Injured record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Injured $injured)
    {
        $injured->delete();

        return back()->with('success', 'Injured record deleted successfully.');
    }
}
