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
     */
    public function index()
    {
        $declarations = UscDeclaration::latest()->get();

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

            'usc_declarations.*.declared_by'       => 'nullable|string|max:255',
            'usc_declarations.*.resolution_number' => 'nullable|string|max:255',
            'usc_declarations.*.date_approved'     => 'nullable|date',
        ]);

        foreach ($validated['usc_declarations'] as $declaration) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter($declaration, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            UscDeclaration::create([
                'declared_by'       => $declaration['declared_by'] ?? null,
                'resolution_number' => $declaration['resolution_number'] ?? null,
                'date_approved'     => $declaration['date_approved'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
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
}
