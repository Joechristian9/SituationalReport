<?php

namespace App\Http\Controllers;

use App\Models\DamagedHouseReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DamagedHouseReportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $damagedHouses = DamagedHouseReport::latest()->get();

        return Inertia::render('IncidentMonitored/Index', [
            'damagedHouses' => $damagedHouses,
        ]);
    }

    /**
     * Store newly created resources in storage.
     * Handles bulk creation from the form.
     */
    // in app/Http-Controllers/DamagedHouseReportController.php

    public function store(Request $request)
    {
        // 1. Validation is correct.
        $validated = $request->validate([
            'damaged_houses' => 'required|array',
            'damaged_houses.*.barangay' => 'nullable|string|max:255',
            'damaged_houses.*.partially' => 'nullable|integer|min:0',
            'damaged_houses.*.totally' => 'nullable|integer|min:0',
        ]);

        // 2. Loop through each submitted row.
        foreach ($validated['damaged_houses'] as $reportData) {

            // ✅ THE CORRECT FIX: Check for the exact state of an empty row after validation.
            if (is_null($reportData['barangay']) && $reportData['partially'] == 0 && $reportData['totally'] == 0) {
                continue; // This will now correctly skip the empty rows.
            }

            // 3. This code will only execute if the row contains actual data.
            DamagedHouseReport::create([
                'barangay' => $reportData['barangay'],
                'partially' => $reportData['partially'],
                'totally' => $reportData['totally'],
                'total' => ($reportData['partially'] ?? 0) + ($reportData['totally'] ?? 0),
                'user_id' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'Incidents Report saved successfully.');
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DamagedHouseReport $damagedHouseReport)
    {
        $validated = $request->validate([
            'barangay' => 'nullable|string|max:255',
            'partially' => 'nullable|integer|min:0',
            'totally' => 'nullable|integer|min:0',
        ]);

        // Add the server-calculated total
        $validated['total'] = ($validated['partially'] ?? 0) + ($validated['totally'] ?? 0);

        $damagedHouseReport->update($validated);
        // 'updated_by' is handled by the model's boot() method on update

        return back()->with('success', 'Damaged house record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    /*
    public function destroy(DamagedHouseReport $damagedHouseReport)
    {
        $damagedHouseReport->delete();

        return back()->with('success', 'Damaged house record deleted successfully.');
    }
    */
}
