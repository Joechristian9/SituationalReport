<?php

namespace App\Http\Controllers;

use App\Models\SuspensionOfWork;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SuspensionOfWorkController extends Controller
{
    /**
     * Display a listing of the suspension of work records.
     */
    public function index()
    {
        $suspensionList = SuspensionOfWork::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'suspensionList' => $suspensionList,
        ]);
    }

    /**
     * Store newly created suspension of work records in storage.
     * Handles bulk creation from the form.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'suspension_of_work' => 'required|array',
            'suspension_of_work.*.province_city_municipality' => 'nullable|string|max:255',
            'suspension_of_work.*.date_of_suspension' => 'nullable|date',
            'suspension_of_work.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['suspension_of_work'] as $suspensionData) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter($suspensionData, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            SuspensionOfWork::create([
                'province_city_municipality' => $suspensionData['province_city_municipality'] ?? null,
                'date_of_suspension'         => $suspensionData['date_of_suspension'] ?? null,
                'remarks'                    => $suspensionData['remarks'] ?? null,
                'user_id'                    => Auth::id(),
                'updated_by'                 => Auth::id(),
            ]);
        }

        return back()->with('success', 'Incidents Report saved successfully.');
    }

    /**
     * Update the specified suspension of work record in storage.
     */
    public function update(Request $request, SuspensionOfWork $suspensionOfWork)
    {
        $validated = $request->validate([
            'province_city_municipality' => 'nullable|string|max:255',
            'date_of_suspension'         => 'nullable|date',
            'remarks'                    => 'nullable|string',
        ]);

        $suspensionOfWork->update($validated);

        // `updated_by` handled automatically by model boot() if included there

        return back()->with('success', 'Suspension of Work record updated successfully.');
    }

    /**
     * Remove the specified suspension of work record from storage.
     */
    /* public function destroy(SuspensionOfWork $suspensionOfWork)
    {
        $suspensionOfWork->delete();

        return back()->with('success', 'Suspension of Work record deleted successfully.');
    } */
}
