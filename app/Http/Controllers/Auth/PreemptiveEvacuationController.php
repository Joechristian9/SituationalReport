<?php
namespace App\Http\Controllers;

use App\Models\PreemptiveEvacuation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreemptiveEvacuationController extends Controller
{
    public function index()
    {
        $reports = PreemptiveEvacuation::all(); // ✅ fixed typo

        return Inertia::render('PreEmptiveEvacuations/Index', [
            'reports' => $reports,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reports' => 'required|array',
            'reports.*.municipality' => 'required|string|max:255',
            'reports.*.barangay' => 'required|string|max:255',
            'reports.*.evacuated_families' => 'required|integer|min:0',
            'reports.*.evacuated_individuals' => 'required|integer|min:0',
            'reports.*.reason' => 'nullable|string|max:255',
            'reports.*.user_id' => 'nullable|integer',
            'reports.*.updated_by' => 'nullable|integer',
        ]);

        foreach ($validated['reports'] as $report) {
            PreemptiveEvacuation::create($report);
        }

        return redirect()->back()->with('success', 'Evacuation reports saved successfully.');
    }
}