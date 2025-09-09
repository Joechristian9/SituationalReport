<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\ElectricityService;
use App\Models\WaterService;
use App\Models\Communication; // ✅ Import Communication
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SituationOverviewController extends Controller
{
    public function index()
    {
        $weatherReports = WeatherReport::latest()->get();
        $waterLevels    = WaterLevel::latest()->get();
        $electricity    = ElectricityService::latest()->get();
        $waterServices  = WaterService::latest()->get();
        $communications = Communication::latest()->get(); // ✅ Fetch communications

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $weatherReports,
            'waterLevels'    => $waterLevels,
            'electricity'    => $electricity,
            'waterServices'  => $waterServices,
            'communications' => $communications, // ✅ Pass to frontend
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // ✅ Weather reports
            'reports' => 'required|array',
            'reports.*.municipality'   => 'nullable|string|max:255',
            'reports.*.sky_condition'  => 'nullable|string|max:255',
            'reports.*.wind'           => 'nullable|string|max:255',
            'reports.*.precipitation'  => 'nullable|string|max:255',
            'reports.*.sea_condition'  => 'nullable|string|max:255',

            // ✅ Water level reports
            'waterLevels' => 'required|array',
            'waterLevels.*.gauging_station' => 'required|string|max:255',
            'waterLevels.*.current_level'   => 'nullable|numeric',
            'waterLevels.*.alarm_level'     => 'nullable|numeric',
            'waterLevels.*.critical_level'  => 'nullable|numeric',
            'waterLevels.*.affected_areas'  => 'nullable|string|max:255',

            // ✅ Electricity services reports
            'electricityServices' => 'required|array',
            'electricityServices.*.status'             => 'nullable|string|max:255',
            'electricityServices.*.barangays_affected' => 'nullable|string|max:500',
            'electricityServices.*.remarks'            => 'nullable|string|max:500',

            // ✅ Water services reports
            'waterServices' => 'required|array',
            'waterServices.*.source_of_water'   => 'nullable|string|max:255',
            'waterServices.*.barangays_served'  => 'nullable|string|max:500',
            'waterServices.*.status'            => 'nullable|string|max:255',
            'waterServices.*.remarks'           => 'nullable|string|max:500',

            // ✅ Communications reports
            'communications' => 'required|array',
            'communications.*.globe'          => 'nullable|string|max:255',
            'communications.*.smart'          => 'nullable|string|max:255',
            'communications.*.pldt_landline'  => 'nullable|string|max:255',
            'communications.*.pldt_internet'  => 'nullable|string|max:255',
            'communications.*.vhf'            => 'nullable|string|max:255',
            'communications.*.remarks'        => 'nullable|string|max:500',
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
                    'user_id'       => Auth::id(),
                    'updated_by'    => Auth::id(),
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
                    'user_id'         => Auth::id(),
                    'updated_by'      => Auth::id(),
                ]);
            }
        }

        // ✅ Save Electricity Services
        foreach ($validated['electricityServices'] as $service) {
            if (!empty(array_filter($service))) {
                ElectricityService::create([
                    'status'             => $service['status'] ?? null,
                    'barangays_affected' => $service['barangays_affected'] ?? null,
                    'remarks'            => $service['remarks'] ?? null,
                    'user_id'            => Auth::id(),
                    'updated_by'         => Auth::id(),
                ]);
            }
        }

        // ✅ Save Water Services
        foreach ($validated['waterServices'] as $water) {
            if (!empty(array_filter($water))) {
                WaterService::create([
                    'source_of_water'  => $water['source_of_water'] ?? null,
                    'barangays_served' => $water['barangays_served'] ?? null,
                    'status'           => $water['status'] ?? null,
                    'remarks'          => $water['remarks'] ?? null,
                    'user_id'          => Auth::id(),
                    'updated_by'       => Auth::id(),
                ]);
            }
        }

        // ✅ Save Communications
        foreach ($validated['communications'] as $comm) {
            if (!empty(array_filter($comm))) {
                Communication::create([
                    'globe'          => $comm['globe'] ?? null,
                    'smart'          => $comm['smart'] ?? null,
                    'pldt_landline'  => $comm['pldt_landline'] ?? null,
                    'pldt_internet'  => $comm['pldt_internet'] ?? null,
                    'vhf'            => $comm['vhf'] ?? null,
                    'remarks'        => $comm['remarks'] ?? null,
                    'user_id'        => Auth::id(),
                    'updated_by'     => Auth::id(),
                ]);
            }
        }

        return back()->with('success', 'Weather, Water Level, Electricity, Water Services, and Communications reports saved successfully.');
    }
}
