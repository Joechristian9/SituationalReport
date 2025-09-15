<?php

namespace App\Http\Controllers;

use App\Models\IncidentMonitored;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IncidentMonitoredController extends Controller
{
    /**
     * Show list of monitored incidents
     */
    public function index()
    {
        $incidents = IncidentMonitored::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'incidents' => $incidents,
        ]);
    }

    /**
     * Store monitored incidents
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'incidents' => 'required|array',

            'incidents.*.kinds_of_incident' => 'nullable|string|max:255',
            'incidents.*.date_time'         => 'nullable|date',
            'incidents.*.location'          => 'nullable|string|max:255',
            'incidents.*.description'       => 'nullable|string',
            'incidents.*.remarks'           => 'nullable|string|max:500',
        ]);

        foreach ($validated['incidents'] as $incident) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter($incident, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            IncidentMonitored::create([
                'kinds_of_incident' => $incident['kinds_of_incident'] ?? null,
                'date_time'         => $incident['date_time'] ?? null,
                'location'          => $incident['location'] ?? null,
                'description'       => $incident['description'] ?? null,
                'remarks'           => $incident['remarks'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);
        }

        return back()->with('success', 'Incidents saved successfully.');
    }

    /**
     * Update specific monitored incident
     */
    public function update(Request $request, IncidentMonitored $incidentMonitored)
    {
        $validated = $request->validate([
            'kinds_of_incident' => 'nullable|string|max:255',
            'date_time'         => 'nullable|date',
            'location'          => 'nullable|string|max:255',
            'description'       => 'nullable|string',
            'remarks'           => 'nullable|string|max:500',
        ]);

        $incidentMonitored->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Incident updated successfully.');
    }
}
