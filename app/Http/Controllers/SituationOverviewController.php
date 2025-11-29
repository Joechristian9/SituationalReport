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
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SituationOverviewController extends Controller
{
    use ValidatesTyphoonStatus;
    /* ------------------- INDEX ------------------- */
    public function index()
    {
        // Optimized: Limit to last 100 records for performance
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $weatherQuery = WeatherReport::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $waterLevelQuery = WaterLevel::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $electricityQuery = ElectricityService::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $waterServiceQuery = WaterService::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $communicationQuery = Communication::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $roadQuery = Road::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));
        $bridgeQuery = Bridge::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $weatherQuery->where('user_id', $user->id);
            $waterLevelQuery->where('user_id', $user->id);
            $electricityQuery->where('user_id', $user->id);
            $waterServiceQuery->where('user_id', $user->id);
            $communicationQuery->where('user_id', $user->id);
            $roadQuery->where('user_id', $user->id);
            $bridgeQuery->where('user_id', $user->id);
        }

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $weatherQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'waterLevels'    => $waterLevelQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'electricity'    => $electricityQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'waterServices'  => $waterServiceQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'communications' => $communicationQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'roads'          => $roadQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
            'bridges'        => $bridgeQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get(),
        ]);
    }

    /* ------------------- STORE METHODS ------------------- */
    public function storeWeather(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

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
                        'typhoon_id'    => $activeTyphoon->id,
                        'updated_by'    => Auth::id(),
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
                    'typhoon_id'    => $activeTyphoon->id,
                ]);
            }
        }

        // Return the fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = WeatherReport::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedReports = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Weather reports saved successfully!',
            'reports' => $updatedReports
        ]);
    }



    public function storeWaterLevel(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

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
                        'typhoon_id'      => $activeTyphoon->id,
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
                    'typhoon_id'      => $activeTyphoon->id,
                ]);
            }
        }

        // Return the fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = WaterLevel::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedReports = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Water level reports saved successfully!',
            'reports' => $updatedReports
        ]);
    }


    public function storeElectricity(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'electricityServices' => 'required|array',
            'electricityServices.*.id' => ['nullable', 'integer'],
            'electricityServices.*.status' => 'nullable|string|max:255',
            'electricityServices.*.barangays_affected' => 'nullable|string|max:500',
            'electricityServices.*.remarks' => 'nullable|string|max:500',
        ]);

        // ONE REPORT PER TYPHOON: Find or create a single electricity report for this typhoon
        $user = Auth::user();
        
        // Get the first service data (we only need one report per typhoon)
        $serviceData = $validated['electricityServices'][0] ?? [];
        
        // Skip if completely empty
        if (empty(array_filter($serviceData))) {
            return response()->json([
                'message' => 'No data to save',
                'electricityServices' => []
            ]);
        }

        // Find the most recent report for this typhoon and user
        $existingService = ElectricityService::where('typhoon_id', $activeTyphoon->id)
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        // Determine if we should create a new record or update existing
        $shouldCreateNew = false;
        
        if (!$existingService) {
            // No existing record, create new
            $shouldCreateNew = true;
        } elseif ($activeTyphoon->resumed_at) {
            // If typhoon was resumed, check if existing record was created BEFORE the resume
            // If so, create a new record to preserve history
            $shouldCreateNew = $existingService->created_at < $activeTyphoon->resumed_at;
        }

        if ($shouldCreateNew) {
            // Create new record (preserves history after resume)
            $service = ElectricityService::create([
                'typhoon_id' => $activeTyphoon->id,
                'user_id' => $user->id,
                'status' => $serviceData['status'] ?? null,
                'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                'remarks' => $serviceData['remarks'] ?? null,
                'updated_by' => Auth::id(),
            ]);
        } else {
            // Update existing record (normal update behavior)
            $existingService->update([
                'status' => $serviceData['status'] ?? null,
                'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                'remarks' => $serviceData['remarks'] ?? null,
                'updated_by' => Auth::id(),
            ]);
            $service = $existingService;
        }

        // Return the single most recent report for this typhoon
        $updatedQuery = ElectricityService::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedServices = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Electricity service report saved successfully',
            'electricityServices' => $updatedServices
        ]);
    }

    public function storeWaterService(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'waterServices' => 'required|array',
            'waterServices.*.id' => ['nullable', 'integer'],
            'waterServices.*.source_of_water'  => 'nullable|string|max:255',
            'waterServices.*.barangays_served' => 'nullable|string|max:500',
            'waterServices.*.status'           => 'nullable|string|max:255',
            'waterServices.*.remarks'          => 'nullable|string|max:500',
        ]);

        $user = Auth::user();

        foreach ($validated['waterServices'] as $waterData) {
            // Skip empty rows
            if (empty(array_filter($waterData))) {
                continue;
            }

            // Determine if we should create a new record or update existing
            $shouldCreateNew = false;
            
            // If ID exists and is numeric, check if we should update or create new
            if (!empty($waterData['id']) && is_numeric($waterData['id'])) {
                $existingService = WaterService::find($waterData['id']);
                
                if ($existingService && $activeTyphoon->resumed_at) {
                    // If typhoon was resumed, check if existing record was created BEFORE the resume
                    // If so, create a new record to preserve history
                    $shouldCreateNew = $existingService->created_at < $activeTyphoon->resumed_at;
                }
                
                if (!$shouldCreateNew && $existingService) {
                    // Update existing record
                    $existingService->update([
                        'source_of_water'  => $waterData['source_of_water'] ?? null,
                        'barangays_served' => $waterData['barangays_served'] ?? null,
                        'status'           => $waterData['status'] ?? null,
                        'remarks'          => $waterData['remarks'] ?? null,
                        'typhoon_id'       => $activeTyphoon->id,
                        'updated_by'       => Auth::id(),
                    ]);
                } else {
                    // Create new record (preserves history after resume)
                    $shouldCreateNew = true;
                }
            } else {
                // No ID, create new record
                $shouldCreateNew = true;
            }
            
            if ($shouldCreateNew) {
                // Create new record
                WaterService::create([
                    'source_of_water'  => $waterData['source_of_water'] ?? null,
                    'barangays_served' => $waterData['barangays_served'] ?? null,
                    'status'           => $waterData['status'] ?? null,
                    'remarks'          => $waterData['remarks'] ?? null,
                    'user_id'          => $user->id,
                    'updated_by'       => Auth::id(),
                    'typhoon_id'       => $activeTyphoon->id,
                ]);
            }
        }

        // Return fresh data after save (limit to recent 100 records)
        $updatedQuery = WaterService::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedServices = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Water service reports saved successfully',
            'waterServices' => $updatedServices
        ]);
    }


    public function storeCommunication(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'communications' => 'required|array',
            'communications.*.id' => ['nullable', 'integer'],
            'communications.*.globe' => 'nullable|string|max:255',
            'communications.*.smart' => 'nullable|string|max:255',
            'communications.*.pldt_landline' => 'nullable|string|max:255',
            'communications.*.pldt_internet' => 'nullable|string|max:255',
            'communications.*.vhf' => 'nullable|string|max:255',
            'communications.*.remarks' => 'nullable|string|max:500',
        ]);

        foreach ($validated['communications'] as $commData) {
            // Skip empty rows
            if (empty(array_filter($commData))) {
                continue;
            }

            // If ID exists and is numeric, update existing record
            if (!empty($commData['id']) && is_numeric($commData['id'])) {
                $communication = Communication::find($commData['id']);
                if ($communication) {
                    $communication->update([
                        'globe' => $commData['globe'] ?? null,
                        'smart' => $commData['smart'] ?? null,
                        'pldt_landline' => $commData['pldt_landline'] ?? null,
                        'pldt_internet' => $commData['pldt_internet'] ?? null,
                        'vhf' => $commData['vhf'] ?? null,
                        'remarks' => $commData['remarks'] ?? null,
                        'typhoon_id' => $activeTyphoon->id,
                        'updated_by' => Auth::id(),
                    ]);
                }
            } else {
                // Create new record
                Communication::create([
                    'globe' => $commData['globe'] ?? null,
                    'smart' => $commData['smart'] ?? null,
                    'pldt_landline' => $commData['pldt_landline'] ?? null,
                    'pldt_internet' => $commData['pldt_internet'] ?? null,
                    'vhf' => $commData['vhf'] ?? null,
                    'remarks' => $commData['remarks'] ?? null,
                    'user_id' => Auth::id(),
                    'updated_by' => Auth::id(),
                    'typhoon_id' => $activeTyphoon->id,
                ]);
            }
        }

        // Return fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = Communication::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedCommunications = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Communication reports saved successfully',
            'communications' => $updatedCommunications
        ]);
    }

    public function storeRoad(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

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
                        'typhoon_id' => $activeTyphoon->id,
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
                    'typhoon_id' => $activeTyphoon->id,
                ]);
            }
        }

        // Return fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = Road::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedRoads = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();
        
        return response()->json([
            'message' => 'Road reports saved successfully',
            'roads' => $updatedRoads
        ]);
    }

    public function storeBridge(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

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
                        'typhoon_id' => $activeTyphoon->id,
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
                    'typhoon_id' => $activeTyphoon->id,
                ]);
            }
        }

        // Return fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = Bridge::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedBridges = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
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
        // Optimized: Limit to recent 200 records
        $weatherReports = WeatherReport::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->limit(200)
            ->get();
        
        return response()->json([
            'reports' => $weatherReports
        ]);
    }

    /* ------------------- API: GET WEATHER TIMELINE (Historical) ------------------- */
    public function getWeatherTimeline()
    {
        // Get all modifications for WeatherReport ordered chronologically
        $modifications = Modification::where('model_type', 'WeatherReport')
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        // Track state per model_id
        $stateByModel = [];
        $allStates = [];

        // Reconstruct timeline from modifications
        $index = 0;
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            
            // Initialize state for this model if not exists
            if (!isset($stateByModel[$modelId])) {
                $stateByModel[$modelId] = [
                    'municipality' => null,
                    'sky_condition' => null,
                    'wind' => null,
                    'precipitation' => null,
                    'sea_condition' => null,
                ];
            }

            // Apply changes from this modification to build current state
            foreach ($mod->changed_fields as $field => $change) {
                $stateByModel[$modelId][$field] = $change['new'] ?? null;
            }

            // Snapshot this state at this point in time
            // Add microseconds to ensure unique timestamps for same-second modifications
            $timestamp = $mod->created_at;
            $carbonTime = \Carbon\Carbon::parse($timestamp);
            $carbonTime->addMicroseconds($index * 1000); // Add milliseconds based on index
            
            $allStates[] = [
                'municipality' => $stateByModel[$modelId]['municipality'],
                'sky_condition' => $stateByModel[$modelId]['sky_condition'],
                'wind' => $stateByModel[$modelId]['wind'],
                'precipitation' => $stateByModel[$modelId]['precipitation'],
                'sea_condition' => $stateByModel[$modelId]['sea_condition'],
                'updated_at' => $carbonTime->toIso8601String(),
                'user' => $mod->user,
                'modification_id' => $mod->id, // Add unique identifier
            ];
            
            $index++;
        }

        // Add current state from database for records without modifications
        $currentReports = WeatherReport::with('user:id,name')->get();
        foreach ($currentReports as $report) {
            // Only add if this report hasn't been tracked in modifications
            if (!isset($stateByModel[$report->id])) {
                $allStates[] = [
                    'municipality' => $report->municipality,
                    'sky_condition' => $report->sky_condition,
                    'wind' => $report->wind,
                    'precipitation' => $report->precipitation,
                    'sea_condition' => $report->sea_condition,
                    'updated_at' => $report->updated_at,
                    'user' => $report->user,
                ];
            }
        }

        // Sort by timestamp
        usort($allStates, function($a, $b) {
            return strtotime($a['updated_at']) - strtotime($b['updated_at']);
        });

        return response()->json([
            'timeline' => $allStates
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

    /* ------------------- GET ELECTRICITY HISTORY ------------------- */
    public function getElectricityHistory()
    {
        $user = Auth::user();
        
        // Get all electricity reports for this user, grouped by typhoon
        $reports = ElectricityService::where('user_id', $user->id)
            ->with(['typhoon:id,name,status,started_at,ended_at', 'user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Group reports by typhoon
        $groupedByTyphoon = $reports->groupBy('typhoon_id')->map(function($typhoonReports, $typhoonId) {
            $typhoon = $typhoonReports->first()->typhoon;
            
            return [
                'typhoon' => $typhoon,
                'reports' => $typhoonReports->map(function($report) {
                    return [
                        'id' => $report->id,
                        'status' => $report->status,
                        'barangays_affected' => $report->barangays_affected,
                        'remarks' => $report->remarks,
                        'created_at' => $report->created_at,
                        'updated_at' => $report->updated_at,
                        'user' => $report->user,
                    ];
                })->values()
            ];
        })->values();
        
        return response()->json($groupedByTyphoon);
    }

    /* ------------------- GET WATER SERVICE HISTORY ------------------- */
    public function getWaterServiceHistory()
    {
        $user = Auth::user();
        
        // Get all water service reports for this user, grouped by typhoon
        $reports = WaterService::where('user_id', $user->id)
            ->with(['typhoon:id,name,status,started_at,ended_at', 'user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Group reports by typhoon
        $groupedByTyphoon = $reports->groupBy('typhoon_id')->map(function($typhoonReports, $typhoonId) {
            $typhoon = $typhoonReports->first()->typhoon;
            
            return [
                'typhoon' => $typhoon,
                'reports' => $typhoonReports->map(function($report) {
                    return [
                        'id' => $report->id,
                        'source_of_water' => $report->source_of_water,
                        'barangays_served' => $report->barangays_served,
                        'status' => $report->status,
                        'remarks' => $report->remarks,
                        'created_at' => $report->created_at,
                        'updated_at' => $report->updated_at,
                        'user' => $report->user,
                    ];
                })->values()
            ];
        })->values();
        
        return response()->json($groupedByTyphoon);
    }
}
