<?php

namespace App\Http\Controllers;

use App\Models\IncidentMonitored;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IncidentMonitoredController extends Controller
{
    use ValidatesTyphoonStatus;
    /**
     * Show list of monitored incidents
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $incidentsQuery = IncidentMonitored::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $incidentsQuery->where('user_id', $user->id);
        }
        $incidents = $incidentsQuery->latest()->limit(200)->get();

        $casualtiesQuery = \App\Models\Casualty::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $casualtiesQuery->where('user_id', $user->id);
        }
        $casualties = $casualtiesQuery->latest()->limit(200)->get();

        $injuredQuery = \App\Models\Injured::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $injuredQuery->where('user_id', $user->id);
        }
        $injured = $injuredQuery->latest()->limit(200)->get();

        $missingQuery = \App\Models\Missing::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $missingQuery->where('user_id', $user->id);
        }
        $missing = $missingQuery->latest()->limit(200)->get();

        $affectedTouristsQuery = \App\Models\AffectedTourist::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $affectedTouristsQuery->where('user_id', $user->id);
        }
        $affectedTourists = $affectedTouristsQuery->latest()->limit(200)->get();

        $damagedHousesQuery = \App\Models\DamagedHouseReport::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $damagedHousesQuery->where('user_id', $user->id);
        }
        $damagedHouses = $damagedHousesQuery->latest()->limit(200)->get();

        $suspensionOfClassesQuery = \App\Models\SuspensionOfClass::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $suspensionOfClassesQuery->where('user_id', $user->id);
        }
        $suspensionOfClasses = $suspensionOfClassesQuery->latest()->limit(200)->get();

        $suspensionOfWorkQuery = \App\Models\SuspensionOfWork::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        if ($user && !$user->isAdmin()) {
            $suspensionOfWorkQuery->where('user_id', $user->id);
        }
        $suspensionOfWork = $suspensionOfWorkQuery->latest()->limit(200)->get();

        return Inertia::render('IncidentMonitored/Index', [
            'incidents' => $incidents,
            'casualties' => $casualties,
            'injured' => $injured,
            'missing' => $missing,
            'affectedTourists' => $affectedTourists,
            'damagedHouses' => $damagedHouses,
            'suspensionOfClasses' => $suspensionOfClasses,
            'suspensionOfWork' => $suspensionOfWork,
        ]);
    }

    /**
     * Store monitored incidents
     */
    public function store(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

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
                // Update existing record (only own records for non-admin users)
                $incidentQuery = IncidentMonitored::where('id', $incident['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $incidentQuery->where('user_id', $user->id);
                }

                $incidentMonitored = $incidentQuery->first();
                if ($incidentMonitored) {
                    $incidentMonitored->update($data);
                    $savedIncidents[] = $incidentMonitored->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $data['typhoon_id'] = $activeTyphoon->id;
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
