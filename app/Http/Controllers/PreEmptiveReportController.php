<?php

namespace App\Http\Controllers;

use App\Models\PreEmptiveReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PreEmptiveReportController extends Controller
{
    /**
     * Show list of Pre-Emptive Reports
     */
    public function index()
    {
        $reports = PreEmptiveReport::latest()->get();

        return Inertia::render('PreEmptiveReports/Index', [
            'reports' => $reports,
        ]);
    }

    /**
     * Store Pre-Emptive Reports
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reports' => 'required|array',

            'reports.*.barangay'          => 'nullable|string|max:255',
            'reports.*.evacuation_center' => 'nullable|string|max:255',
            'reports.*.families'          => 'nullable|integer|min:0',
            'reports.*.persons'           => 'nullable|integer|min:0',
            'reports.*.outside_center'    => 'nullable|string|max:255',
            'reports.*.outside_families'  => 'nullable|integer|min:0',
            'reports.*.outside_persons'   => 'nullable|integer|min:0',
            'reports.*.total_families'    => 'nullable|integer|min:0',
            'reports.*.total_persons'     => 'nullable|integer|min:0',
        ]);

        foreach ($validated['reports'] as $report) {
            // ✅ Skip rows where all values are null, empty, or 0
            $isEmpty = empty(array_filter($report, function ($value) {
                return !is_null($value) && $value !== '' && $value !== 0 && $value !== '0';
            }));

            if ($isEmpty) {
                continue;
            }

            PreEmptiveReport::create([
                'barangay'          => $report['barangay'] ?? null,
                'evacuation_center' => $report['evacuation_center'] ?? null,
                'families'          => $report['families'] ?? null,
                'persons'           => $report['persons'] ?? null,
                'outside_center'    => $report['outside_center'] ?? null,
                'outside_families'  => $report['outside_families'] ?? null,
                'outside_persons'   => $report['outside_persons'] ?? null,
                'total_families'    => $report['total_families'] ?? null,
                'total_persons'     => $report['total_persons'] ?? null,
                'user_id'           => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);
        }

        return back()->with('success', 'Pre-Emptive Reports saved successfully.');
    }

    /**
     * Update specific Pre-Emptive Report
     */
    public function update(Request $request, PreEmptiveReport $preEmptiveReport)
    {
        $validated = $request->validate([
            'barangay'          => 'nullable|string|max:255',
            'evacuation_center' => 'nullable|string|max:255',
            'families'          => 'nullable|integer|min:0',
            'persons'           => 'nullable|integer|min:0',
            'outside_center'    => 'nullable|string|max:255',
            'outside_families'  => 'nullable|integer|min:0',
            'outside_persons'   => 'nullable|integer|min:0',
            'total_families'    => 'nullable|integer|min:0',
            'total_persons'     => 'nullable|integer|min:0',
        ]);

        $preEmptiveReport->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Pre-Emptive Report updated successfully.');
    }

    /**
     * Delete a Pre-Emptive Report
     */
    public function destroy(PreEmptiveReport $preEmptiveReport)
    {
        $preEmptiveReport->delete();

        return back()->with('success', 'Pre-Emptive Report deleted successfully.');
    }
}
