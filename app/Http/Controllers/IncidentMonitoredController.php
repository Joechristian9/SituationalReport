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
        $casualties = \App\Models\Casualty::latest()->get();
        $injured = \App\Models\Injured::latest()->get();
        $missing = \App\Models\Missing::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'incidents' => $incidents,
            'casualties' => $casualties,
            'injured' => $injured,
            'missing' => $missing,
        ]);
    }

    /**
     * Store monitored incidents
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'incidents' => 'required|array',
            'incidents.*.id'                => 'nullable',
            'incidents.*.kinds_of_incident' => 'nullable|string|max:255',
            'incidents.*.date_time'         => 'nullable|date',
            'incidents.*.location'          => 'nullable|string|max:255',
            'incidents.*.description'       => 'nullable|string',
            'incidents.*.remarks'           => 'nullable|string|max:500',
        ]);

        $savedIncidents = [];

        foreach ($validated['incidents'] as $incident) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter([
                $incident['kinds_of_incident'] ?? null,
                $incident['date_time'] ?? null,
                $incident['location'] ?? null,
                $incident['description'] ?? null,
                $incident['remarks'] ?? null,
            ]));

            if ($isEmpty) {
                continue;
            }

            $data = [
                'kinds_of_incident' => $incident['kinds_of_incident'] ?? null,
                'date_time'         => $incident['date_time'] ?? null,
                'location'          => $incident['location'] ?? null,
                'description'       => $incident['description'] ?? null,
                'remarks'           => $incident['remarks'] ?? null,
                'updated_by'        => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($incident['id']) && is_numeric($incident['id'])) {
                // Update existing record
                $incidentMonitored = IncidentMonitored::find($incident['id']);
                if ($incidentMonitored) {
                    $incidentMonitored->update($data);
                    $savedIncidents[] = $incidentMonitored->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $savedIncidents[] = IncidentMonitored::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Incidents Report saved successfully.',
                'incidents' => $savedIncidents,
            ]);
        }

        return back()->with('success', 'Incidents Report saved successfully.');
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

    /**
     * Get modification history for Incidents
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'IncidentMonitored')
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
