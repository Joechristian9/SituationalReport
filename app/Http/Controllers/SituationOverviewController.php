<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\WaterLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SituationOverviewController extends Controller
{
    public function index()
    {
        $weatherReports = WeatherReport::latest()->get();
        $waterLevels = WaterLevel::latest()->get();

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $weatherReports,
            'waterLevels'   => $waterLevels,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Weather reports
            'reports' => 'required|array',
            'reports.*.municipality'   => 'nullable|string|max:255',
            'reports.*.sky_condition'  => 'nullable|string|max:255',
            'reports.*.wind'           => 'nullable|string|max:255',
            'reports.*.precipitation'  => 'nullable|string|max:255',
            'reports.*.sea_condition'  => 'nullable|string|max:255',

            // Water level reports
            'waterLevels' => 'required|array',
            'waterLevels.*.gauging_station' => 'required|string|max:255',
            'waterLevels.*.current_level'   => 'nullable|numeric',
            'waterLevels.*.alarm_level'     => 'nullable|numeric',
            'waterLevels.*.critical_level'  => 'nullable|numeric',
            'waterLevels.*.affected_areas'  => 'nullable|string|max:255',
        ]);

        // ✅ Save Weather Reports
        foreach ($validated['reports'] as $report) {
            if (!empty(array_filter($report))) {
                WeatherReport::create([
                    'municipality'  => $report['municipality'] ?? null,
                    'sky_condition' => $report['sky_condition'] ?? null,
                    'wind'          => $report['wind'] ?? null,
                    'precipitation' => $report['precipitation'] ?? null,
                    'sea_condition' => $report['sea_condition'] ?? null,
                    'user_id'       => Auth::id(), // creator
                    'updated_by'    => Auth::id(), // also set on creation
                ]);
            }
        }

        // ✅ Save Water Levels
        foreach ($validated['waterLevels'] as $station) {
            if (!empty(array_filter($station))) {
                WaterLevel::create([
                    'gauging_station' => $station['gauging_station'],
                    'current_level'   => $station['current_level'] ?? null,
                    'alarm_level'     => $station['alarm_level'] ?? null,
                    'critical_level'  => $station['critical_level'] ?? null,
                    'affected_areas'  => $station['affected_areas'] ?? null,
                    'user_id'         => Auth::id(), // creator
                    'updated_by'      => Auth::id(), // also set on creation
                ]);
            }
        }

        return back()->with('success', 'Weather and Water Level reports saved successfully.');
    }
}
