<?php

namespace App\Http\Controllers;

use App\Models\Casualty;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CasualtyController extends Controller
{
    use ValidatesTyphoonStatus;
    /**
     * Show list of casualties
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $casualtiesQuery = Casualty::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $casualtiesQuery->where('user_id', $user->id);
        }

        $casualties = $casualtiesQuery->latest()->limit(200)->get();

        return Inertia::render('IncidentMonitored/Index', [
            'casualties' => $casualties,
        ]);
    }

    /**
     * Store casualties
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
            'casualties' => 'required|array',
            'casualties.*.id' => 'nullable',
            'casualties.*.name' => 'nullable|string|max:255',
            'casualties.*.age' => 'nullable|integer',
            'casualties.*.sex' => 'nullable|string|max:255',
            'casualties.*.address' => 'nullable|string|max:255',
            'casualties.*.cause_of_death' => 'nullable|string|max:255',
            'casualties.*.date_died' => 'nullable|date',
            'casualties.*.place_of_incident' => 'nullable|string|max:255',
        ]);

        $savedCasualties = [];

        foreach ($validated['casualties'] as $casualty) {
            // Copy casualty except "sex"
            $dataToCheck = $casualty;
            unset($dataToCheck['sex']);
            unset($dataToCheck['id']);

            // Remove empty values (null, '', whitespace, 0)
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return !is_null($value) && trim((string)$value) !== '' && $value !== 0 && $value !== '0';
            });

            // If nothing left → means only sex was filled OR everything else empty/zero → skip
            if (empty($dataToCheck)) {
                continue;
            }

            $data = [
                'name'              => $casualty['name'] ?? null,
                'age'               => $casualty['age'] ?? null,
                'sex'               => $casualty['sex'] ?? null,
                'address'           => $casualty['address'] ?? null,
                'cause_of_death'    => $casualty['cause_of_death'] ?? null,
                'date_died'         => $casualty['date_died'] ?? null,
                'place_of_incident' => $casualty['place_of_incident'] ?? null,
                'updated_by'        => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($casualty['id']) && is_numeric($casualty['id'])) {
                // Update existing record (only own records for non-admin users)
                $casualtyQuery = Casualty::where('id', $casualty['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $casualtyQuery->where('user_id', $user->id);
                }

                $casualtyRecord = $casualtyQuery->first();
                if ($casualtyRecord) {
                    $casualtyRecord->update($data);
                    $savedCasualties[] = $casualtyRecord->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $data['typhoon_id'] = $activeTyphoon->id;
                $savedCasualties[] = Casualty::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Casualties report saved successfully.',
                'casualties' => $savedCasualties,
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

    /**
     * Get modification history for Casualties
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'Casualty')
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
