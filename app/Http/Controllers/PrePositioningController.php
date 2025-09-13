<?php

namespace App\Http\Controllers;

use App\Models\PrePositioning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PrePositioningController extends Controller
{
    /**
     * Show list of Pre-Positionings
     */
    public function index()
    {
        $prePositionings = PrePositioning::latest()->get();

        return Inertia::render('DeploymentOfResponse/Index', [
            'pre_positionings' => $prePositionings,
        ]);
    }

    /**
     * Store Pre-Positionings
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pre_positionings' => 'required|array',

            'pre_positionings.*.team_units'         => 'nullable|string|max:255',
            'pre_positionings.*.team_leader'        => 'nullable|string|max:255',
            'pre_positionings.*.personnel_deployed' => 'nullable|integer|min:0',
            'pre_positionings.*.response_assets'    => 'nullable|string|max:255',
            'pre_positionings.*.capability'         => 'nullable|string|max:255',
            'pre_positionings.*.area_of_deployment' => 'nullable|string|max:255',
        ]);

        foreach ($validated['pre_positionings'] as $row) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter($row, function ($value) {
                return !is_null($value) && $value !== '' && $value !== 0;
            }));

            if ($isEmpty) {
                continue;
            }

            PrePositioning::create([
                'team_units'         => $row['team_units'] ?? null,
                'team_leader'        => $row['team_leader'] ?? null,
                'personnel_deployed' => $row['personnel_deployed'] ?? null,
                'response_assets'    => $row['response_assets'] ?? null,
                'capability'         => $row['capability'] ?? null,
                'area_of_deployment' => $row['area_of_deployment'] ?? null,
                'user_id'            => Auth::id(),
                'updated_by'         => Auth::id(),
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
}
