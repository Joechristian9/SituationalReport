<?php

namespace App\Http\Controllers;

use App\Models\SuspensionOfClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SuspensionOfClassController extends Controller
{
    /**
     * Show list of class suspensions
     */
    public function index()
    {
        $suspensions = SuspensionOfClass::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'suspensions' => $suspensions,
        ]);
    }

    /**
     * Store multiple suspensions
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'suspensions' => 'required|array',
            'suspensions.*.province_city_municipality' => 'nullable|string|max:255',
            'suspensions.*.level' => 'nullable|string|max:255',
            'suspensions.*.date_of_suspension' => 'nullable|date',
            'suspensions.*.remarks' => 'nullable|string',
        ]);

        foreach ($validated['suspensions'] as $suspension) {
            // Copy suspension except "level"
            $dataToCheck = $suspension;
            unset($dataToCheck['level']);

            // Remove empty values (null, '', whitespace, 0)
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return !is_null($value) && trim((string)$value) !== '' && $value !== 0 && $value !== '0';
            });

            // If nothing left → means only "level" was filled OR everything empty → skip
            if (empty($dataToCheck)) {
                continue;
            }

            // Otherwise save to DB
            SuspensionOfClass::create([
                'province_city_municipality' => $suspension['province_city_municipality'] ?? null,
                'level'                      => $suspension['level'] ?? null,
                'date_of_suspension'         => $suspension['date_of_suspension'] ?? null,
                'remarks'                    => $suspension['remarks'] ?? null,
                'user_id'                    => Auth::id(),
                'updated_by'                 => Auth::id(),
            ]);
        }

        return back()->with('success', 'Class suspension records saved successfully.');
    }

    /**
     * Update specific suspension
     */
    public function update(Request $request, SuspensionOfClass $suspension)
    {
        $validated = $request->validate([
            'province_city_municipality' => 'nullable|string|max:255',
            'level' => 'nullable|string|max:255',
            'date_of_suspension' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $suspension->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Class suspension updated successfully.');
    }
}
