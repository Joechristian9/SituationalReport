<?php

namespace App\Http\Controllers;

use App\Models\AssistanceExtended;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssistanceExtendedController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $assistances = AssistanceExtended::latest()->paginate(10);
        return inertia('AssistanceExtended/AssistanceExtended', [
            'assistances' => $assistances,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'assistances' => 'required|array',

            'assistances.*.agency_officials_groups' => 'nullable|string|max:255',
            'assistances.*.type_kind_of_assistance' => 'nullable|string|max:255',
            'assistances.*.amount'                  => 'nullable|numeric|min:0',
            'assistances.*.beneficiaries'           => 'nullable|string|max:255',
        ]);

        foreach ($validated['assistances'] as $assistance) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter($assistance, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            AssistanceExtended::create([
                'agency_officials_groups' => $assistance['agency_officials_groups'] ?? null,
                'type_kind_of_assistance' => $assistance['type_kind_of_assistance'] ?? null,
                'amount'                  => $assistance['amount'] ?? null,
                'beneficiaries'           => $assistance['beneficiaries'] ?? null,
                'user_id'                 => Auth::id(),
                'updated_by'              => Auth::id(),
            ]);
        }

        return back()->with('success', 'Assistances saved successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AssistanceExtended $assistanceExtended)
    {
        $validated = $request->validate([
            'agency_officials_groups' => 'nullable|string|max:255',
            'type_kind_of_assistance' => 'nullable|string|max:255',
            'amount'                  => 'nullable|numeric|min:0',
            'beneficiaries'           => 'nullable|string|max:255', // ✅ FIXED (string)
        ]);

        $assistanceExtended->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Assistance updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssistanceExtended $assistanceExtended)
    {
        $assistanceExtended->delete();

        return redirect()->back()->with('success', 'Assistance deleted successfully.');
    }
}
