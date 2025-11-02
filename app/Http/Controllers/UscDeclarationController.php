<?php

namespace App\Http\Controllers;

use App\Models\UscDeclaration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UscDeclarationController extends Controller
{
    /**
     * Show list of USC Declarations
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $declarations = UscDeclaration::latest()->limit(100)->get();

        return Inertia::render('Declaration/Index', [
            'declarations' => $declarations,
        ]);
    }

    /**
     * Store USC Declarations
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'usc_declarations' => 'required|array',
            'usc_declarations.*.id'                => 'nullable',
            'usc_declarations.*.declared_by'       => 'nullable|string|max:255',
            'usc_declarations.*.resolution_number' => 'nullable|string|max:255',
            'usc_declarations.*.date_approved'     => 'nullable|date',
        ]);

        $savedDeclarations = [];

        foreach ($validated['usc_declarations'] as $declaration) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter([
                $declaration['declared_by'] ?? null,
                $declaration['resolution_number'] ?? null,
                $declaration['date_approved'] ?? null,
            ]));

            if ($isEmpty) {
                continue;
            }

            $data = [
                'declared_by'       => $declaration['declared_by'] ?? null,
                'resolution_number' => $declaration['resolution_number'] ?? null,
                'date_approved'     => $declaration['date_approved'] ?? null,
                'updated_by'        => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($declaration['id']) && is_numeric($declaration['id'])) {
                // Update existing record
                $uscDeclaration = UscDeclaration::find($declaration['id']);
                if ($uscDeclaration) {
                    $uscDeclaration->update($data);
                    $savedDeclarations[] = $uscDeclaration->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $savedDeclarations[] = UscDeclaration::create($data);
            }
        }

        // Return JSON response with saved declarations
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'USC Declarations saved successfully.',
                'declarations' => $savedDeclarations,
            ]);
        }

        return back()->with('success', 'USC Declarations saved successfully.');
    }

    /**
     * Update a specific USC Declaration
     */
    public function update(Request $request, UscDeclaration $uscDeclaration)
    {
        $validated = $request->validate([
            'declared_by'       => 'nullable|string|max:255',
            'resolution_number' => 'nullable|string|max:255',
            'date_approved'     => 'nullable|date',
        ]);

        $uscDeclaration->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'USC Declaration updated successfully.');
    }

    /**
     * Get modification history for USC declarations
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'UscDeclaration')
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
