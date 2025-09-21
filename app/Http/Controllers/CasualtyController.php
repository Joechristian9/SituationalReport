<?php

namespace App\Http\Controllers;

use App\Models\Casualty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CasualtyController extends Controller
{
    /**
     * Show list of casualties
     */
    public function index()
    {
        $casualties = Casualty::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'casualties' => $casualties,
        ]);
    }

    /**
     * Store casualties
     */
    /**
     * Store casualties
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'casualties' => 'required|array',
            'casualties.*.name' => 'nullable|string|max:255',
            'casualties.*.age' => 'nullable|integer',
            'casualties.*.sex' => 'nullable|string|max:255',
            'casualties.*.address' => 'nullable|string|max:255',
            'casualties.*.cause_of_death' => 'nullable|string|max:255',
            'casualties.*.date_died' => 'nullable|date',
            'casualties.*.place_of_incident' => 'nullable|string|max:255',
        ]);

        foreach ($validated['casualties'] as $casualty) {
            // Copy casualty except "sex"
            $dataToCheck = $casualty;
            unset($dataToCheck['sex']);

            // Remove empty values (null, '', whitespace, 0)
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return !is_null($value) && trim((string)$value) !== '' && $value !== 0 && $value !== '0';
            });

            // If nothing left → means only sex was filled OR everything else empty/zero → skip
            if (empty($dataToCheck)) {
                continue;
            }

            // Otherwise save to DB
            Casualty::create([
                'name'              => $casualty['name'] ?? null,
                'age'               => $casualty['age'] ?? null,
                'sex'               => $casualty['sex'] ?? null,
                'address'           => $casualty['address'] ?? null,
                'cause_of_death'    => $casualty['cause_of_death'] ?? null,
                'date_died'         => $casualty['date_died'] ?? null,
                'place_of_incident' => $casualty['place_of_incident'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);
        }
        return back()->with('success', 'Casualties report saved successfully.');
    }
    /**
     * Update specific casualty
     */
    public function update(Request $request, Casualty $casualty)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'sex' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'cause_of_death' => 'nullable|string|max:255',
            'date_died' => 'nullable|date',
            'place_of_incident' => 'nullable|string|max:255',
        ]);

        $casualty->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Casualty updated successfully.');
    }
}
