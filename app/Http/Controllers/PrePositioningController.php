<?php

namespace App\Http\Controllers;

use App\Models\PrePositioning;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PrePositioningController extends Controller
{
    use ValidatesTyphoonStatus;
    /**
     * Show list of Pre-Positionings
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $prePositioningsQuery = PrePositioning::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $prePositioningsQuery->where('user_id', $user->id);
        }

        $prePositionings = $prePositioningsQuery->latest()->limit(200)->get();

        return Inertia::render('DeploymentOfResponse/Index', [
            'pre_positionings' => $prePositionings,
        ]);
    }

    /**
     * Store Pre-Positionings
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
            'pre_positionings' => 'required|array',
            'pre_positionings.*.id'                 => 'nullable',
            'pre_positionings.*.team_units'         => 'nullable|string|max:255',
            'pre_positionings.*.team_leader'        => 'nullable|string|max:255',
            'pre_positionings.*.personnel_deployed' => 'nullable|integer|min:0',
            'pre_positionings.*.response_assets'    => 'nullable|string|max:255',
            'pre_positionings.*.capability'         => 'nullable|string|max:255',
            'pre_positionings.*.area_of_deployment' => 'nullable|string|max:255',
        ]);

        $savedRecords = [];

        foreach ($validated['pre_positionings'] as $row) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter([
                $row['team_units'] ?? null,
                $row['team_leader'] ?? null,
                $row['personnel_deployed'] ?? null,
                $row['response_assets'] ?? null,
                $row['capability'] ?? null,
                $row['area_of_deployment'] ?? null,
            ]));

            if ($isEmpty) {
                continue;
            }

            $data = [
                'team_units'         => $row['team_units'] ?? null,
                'team_leader'        => $row['team_leader'] ?? null,
                'personnel_deployed' => $row['personnel_deployed'] ?? null,
                'response_assets'    => $row['response_assets'] ?? null,
                'capability'         => $row['capability'] ?? null,
                'area_of_deployment' => $row['area_of_deployment'] ?? null,
                'updated_by'         => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($row['id']) && is_numeric($row['id'])) {
                // Update existing record (only own records for non-admin users)
                $prePositioningQuery = PrePositioning::where('id', $row['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $prePositioningQuery->where('user_id', $user->id);
                }

                $prePositioning = $prePositioningQuery->first();
                if ($prePositioning) {
                    $prePositioning->update($data);
                    $savedRecords[] = $prePositioning->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $data['typhoon_id'] = $activeTyphoon->id;
                $savedRecords[] = PrePositioning::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Pre-Positioning records saved successfully.',
                'pre_positionings' => $savedRecords,
            ]);
        }

        return back()->with('success', 'Pre-Positioning records saved successfully.');
    }

    /**
     * Update a specific Pre-Positioning
     */
    public function update(Request $request, PrePositioning $prePositioning)
    {
        $validated = $request->validate([
            'team_units'         => 'nullable|string|max:255',
            'team_leader'        => 'nullable|string|max:255',
            'personnel_deployed' => 'nullable|integer|min:0',
            'response_assets'    => 'nullable|string|max:255',
            'capability'         => 'nullable|string|max:255',
            'area_of_deployment' => 'nullable|string|max:255',
        ]);

        $prePositioning->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Pre-Positioning updated successfully.');
    }

    /**
     * Get modification history for Pre-Positionings
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'PrePositioning')
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
