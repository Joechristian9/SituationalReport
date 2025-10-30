<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\ElectricityService;
use App\Models\WaterService;
use App\Models\Communication;
use App\Models\Road;
use App\Models\Bridge;
use App\Models\Modification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SituationOverviewController extends Controller
{
    /* ------------------- INDEX ------------------- */
    public function index()
    {
        return Inertia::render('SituationReports/Index', [
            'weatherReports' => WeatherReport::orderBy('updated_at', 'asc')->get(),
            'waterLevels'    => WaterLevel::orderBy('updated_at', 'asc')->get(),
            'electricity'    => ElectricityService::orderBy('updated_at', 'asc')->get(),
            'waterServices'  => WaterService::orderBy('updated_at', 'asc')->get(),
            'communications' => Communication::orderBy('updated_at', 'asc')->get(),
            'roads'          => Road::orderBy('updated_at', 'asc')->get(),
            'bridges'        => Bridge::orderBy('updated_at', 'asc')->get(),
        ]);
    }

    /* ------------------- STORE METHODS ------------------- */
    public function storeWeather(Request $request)
    {
        // 1. Stricter Validation Rules
        $validated = $request->validate([
            'reports' => 'required|array',
            // ID must be a valid integer that exists in the weather_reports table, or can be null.
            'reports.*.id' => [
                'nullable',
                'integer',
                Rule::exists('weather_reports', 'id')
            ],
            // Municipality is now required to create a new record.
            // It can be null only if other fields are also null (which we handle below).
            'reports.*.municipality'  => 'required|string|max:255',
            'reports.*.sky_condition' => 'nullable|string|max:255',
            'reports.*.wind'          => 'nullable|string|max:255',
            'reports.*.precipitation' => 'nullable|string|max:255',
            'reports.*.sea_condition' => 'nullable|string|max:255',
        ]);

        foreach ($validated['reports'] as $reportData) {
            // 2. More Robust Saving Logic

            // If an ID exists, we find and update that specific record.
            if (!empty($reportData['id'])) {
                $weatherReport = WeatherReport::find($reportData['id']);
                if ($weatherReport) {
                    $weatherReport->update([
                        'municipality'  => $reportData['municipality'],
                        'sky_condition' => $reportData['sky_condition'],
                        'wind'          => $reportData['wind'],
                        'precipitation' => $reportData['precipitation'],
                        'sea_condition' => $reportData['sea_condition'],
                        'updated_by'    => Auth::id(),
                    ]);
                }
            }
            // If no ID, it's a new record. We create it.
            else {
                // Skip creating a record if the municipality is empty.
                if (empty($reportData['municipality'])) {
                    continue;
                }

                WeatherReport::create([
                    'municipality'  => $reportData['municipality'],
                    'sky_condition' => $reportData['sky_condition'],
                    'wind'          => $reportData['wind'],
                    'precipitation' => $reportData['precipitation'],
                    'sea_condition' => $reportData['sea_condition'],
                    'user_id'       => Auth::id(),
                    'updated_by'    => Auth::id(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'Weather reports saved successfully!');
    }



    public function storeWaterLevel(Request $request)
    {
        $validated = $request->validate([
            'reports' => ['required', 'array'],
            'reports.*.id' => ['nullable'],
            'reports.*.gauging_station' => ['required', 'string'],
            'reports.*.current_level' => ['nullable', 'numeric'],
            'reports.*.alarm_level' => ['nullable', 'numeric'],
            'reports.*.critical_level' => ['nullable', 'numeric'],
            'reports.*.affected_areas' => ['nullable', 'string'],
        ]);

        foreach ($validated['reports'] as $reportData) {
            // If ID is numeric, update existing record
            if (!empty($reportData['id']) && is_numeric($reportData['id'])) {
                $waterLevel = WaterLevel::find($reportData['id']);
                if ($waterLevel) {
                    $waterLevel->update([
                        'gauging_station' => $reportData['gauging_station'],
                        'current_level'   => $reportData['current_level'],
                        'alarm_level'     => $reportData['alarm_level'],
                        'critical_level'  => $reportData['critical_level'],
                        'affected_areas'  => $reportData['affected_areas'],
                        'updated_by'      => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                if (empty($reportData['gauging_station'])) {
                    continue;
                }

                WaterLevel::create([
                    'gauging_station' => $reportData['gauging_station'],
                    'current_level'   => $reportData['current_level'],
                    'alarm_level'     => $reportData['alarm_level'],
                    'critical_level'  => $reportData['critical_level'],
                    'affected_areas'  => $reportData['affected_areas'],
                    'user_id'         => Auth::id(),
                    'updated_by'      => Auth::id(),
                ]);
            }
        }

        return response()->json(['message' => 'Water level reports saved successfully!']);
    }


    public function storeElectricity(Request $request)
    {
        $validated = $request->validate([
            'electricityServices' => 'required|array',
            'electricityServices.*.status' => 'nullable|string|max:255',
            'electricityServices.*.barangays_affected' => 'nullable|string|max:500',
            'electricityServices.*.remarks' => 'nullable|string|max:500',
        ]);

        foreach ($validated['electricityServices'] as $service) {
            if (!empty(array_filter($service))) {
                ElectricityService::updateOrCreate(
                    ['user_id' => Auth::id()],
                    [
                        'status' => $service['status'] ?? null,
                        'barangays_affected' => $service['barangays_affected'] ?? null,
                        'remarks' => $service['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]
                );
            }
        }

        return response()->json(['message' => 'Electricity service reports saved successfully']);
    }

    public function storeWaterService(Request $request)
    {
        $validated = $request->validate([
            'waterServices' => 'required|array',
            'waterServices.*.source_of_water'  => 'nullable|string|max:255',
            'waterServices.*.barangays_served' => 'nullable|string|max:500',
            'waterServices.*.status'           => 'nullable|string|max:255',
            'waterServices.*.remarks'          => 'nullable|string|max:500',
        ]);

        foreach ($validated['waterServices'] as $water) {
            if (!empty(array_filter($water))) {
                WaterService::updateOrCreate(
                    ['user_id' => Auth::id()],
                    [
                        'source_of_water'  => $water['source_of_water'] ?? null,
                        'barangays_served' => $water['barangays_served'] ?? null,
                        'status'           => $water['status'] ?? null,
                        'remarks'          => $water['remarks'] ?? null,
                        'updated_by'       => Auth::id(),
                    ]
                );
            }
        }

        return response()->json(['message' => 'Water service reports saved successfully']);
    }


    public function storeCommunication(Request $request)
    {
        $validated = $request->validate([
            'communications' => 'required|array',
            'communications.*.globe' => 'nullable|string|max:255',
            'communications.*.smart' => 'nullable|string|max:255',
            'communications.*.pldt_landline' => 'nullable|string|max:255',
            'communications.*.pldt_internet' => 'nullable|string|max:255',
            'communications.*.vhf' => 'nullable|string|max:255',
            'communications.*.remarks' => 'nullable|string|max:500',
        ]);

        foreach ($validated['communications'] as $comm) {
            if (!empty(array_filter($comm))) {
                Communication::updateOrCreate(
                    ['user_id' => Auth::id()],
                    [
                        'globe' => $comm['globe'] ?? null,
                        'smart' => $comm['smart'] ?? null,
                        'pldt_landline' => $comm['pldt_landline'] ?? null,
                        'pldt_internet' => $comm['pldt_internet'] ?? null,
                        'vhf' => $comm['vhf'] ?? null,
                        'remarks' => $comm['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]
                );
            }
        }

        return response()->json(['message' => 'Communication reports saved successfully']);
    }

    public function storeRoad(Request $request)
    {
        $validated = $request->validate([
            'roads' => 'required|array',
            'roads.*.road_classification' => 'nullable|string|max:255',
            'roads.*.name_of_road'        => 'nullable|string|max:255',
            'roads.*.status'              => 'nullable|string|max:255',
            'roads.*.areas_affected'      => 'nullable|string|max:500',
            'roads.*.re_routing'          => 'nullable|string|max:500',
            'roads.*.remarks'             => 'nullable|string|max:500',
        ]);

        foreach ($validated['roads'] as $road) {
            if (!empty(array_filter($road))) {
                Road::updateOrCreate(
                    ['user_id' => Auth::id(), 'name_of_road' => $road['name_of_road']],
                    [
                        'road_classification' => $road['road_classification'] ?? null,
                        'status' => $road['status'] ?? null,
                        'areas_affected' => $road['areas_affected'] ?? null,
                        're_routing' => $road['re_routing'] ?? null,
                        'remarks' => $road['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]
                );
            }
        }

        return response()->json(['message' => 'Road reports saved successfully']);
    }

    public function storeBridge(Request $request)
    {
        $validated = $request->validate([
            'bridges' => 'required|array',
            'bridges.*.road_classification' => 'nullable|string|max:255',
            'bridges.*.name_of_bridge'     => 'nullable|string|max:255',
            'bridges.*.status'             => 'nullable|string|max:255',
            'bridges.*.areas_affected'     => 'nullable|string|max:500',
            'bridges.*.re_routing'         => 'nullable|string|max:500',
            'bridges.*.remarks'            => 'nullable|string|max:500',
        ]);

        foreach ($validated['bridges'] as $bridge) {
            if (!empty(array_filter($bridge))) {
                Bridge::updateOrCreate(
                    ['user_id' => Auth::id(), 'name_of_bridge' => $bridge['name_of_bridge']],
                    [
                        'road_classification' => $bridge['road_classification'] ?? null,
                        'status' => $bridge['status'] ?? null,
                        'areas_affected' => $bridge['areas_affected'] ?? null,
                        're_routing' => $bridge['re_routing'] ?? null,
                        'remarks' => $bridge['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]
                );
            }
        }

        return response()->json(['message' => 'Bridge reports saved successfully']);
    }

    /* ------------------- MODIFICATIONS ------------------- */
    private function buildModificationResponse($modelType)
    {
        $modifications = Modification::where('model_type', $modelType)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by model_id and field to track modifications per row
        $history = [];
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            foreach ($mod->changed_fields as $field => $change) {
                // Key format: "modelId_field" to track each row+field combination
                $key = $modelId . '_' . $field;
                $history[$key][] = [
                    'user' => $change['user'] ?? ['id' => $mod->user->id, 'name' => $mod->user->name],
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'date' => $mod->created_at,
                    'model_id' => $modelId,
                ];
            }
        }

        $latest = $modifications->first();
        if ($latest) {
            $latestChangedFields = [];
            foreach ($latest->changed_fields as $field => $change) {
                $latestChangedFields[$field] = [
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'user' => $change['user'] ?? ['id' => $latest->user->id, 'name' => $latest->user->name],
                ];
            }
            $latest->changed_fields = $latestChangedFields;
        }

        return response()->json([
            'history' => $history,
            'latest'  => $latest,
        ]);
    }

    public function weatherModification()
    {
        return $this->buildModificationResponse('WeatherReport');
    }
    public function waterLevelModification()
    {
        return $this->buildModificationResponse('WaterLevel');
    }
    public function electricityModification()
    {
        return $this->buildModificationResponse('ElectricityService');
    }
    public function waterServiceModification()
    {
        return $this->buildModificationResponse('WaterService');
    }
    public function communicationModification()
    {
        return $this->buildModificationResponse('Communication');
    }
    public function roadModification()
    {
        return $this->buildModificationResponse('Road');
    }
    public function bridgeModification()
    {
        return $this->buildModificationResponse('Bridge');
    }
}
