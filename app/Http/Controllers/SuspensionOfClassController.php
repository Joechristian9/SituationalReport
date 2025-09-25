<?php

namespace App\Http\Controllers;

use App\Models\SuspensionOfClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SuspensionOfClassController extends Controller
{
    /**
     * Display a listing of the suspension of class records.
     */
    public function index()
    {
        $suspensionList = SuspensionOfClass::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'suspensionList' => $suspensionList,
        ]);
    }

    /**
     * Store newly created suspension of class records in storage.
     * Handles bulk creation from the form.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'suspension_of_classes' => 'required|array',
            'suspension_of_classes.*.province_city_municipality' => 'nullable|string|max:255',
            'suspension_of_classes.*.level' => 'nullable|string|max:255',
            'suspension_of_classes.*.date_of_suspension' => 'nullable|date',
            'suspension_of_classes.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['suspension_of_classes'] as $suspensionData) {
            // ✅ Skip rows where all values are null or empty
            $isEmpty = empty(array_filter($suspensionData, function ($value) {
                return !is_null($value) && trim((string)$value) !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            SuspensionOfClass::create([
                'province_city_municipality' => $suspensionData['province_city_municipality'] ?? null,
                'level'                      => $suspensionData['level'] ?? null,
                'date_of_suspension'         => $suspensionData['date_of_suspension'] ?? null,
                'remarks'                    => $suspensionData['remarks'] ?? null,
                'user_id'                    => Auth::id(),
                'updated_by'                 => Auth::id(),
            ]);
        }

        return back()->with('success', 'Suspension of Class records saved successfully.');
    }

    /**
     * Update the specified suspension of class record in storage.
     */
    public function update(Request $request, SuspensionOfClass $suspensionOfClass)
    {
        $validated = $request->validate([
            'province_city_municipality' => 'nullable|string|max:255',
            'level'                      => 'nullable|string|max:255',
            'date_of_suspension'         => 'nullable|date',
            'remarks'                    => 'nullable|string',
        ]);

        $suspensionOfClass->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Incidents Report saved successfully.');
    }

    /**
     * Remove the specified suspension of class record from storage.
     */
    /* public function destroy(SuspensionOfClass $suspensionOfClass)
    {
        $suspensionOfClass->delete();

        return back()->with('success', 'Suspension of Class record deleted successfully.');
    } */
}
