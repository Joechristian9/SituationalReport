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
use App\Events\UserTyping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SituationOverviewController extends Controller
{
    /* ------------------- INDEX ------------------- */
    public function index()
    {
        // Optimized: Limit to last 100 records for performance
        return Inertia::render('SituationReports/Index', [
            'weatherReports' => WeatherReport::orderBy('updated_at', 'desc')->limit(100)->get(),
            'waterLevels'    => WaterLevel::orderBy('updated_at', 'desc')->limit(100)->get(),
            'electricity'    => ElectricityService::orderBy('updated_at', 'desc')->limit(100)->get(),
            'waterServices'  => WaterService::orderBy('updated_at', 'desc')->limit(100)->get(),
            'communications' => Communication::orderBy('updated_at', 'desc')->limit(100)->get(),
            'roads'          => Road::orderBy('updated_at', 'desc')->limit(100)->get(),
            'bridges'        => Bridge::orderBy('updated_at', 'desc')->limit(100)->get(),
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
                    // Fill the model with new data (doesn't save yet)
                    $weatherReport->fill([
                        'municipality'  => $reportData['municipality'],
                        'sky_condition' => $reportData['sky_condition'],
                        'wind'          => $reportData['wind'],
                        'precipitation' => $reportData['precipitation'],
                        'sea_condition' => $reportData['sea_condition'],
                    ]);
                    
                    // Only save if actual data fields changed (excluding updated_by and timestamps)
                    if ($weatherReport->isDirty(['municipality', 'sky_condition', 'wind', 'precipitation', 'sea_condition'])) {
                        $weatherReport->updated_by = Auth::id();
                        $weatherReport->save();
                    }
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

        // Return the fresh data after save
        $updatedReports = WeatherReport::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Weather reports saved successfully!',
            'reports' => $updatedReports
        ]);
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

        // Return the fresh data after save
        $updatedReports = WaterLevel::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Water level reports saved successfully!',
            'reports' => $updatedReports
        ]);
    }


    public function storeElectricity(Request $request)
    {
        $validated = $request->validate([
            'electricityServices' => 'required|array',
            'electricityServices.*.id' => ['nullable', 'integer'],
            'electricityServices.*.status' => 'nullable|string|max:255',
            'electricityServices.*.barangays_affected' => 'nullable|string|max:500',
            'electricityServices.*.remarks' => 'nullable|string|max:500',
        ]);

        foreach ($validated['electricityServices'] as $serviceData) {
            // Skip empty rows
            if (empty(array_filter($serviceData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($serviceData['id']) && is_numeric($serviceData['id'])) {
                $service = ElectricityService::find($serviceData['id']);
                if ($service) {
                    $service->update([
                        'status' => $serviceData['status'] ?? null,
                        'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                        'remarks' => $serviceData['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                ElectricityService::create([
                    'status' => $serviceData['status'] ?? null,
                    'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                    'remarks' => $serviceData['remarks'] ?? null,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        // Return fresh data after save
        $updatedServices = ElectricityService::with('user:id,name')
            ->where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Electricity service reports saved successfully',
            'electricityServices' => $updatedServices
        ]);
    }

    public function storeWaterService(Request $request)
    {
        $validated = $request->validate([
            'waterServices' => 'required|array',
            'waterServices.*.id' => ['nullable', 'integer'],
            'waterServices.*.source_of_water'  => 'nullable|string|max:255',
            'waterServices.*.barangays_served' => 'nullable|string|max:500',
            'waterServices.*.status'           => 'nullable|string|max:255',
            'waterServices.*.remarks'          => 'nullable|string|max:500',
        ]);

        foreach ($validated['waterServices'] as $waterData) {
            // Skip empty rows
            if (empty(array_filter($waterData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($waterData['id']) && is_numeric($waterData['id'])) {
                $water = WaterService::find($waterData['id']);
                if ($water) {
                    $water->update([
                        'source_of_water'  => $waterData['source_of_water'] ?? null,
                        'barangays_served' => $waterData['barangays_served'] ?? null,
                        'status'           => $waterData['status'] ?? null,
                        'remarks'          => $waterData['remarks'] ?? null,
                        'updated_by'       => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                WaterService::create([
                    'source_of_water'  => $waterData['source_of_water'] ?? null,
                    'barangays_served' => $waterData['barangays_served'] ?? null,
                    'status'           => $waterData['status'] ?? null,
                    'remarks'          => $waterData['remarks'] ?? null,
                    'user_id'          => Auth::id(),
                    'updated_by'       => Auth::id(),
                ]);
            }
        }

        // Return fresh data after save
        $updatedServices = WaterService::with('user:id,name')
            ->where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Water service reports saved successfully',
            'waterServices' => $updatedServices
        ]);
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
            'roads.*.id' => ['nullable', 'integer'],
            'roads.*.road_classification' => 'nullable|string|max:255',
            'roads.*.name_of_road'        => 'nullable|string|max:255',
            'roads.*.status'              => 'nullable|string|max:255',
            'roads.*.areas_affected'      => 'nullable|string|max:500',
            'roads.*.re_routing'          => 'nullable|string|max:500',
            'roads.*.remarks'             => 'nullable|string|max:500',
        ]);

        foreach ($validated['roads'] as $roadData) {
            // Skip empty rows
            if (empty(array_filter($roadData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($roadData['id']) && is_numeric($roadData['id'])) {
                $road = Road::find($roadData['id']);
                if ($road) {
                    $road->update([
                        'road_classification' => $roadData['road_classification'] ?? null,
                        'name_of_road' => $roadData['name_of_road'] ?? null,
                        'status' => $roadData['status'] ?? null,
                        'areas_affected' => $roadData['areas_affected'] ?? null,
                        're_routing' => $roadData['re_routing'] ?? null,
                        'remarks' => $roadData['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                Road::create([
                    'road_classification' => $roadData['road_classification'] ?? null,
                    'name_of_road' => $roadData['name_of_road'] ?? null,
                    'status' => $roadData['status'] ?? null,
                    'areas_affected' => $roadData['areas_affected'] ?? null,
                    're_routing' => $roadData['re_routing'] ?? null,
                    'remarks' => $roadData['remarks'] ?? null,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        // Return fresh data after save
        $updatedRoads = Road::with('user:id,name')
            ->where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Road reports saved successfully',
            'roads' => $updatedRoads
        ]);
    }

    public function storeBridge(Request $request)
    {
        $validated = $request->validate([
            'bridges' => 'required|array',
            'bridges.*.id' => ['nullable', 'integer'],
            'bridges.*.road_classification' => 'nullable|string|max:255',
            'bridges.*.name_of_bridge'     => 'nullable|string|max:255',
            'bridges.*.status'             => 'nullable|string|max:255',
            'bridges.*.areas_affected'     => 'nullable|string|max:500',
            'bridges.*.re_routing'         => 'nullable|string|max:500',
            'bridges.*.remarks'            => 'nullable|string|max:500',
        ]);

        foreach ($validated['bridges'] as $bridgeData) {
            // Skip empty rows
            if (empty(array_filter($bridgeData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($bridgeData['id']) && is_numeric($bridgeData['id'])) {
                $bridge = Bridge::find($bridgeData['id']);
                if ($bridge) {
                    $bridge->update([
                        'road_classification' => $bridgeData['road_classification'] ?? null,
                        'name_of_bridge' => $bridgeData['name_of_bridge'] ?? null,
                        'status' => $bridgeData['status'] ?? null,
                        'areas_affected' => $bridgeData['areas_affected'] ?? null,
                        're_routing' => $bridgeData['re_routing'] ?? null,
                        'remarks' => $bridgeData['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                Bridge::create([
                    'road_classification' => $bridgeData['road_classification'] ?? null,
                    'name_of_bridge' => $bridgeData['name_of_bridge'] ?? null,
                    'status' => $bridgeData['status'] ?? null,
                    'areas_affected' => $bridgeData['areas_affected'] ?? null,
                    're_routing' => $bridgeData['re_routing'] ?? null,
                    'remarks' => $bridgeData['remarks'] ?? null,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        // Return fresh data after save
        $updatedBridges = Bridge::with('user:id,name')
            ->where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Bridge reports saved successfully',
            'bridges' => $updatedBridges
        ]);
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

    /* ------------------- API: GET WEATHER REPORTS ------------------- */
    public function getReports()
    {
        $weatherReports = WeatherReport::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'reports' => $weatherReports
        ]);
    }

    /* ------------------- REAL-TIME TYPING BROADCAST ------------------- */
    public function broadcastTyping(Request $request)
    {
        $validated = $request->validate([
            'userId' => 'required|integer',
            'userName' => 'required|string',
            'fieldKey' => 'required|string',
            'isTyping' => 'required|boolean',
            'channel' => 'required|string',
        ]);

        // Broadcast the typing event
        broadcast(new UserTyping(
            $validated['userId'],
            $validated['userName'],
            $validated['fieldKey'],
            $validated['isTyping'],
            $validated['channel']
        ))->toOthers();

        return response()->json(['status' => 'success']);
    }
}
