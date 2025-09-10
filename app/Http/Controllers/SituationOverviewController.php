<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\ElectricityService;
use App\Models\WaterService;
use App\Models\Communication;
use App\Models\Road;
use App\Models\Bridge; // ✅ Added
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
        $communications = Communication::latest()->get();
        $roads          = Road::latest()->get();
        $bridges        = Bridge::latest()->get(); // ✅ Added

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $weatherReports,
            'waterLevels'    => $waterLevels,
            'electricity'    => $electricity,
            'waterServices'  => $waterServices,
            'communications' => $communications,
            'roads'          => $roads,
            'bridges'        => $bridges, // ✅ Added
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Weather
            'reports' => 'required|array',
            'reports.*.municipality'   => 'nullable|string|max:255',
            'reports.*.sky_condition'  => 'nullable|string|max:255',
            'reports.*.wind'           => 'nullable|string|max:255',
            'reports.*.precipitation'  => 'nullable|string|max:255',
            'reports.*.sea_condition'  => 'nullable|string|max:255',

            // Water levels
            'waterLevels' => 'required|array',
            'waterLevels.*.gauging_station' => 'required|string|max:255',
            'waterLevels.*.current_level'   => 'nullable|numeric',
            'waterLevels.*.alarm_level'     => 'nullable|numeric',
            'waterLevels.*.critical_level'  => 'nullable|numeric',
            'waterLevels.*.affected_areas'  => 'nullable|string|max:255',

            // Electricity
            'electricityServices' => 'required|array',
            'electricityServices.*.status'             => 'nullable|string|max:255',
            'electricityServices.*.barangays_affected' => 'nullable|string|max:500',
            'electricityServices.*.remarks'            => 'nullable|string|max:500',

            // Water services
            'waterServices' => 'required|array',
            'waterServices.*.source_of_water'   => 'nullable|string|max:255',
            'waterServices.*.barangays_served'  => 'nullable|string|max:500',
            'waterServices.*.status'            => 'nullable|string|max:255',
            'waterServices.*.remarks'           => 'nullable|string|max:500',

            // Communications
            'communications' => 'required|array',
            'communications.*.globe'          => 'nullable|string|max:255',
            'communications.*.smart'          => 'nullable|string|max:255',
            'communications.*.pldt_landline'  => 'nullable|string|max:255',
            'communications.*.pldt_internet'  => 'nullable|string|max:255',
            'communications.*.vhf'            => 'nullable|string|max:255',
            'communications.*.remarks'        => 'nullable|string|max:500',

            // Roads
            'roads' => 'required|array',
            'roads.*.road_classification' => 'nullable|string|max:255',
            'roads.*.name_of_road'        => 'nullable|string|max:255',
            'roads.*.status'              => 'nullable|string|max:255',
            'roads.*.areas_affected'      => 'nullable|string|max:500',
            'roads.*.re_routing'          => 'nullable|string|max:500',
            'roads.*.remarks'             => 'nullable|string|max:500',

            // ✅ Bridges
            'bridges' => 'required|array',
            'bridges.*.road_classification' => 'nullable|string|max:255',
            'bridges.*.name_of_bridge'      => 'nullable|string|max:255',
            'bridges.*.status'              => 'nullable|string|max:255',
            'bridges.*.areas_affected'      => 'nullable|string|max:500',
            'bridges.*.re_routing'          => 'nullable|string|max:500',
            'bridges.*.remarks'             => 'nullable|string|max:500',
        ]);

        // ✅ Weather Reports
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

        // ✅ Water Levels
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

        // ✅ Electricity
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

        // ✅ Water Services
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

        // ✅ Communications
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

        // ✅ Roads
        foreach ($validated['roads'] as $road) {
            if (!empty(array_filter($road))) {
                Road::create([
                    'road_classification' => $road['road_classification'] ?? null,
                    'name_of_road'        => $road['name_of_road'] ?? null,
                    'status'              => $road['status'] ?? null,
                    'areas_affected'      => $road['areas_affected'] ?? null,
                    're_routing'          => $road['re_routing'] ?? null,
                    'remarks'             => $road['remarks'] ?? null,
                    'user_id'             => Auth::id(),
                    'updated_by'          => Auth::id(),
                ]);
            }
        }

        // ✅ Bridges
        foreach ($validated['bridges'] as $bridge) {
            if (!empty(array_filter($bridge))) {
                Bridge::create([
                    'road_classification' => $bridge['road_classification'] ?? null,
                    'name_of_bridge'      => $bridge['name_of_bridge'] ?? null,
                    'status'              => $bridge['status'] ?? null,
                    'areas_affected'      => $bridge['areas_affected'] ?? null,
                    're_routing'          => $bridge['re_routing'] ?? null,
                    'remarks'             => $bridge['remarks'] ?? null,
                    'user_id'             => Auth::id(),
                    'updated_by'          => Auth::id(),
                ]);
            }
        }

        return back()->with(
            'success',
            'Weather, Water Level, Electricity, Water Services, Communications, Roads, and Bridges reports saved successfully.'
        );
    }
}
