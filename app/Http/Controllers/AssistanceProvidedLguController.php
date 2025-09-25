<?php

namespace App\Http\Controllers;

use App\Models\AssistanceProvidedLgu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AssistanceProvidedLguController extends Controller
{
    public function index()
    {
        $assistances = AssistanceProvidedLgu::latest()->paginate(10);

        return inertia('AssistanceProvidedLgu/Index', [
            'assistances' => $assistances,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'assistances' => 'required|array',

            'assistances.*.province'          => 'nullable|string|max:255',
            'assistances.*.city'              => 'nullable|string|max:255',
            'assistances.*.barangay'          => 'nullable|string|max:255',
            'assistances.*.families_affected' => 'nullable|string|max:255',
            'assistances.*.families_assisted' => 'nullable|string|max:255',
            'assistances.*.cluster_type'      => 'nullable|string|max:255',
            'assistances.*.quantity'          => 'nullable|string|max:255',
            'assistances.*.unit'              => 'nullable|string|max:255',
            'assistances.*.cost_per_unit'     => 'nullable|numeric|min:0',
            'assistances.*.amount'            => 'nullable|numeric|min:0',
            'assistances.*.source'            => 'nullable|string|max:255',
            'assistances.*.remarks'           => 'nullable|string',
        ]);

        foreach ($validated['assistances'] as $assistance) {
            $isEmpty = empty(array_filter($assistance, fn($value) => !is_null($value) && $value !== ''));
            if ($isEmpty) continue;

            AssistanceProvidedLgu::create([
                ...$assistance,
                'user_id'    => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'LGU Assistance saved successfully.');
    }

    public function update(Request $request, AssistanceProvidedLgu $assistanceProvidedLgu)
    {
        $validated = $request->validate([
            'province'          => 'nullable|string|max:255',
            'city'              => 'nullable|string|max:255',
            'barangay'          => 'nullable|string|max:255',
            'families_affected' => 'nullable|string|max:255',
            'families_assisted' => 'nullable|string|max:255',
            'cluster_type'      => 'nullable|string|max:255',
            'quantity'          => 'nullable|string|max:255',
            'unit'              => 'nullable|string|max:255',
            'cost_per_unit'     => 'nullable|numeric|min:0',
            'amount'            => 'nullable|numeric|min:0',
            'source'            => 'nullable|string|max:255',
            'remarks'           => 'nullable|string',
        ]);

        $assistanceProvidedLgu->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'LGU Assistance updated successfully.');
    }

    public function destroy(AssistanceProvidedLgu $assistanceProvidedLgu)
    {
        $assistanceProvidedLgu->delete();

        return back()->with('success', 'LGU Assistance deleted successfully.');
    }
}
