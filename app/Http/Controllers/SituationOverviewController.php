<?php

namespace App\Http\Controllers;

use App\Events\UserTyping;
use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\CommunicationServiceValue;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\Modification;
use App\Models\PreEmptiveReport;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\WeatherReport;
use App\Services\Barangays;
use App\Services\ReportHistory;
use App\Traits\AuthorizesRecordWrites;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class SituationOverviewController extends Controller
{
    use AuthorizesRecordWrites, ValidatesDisasterStatus;

    /* ------------------- INDEX ------------------- */
    public function index()
    {
        // Optimized: Limit to last 100 records for performance
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $weatherQuery = WeatherReport::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $waterLevelQuery = WaterLevel::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $electricityQuery = ElectricityService::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $waterServiceQuery = WaterService::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $communicationQuery = Communication::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $roadQuery = Road::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $bridgeQuery = Bridge::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $preEmptiveQuery = PreEmptiveReport::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $casualtyQuery = Casualty::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $injuredQuery = Injured::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $missingQuery = Missing::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $incidentQuery = IncidentMonitored::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $touristQuery = AffectedTourist::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $damagedHouseQuery = DamagedHouseReport::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $suspensionOfClassQuery = SuspensionOfClass::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));
        $suspensionOfWorkQuery = SuspensionOfWork::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));

        // Pausing/resuming a disaster only blocks submissions; it never hides records.
        // Forms always show everything for the active disaster, matching the admin views.
        if ($user && ! $user->isAdmin()) {
            // Get all user IDs whose data this user can access (including their own)
            $accessibleUserIds = $user->getAccessibleUserIds('read');

            $weatherQuery->whereIn('user_id', $accessibleUserIds);
            $waterLevelQuery->whereIn('user_id', $accessibleUserIds);
            $electricityQuery->whereIn('user_id', $accessibleUserIds);
            // Water services: load ALL records (collaborative editing between IWD and CDRRMO)
            // $waterServiceQuery->whereIn('user_id', $accessibleUserIds); // Removed filtering
            $communicationQuery->whereIn('user_id', $accessibleUserIds);
            $roadQuery->whereIn('user_id', $accessibleUserIds);
            $bridgeQuery->whereIn('user_id', $accessibleUserIds);
            // A barangay sees only its own pre-emptive rows; city offices (CDRRMO, CSWDO) see every barangay's.
            if (Barangays::accounts()->has($user->id)) {
                $preEmptiveQuery->ofBarangay($user);
            }
            $casualtyQuery->whereIn('user_id', $accessibleUserIds);
            $injuredQuery->whereIn('user_id', $accessibleUserIds);
            $missingQuery->whereIn('user_id', $accessibleUserIds);
            $incidentQuery->whereIn('user_id', $accessibleUserIds);
            $touristQuery->whereIn('user_id', $accessibleUserIds);
            $damagedHouseQuery->whereIn('user_id', $accessibleUserIds);
            $suspensionOfClassQuery->whereIn('user_id', $accessibleUserIds);
            $suspensionOfWorkQuery->whereIn('user_id', $accessibleUserIds);
        }

        // Phones on mobile data: only the forms this account can open are read and sent
        // (the page shows no others); the rest go out as empty lists. Closures, so a partial
        // reload of one form's records doesn't read the others either.
        $permissions = $user?->getPermissionNames()->all() ?? [];
        $isAdmin = $user?->isAdmin() ?? false;
        $holds = fn (string $permission) => $isAdmin || in_array($permission, $permissions, true);
        $forForm = fn (string $permission, \Closure $records) => fn () => $holds($permission) ? $records() : [];

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $forForm('access-weather-form', fn () => $weatherQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'waterLevels' => $forForm('access-water-level-form', fn () => $waterLevelQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'electricity' => $forForm('access-electricity-form', fn () => $electricityQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'waterServices' => $forForm('access-water-service-form', fn () => $waterServiceQuery
                ->with('user:id,name') // Load user relationship
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'communications' => $forForm('access-communication-form', fn () => $communicationQuery
                ->with('serviceValues:id,communication_id,service_id,status')
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'roads' => $forForm('access-road-form', fn () => $roadQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'bridges' => $forForm('access-bridge-form', fn () => $bridgeQuery
                ->where(function ($query) {
                    // Filter out completely empty rows
                    $query->where(function ($q) {
                        $q->whereNotNull('road_classification')->where('road_classification', '!=', '');
                    })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('name_of_bridge')->where('name_of_bridge', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('status')->where('status', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('areas_affected')->where('areas_affected', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('re_routing')->where('re_routing', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('remarks')->where('remarks', '!=', '');
                        });
                })
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'preEmptiveReports' => $forForm('access-pre-emptive-form', fn () => $preEmptiveQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'casualties' => $forForm('access-casualty-form', fn () => $casualtyQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'injured' => $forForm('access-injured-form', fn () => $injuredQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'missing' => $forForm('access-missing-form', fn () => $missingQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'incidents' => $forForm('access-incident-form', fn () => $incidentQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'affectedTourists' => $forForm('access-tourist-form', fn () => $touristQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'damagedHouses' => $forForm('access-damaged-houses-form', fn () => $damagedHouseQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'suspensionOfClasses' => $forForm('access-suspension-classes-form', fn () => $suspensionOfClassQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            'suspensionOfWork' => $forForm('access-suspension-work-form', fn () => $suspensionOfWorkQuery
                ->orderBy('updated_at', 'desc')->limit(100)->get()),
            // One shared list per disaster, and saving removes crops left out of it, so the
            // form must get every row of the active disaster: no limit, no other disasters.
            'agriculture' => $forForm('access-agriculture-form', fn () => $typhoonId
                ? AgricultureReport::where('disaster_id', $typhoonId)->orderBy('created_at')->get()
                : []),
        ]);
    }

    /* ------------------- STORE METHODS ------------------- */
    public function storeWeather(Request $request)
    {
        $this->authorizeForm('access-weather-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        // 1. Stricter Validation Rules
        $validated = $request->validate([
            'reports' => 'required|array',
            // ID must be a valid integer that exists in the weather_reports table, or can be null.
            'reports.*.id' => [
                'nullable',
                'integer',
                Rule::exists('weather_reports', 'id'),
            ],
            'reports.*.sky_condition' => 'nullable|string|max:255',
            'reports.*.wind' => 'nullable|string|max:255',
            'reports.*.precipitation' => 'nullable|string|max:255',
            'reports.*.sea_condition' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $activeTyphoon) {
            foreach ($validated['reports'] as $reportData) {
                // 2. More Robust Saving Logic

                // If an ID exists, we find and update that specific record.
                if (! empty($reportData['id'])) {
                    $weatherReport = $this->findWritableRecord(WeatherReport::class, $reportData['id']);
                    if ($weatherReport) {
                        // Only update fields that have actually changed
                        $fieldsToUpdate = [];

                        if ($weatherReport->sky_condition !== ($reportData['sky_condition'] ?? null)) {
                            $fieldsToUpdate['sky_condition'] = $reportData['sky_condition'] ?? null;
                        }
                        if ($weatherReport->wind !== ($reportData['wind'] ?? null)) {
                            $fieldsToUpdate['wind'] = $reportData['wind'] ?? null;
                        }
                        if ($weatherReport->precipitation !== ($reportData['precipitation'] ?? null)) {
                            $fieldsToUpdate['precipitation'] = $reportData['precipitation'] ?? null;
                        }
                        if ($weatherReport->sea_condition !== ($reportData['sea_condition'] ?? null)) {
                            $fieldsToUpdate['sea_condition'] = $reportData['sea_condition'] ?? null;
                        }

                        // Only save if there are actual changes
                        if (! empty($fieldsToUpdate)) {
                            $fieldsToUpdate['updated_by'] = Auth::id();
                            $weatherReport->update($fieldsToUpdate);
                        }
                    }
                }
                // If no ID, it's a new record. We create it.
                else {
                    // Weather is PAGASA's forecast for Ilagan only, whatever location is sent.
                    WeatherReport::create([
                        'municipality' => 'City of Ilagan',
                        'sky_condition' => $reportData['sky_condition'],
                        'wind' => $reportData['wind'],
                        'precipitation' => $reportData['precipitation'],
                        'sea_condition' => $reportData['sea_condition'],
                        'user_id' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'disaster_id' => $activeTyphoon->id,
                    ]);
                }
            }
        });

        // Return the fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = WeatherReport::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedReports = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Weather reports saved successfully!',
            'reports' => $updatedReports,
        ]);
    }

    public function storeWaterLevel(Request $request)
    {
        $this->authorizeForm('access-water-level-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'reports' => ['required', 'array'],
            'reports.*.id' => ['nullable'],
            'reports.*.gauging_station' => ['required', 'string'],
            'reports.*.current_level' => ['nullable', 'numeric', 'min:-999999.99', 'max:999999.99'],
            'reports.*.alarm_level' => ['nullable', 'numeric', 'min:-999999.99', 'max:999999.99'],
            'reports.*.critical_level' => ['nullable', 'numeric', 'min:-999999.99', 'max:999999.99'],
            'reports.*.affected_areas' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $activeTyphoon) {
            foreach ($validated['reports'] as $reportData) {
                // If ID is numeric, update existing record
                if (! empty($reportData['id']) && is_numeric($reportData['id'])) {
                    $waterLevel = $this->findWritableRecord(WaterLevel::class, $reportData['id']);
                    if ($waterLevel) {
                        $waterLevel->update([
                            'gauging_station' => $reportData['gauging_station'],
                            'current_level' => $reportData['current_level'],
                            'alarm_level' => $reportData['alarm_level'],
                            'critical_level' => $reportData['critical_level'],
                            'affected_areas' => $reportData['affected_areas'],
                            'disaster_id' => $activeTyphoon->id,
                            'updated_by' => Auth::id(),
                        ]);
                    }
                } else {
                    // Create new record
                    if (empty($reportData['gauging_station'])) {
                        continue;
                    }

                    WaterLevel::create([
                        'gauging_station' => $reportData['gauging_station'],
                        'current_level' => $reportData['current_level'],
                        'alarm_level' => $reportData['alarm_level'],
                        'critical_level' => $reportData['critical_level'],
                        'affected_areas' => $reportData['affected_areas'],
                        'user_id' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'disaster_id' => $activeTyphoon->id,
                    ]);
                }
            }
        });

        // Return the fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = WaterLevel::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedReports = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Water level reports saved successfully!',
            'reports' => $updatedReports,
        ]);
    }

    public function storeElectricity(Request $request)
    {
        $this->authorizeForm('access-electricity-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'electricityServices' => 'required|array',
            'electricityServices.*.id' => ['nullable', 'integer'],
            'electricityServices.*.status' => 'nullable|string',
            'electricityServices.*.barangays_affected' => 'nullable|string',
            'electricityServices.*.remarks' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Get ALL existing record IDs for this typhoon (not just current user's)
        $existingIds = ElectricityService::where('disaster_id', $activeTyphoon->id)
            ->pluck('id')
            ->toArray();

        $processedIds = [];
        $savedServices = [];

        // Update existing or create new reports
        DB::transaction(function () use ($validated, $existingIds, $activeTyphoon, $user, &$processedIds, &$savedServices) {
            foreach ($validated['electricityServices'] as $serviceData) {
                // Skip empty rows
                if (empty($serviceData['status']) &&
                    empty($serviceData['barangays_affected']) &&
                    empty($serviceData['remarks'])) {
                    continue;
                }

                if (! empty($serviceData['id']) && in_array($serviceData['id'], $existingIds)) {
                    // Update the record when this account may change it
                    $service = $this->findWritableRecord(ElectricityService::class, $serviceData['id']);
                    if ($service) {
                        $service->update([
                            'status' => $serviceData['status'] ?? null,
                            'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                            'remarks' => $serviceData['remarks'] ?? null,
                            'updated_by' => Auth::id(), // Track who made the update
                        ]);
                        $processedIds[] = $service->id;
                        $savedServices[] = $service;
                    }
                } elseif (! empty($serviceData['id']) && ElectricityService::whereKey($serviceData['id'])->exists()) {
                    // A row of another disaster is never copied in. An id that is gone falls through to
                    // a new row: this list deletes rows, so another device may have removed the one edited here.
                    $this->noteSkippedRow($serviceData['id']);

                    continue;
                } else {
                    // The creator is always the signed-in account, never a value from the request.
                    $service = ElectricityService::create([
                        'disaster_id' => $activeTyphoon->id,
                        'user_id' => $user->id,
                        'status' => $serviceData['status'] ?? null,
                        'barangays_affected' => $serviceData['barangays_affected'] ?? null,
                        'remarks' => $serviceData['remarks'] ?? null,
                        'updated_by' => Auth::id(),
                    ]);
                    $processedIds[] = $service->id;
                    $savedServices[] = $service;
                }
            }

            // Rows left out of the submission were removed, but only among records this
            // account can write: the form never shows the others, so their absence means nothing.
            // Deleted one by one through Eloquent so the audit observer records it.
            $deletable = ElectricityService::whereIn('id', array_diff($existingIds, $processedIds));
            if (! $user->isAdmin()) {
                $deletable->whereIn('user_id', $user->getAccessibleUserIds('write'));
            }
            $deletable->get()->each->delete();
        });

        // Return all reports for this typhoon
        $updatedQuery = ElectricityService::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedServices = $updatedQuery
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Electricity service report saved successfully',
            'electricityServices' => $updatedServices,
        ]);
    }

    public function storeWaterService(Request $request)
    {
        $this->authorizeForm('access-water-service-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'waterServices' => 'required|array',
            'waterServices.*.id' => ['nullable', 'integer'],
            'waterServices.*.source_of_water' => 'nullable|string|max:255',
            'waterServices.*.barangays_served' => 'nullable|string|max:500',
            'waterServices.*.status' => 'nullable|string|max:255',
            'waterServices.*.remarks' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($validated, $activeTyphoon, $user) {
            foreach ($validated['waterServices'] as $waterData) {
                // Skip empty rows
                if (empty(array_filter($waterData))) {
                    continue;
                }

                // Update the existing record when it has one; otherwise create a new record
                $shouldCreateNew = false;

                if (! empty($waterData['id']) && is_numeric($waterData['id'])) {
                    // Water services is one shared list: any account with the form may edit any
                    // row, but only rows of the current disaster, never an ended one's.
                    $existingService = WaterService::where('disaster_id', $activeTyphoon->id)->find($waterData['id']);

                    if ($existingService) {
                        $existingService->update([
                            'source_of_water' => $waterData['source_of_water'] ?? null,
                            'barangays_served' => $waterData['barangays_served'] ?? null,
                            'status' => $waterData['status'] ?? null,
                            'remarks' => $waterData['remarks'] ?? null,
                            'updated_by' => Auth::id(),
                        ]);
                    } else {
                        // A row of another disaster, or no such row: never copied into this one.
                        $this->noteSkippedRow($waterData['id']);

                        continue;
                    }
                } else {
                    // No ID, create new record
                    $shouldCreateNew = true;
                }

                if ($shouldCreateNew) {
                    // Create new record
                    WaterService::create([
                        'source_of_water' => $waterData['source_of_water'] ?? null,
                        'barangays_served' => $waterData['barangays_served'] ?? null,
                        'status' => $waterData['status'] ?? null,
                        'remarks' => $waterData['remarks'] ?? null,
                        'user_id' => $user->id, // The creator is always the signed-in account
                        'updated_by' => Auth::id(),
                        'disaster_id' => $activeTyphoon->id,
                    ]);
                }
            }
        });

        // Return fresh data after save - LOAD ALL RECORDS (not filtered by user)
        $updatedServices = WaterService::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id)
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Water service reports saved successfully',
            'waterServices' => $updatedServices,
        ]);
    }

    public function storeCommunication(Request $request)
    {
        $this->authorizeForm('access-communication-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'communications' => 'required|array',
            'communications.*.id' => ['nullable', 'integer'],
            'communications.*.globe' => 'nullable|string|max:255',
            'communications.*.smart' => 'nullable|string|max:255',
            'communications.*.pldt_landline' => 'nullable|string|max:255',
            'communications.*.pldt_internet' => 'nullable|string|max:255',
            'communications.*.vhf' => 'nullable|string|max:255',
            'communications.*.remarks' => 'nullable|string|max:500',
            'communications.*.service_values' => 'nullable|array',
            'communications.*.service_values.*.service_id' => ['required', 'integer', Rule::in(CommunicationService::pluck('id')->all())],
            'communications.*.service_values.*.status' => 'nullable|string|max:255',
        ]);

        // All at once: a lookup per service per row is what made long saves slow.
        $savedServiceValues = CommunicationServiceValue::whereIn('communication_id', array_filter(array_column($validated['communications'], 'id')))
            ->get()
            ->keyBy(fn (CommunicationServiceValue $value) => "{$value->communication_id}:{$value->service_id}");

        DB::transaction(function () use ($validated, $activeTyphoon, $savedServiceValues) {
            foreach ($validated['communications'] as $commData) {
                // Skip empty rows
                if (empty(array_filter($commData))) {
                    continue;
                }

                // If ID exists and is numeric, update existing record
                if (! empty($commData['id']) && is_numeric($commData['id'])) {
                    $communication = $this->findWritableRecord(Communication::class, $commData['id']);
                    if ($communication) {
                        // Only update fields that have changed
                        $fieldsToUpdate = [];

                        if ($communication->globe !== ($commData['globe'] ?? null)) {
                            $fieldsToUpdate['globe'] = $commData['globe'] ?? null;
                        }
                        if ($communication->smart !== ($commData['smart'] ?? null)) {
                            $fieldsToUpdate['smart'] = $commData['smart'] ?? null;
                        }
                        if ($communication->pldt_landline !== ($commData['pldt_landline'] ?? null)) {
                            $fieldsToUpdate['pldt_landline'] = $commData['pldt_landline'] ?? null;
                        }
                        if ($communication->pldt_internet !== ($commData['pldt_internet'] ?? null)) {
                            $fieldsToUpdate['pldt_internet'] = $commData['pldt_internet'] ?? null;
                        }
                        if ($communication->vhf !== ($commData['vhf'] ?? null)) {
                            $fieldsToUpdate['vhf'] = $commData['vhf'] ?? null;
                        }
                        if ($communication->remarks !== ($commData['remarks'] ?? null)) {
                            $fieldsToUpdate['remarks'] = $commData['remarks'] ?? null;
                        }

                        // Always update disaster_id and updated_by
                        $fieldsToUpdate['disaster_id'] = $activeTyphoon->id;
                        $fieldsToUpdate['updated_by'] = Auth::id();

                        // Only call update if there are changes
                        if (count($fieldsToUpdate) > 2) { // More than just disaster_id and updated_by
                            $communication->update($fieldsToUpdate);
                        }

                        // Handle dynamic service values
                        if (isset($commData['service_values']) && is_array($commData['service_values'])) {
                            foreach ($commData['service_values'] as $serviceValue) {
                                $key = "{$communication->id}:{$serviceValue['service_id']}";
                                $value = $savedServiceValues[$key] ?? new CommunicationServiceValue([
                                    'communication_id' => $communication->id,
                                    'service_id' => $serviceValue['service_id'],
                                ]);
                                $value->status = $serviceValue['status'] ?? null;
                                $value->save();
                                $savedServiceValues[$key] = $value;
                            }
                        }
                    }
                } else {
                    // Create new record
                    $communication = Communication::create([
                        'globe' => $commData['globe'] ?? null,
                        'smart' => $commData['smart'] ?? null,
                        'pldt_landline' => $commData['pldt_landline'] ?? null,
                        'pldt_internet' => $commData['pldt_internet'] ?? null,
                        'vhf' => $commData['vhf'] ?? null,
                        'remarks' => $commData['remarks'] ?? null,
                        'user_id' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'disaster_id' => $activeTyphoon->id,
                    ]);

                    // Handle dynamic service values
                    if (isset($commData['service_values']) && is_array($commData['service_values'])) {
                        foreach ($commData['service_values'] as $serviceValue) {
                            CommunicationServiceValue::create([
                                'communication_id' => $communication->id,
                                'service_id' => $serviceValue['service_id'],
                                'status' => $serviceValue['status'] ?? null,
                            ]);
                        }
                    }
                }
            }
        });

        // Return fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = Communication::with(['user:id,name', 'serviceValues.service'])
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedCommunications = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Communication reports saved successfully',
            'communications' => $updatedCommunications,
        ]);
    }

    public function storeRoad(Request $request)
    {
        $this->authorizeForm('access-road-form');

        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'roads' => 'required|array',
            'roads.*.id' => ['nullable', 'integer'],
            'roads.*.road_classification' => 'nullable|string|max:255',
            'roads.*.name_of_road' => 'nullable|string|max:255',
            'roads.*.status' => 'nullable|string|max:255',
            'roads.*.areas_affected' => 'nullable|string|max:500',
            'roads.*.re_routing' => 'nullable|string|max:500',
            'roads.*.remarks' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($validated, $activeTyphoon) {
            foreach ($validated['roads'] as $roadData) {
                // Skip empty rows
                if (empty(array_filter($roadData))) {
                    continue;
                }

                // If ID exists and is numeric, update existing record
                if (! empty($roadData['id']) && is_numeric($roadData['id'])) {
                    $road = $this->findWritableRecord(Road::class, $roadData['id']);
                    if ($road) {
                        $road->update([
                            'road_classification' => $roadData['road_classification'] ?? null,
                            'name_of_road' => $roadData['name_of_road'] ?? null,
                            'status' => $roadData['status'] ?? null,
                            'areas_affected' => $roadData['areas_affected'] ?? null,
                            're_routing' => $roadData['re_routing'] ?? null,
                            'remarks' => $roadData['remarks'] ?? null,
                            'disaster_id' => $activeTyphoon->id,
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
                        'disaster_id' => $activeTyphoon->id,
                    ]);
                }
            }
        });

        // Return fresh data after save (limit to recent 100 records)
        $user = Auth::user();

        $updatedQuery = Road::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedRoads = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Road reports saved successfully',
            'roads' => $updatedRoads,
        ]);
    }

    public function storeBridge(Request $request)
    {
        try {
            $this->authorizeForm('access-bridge-form');

            // Validate typhoon status
            if ($error = $this->validateActiveTyphoon()) {
                return $error;
            }

            // Get active typhoon
            $activeTyphoon = Typhoon::getActiveTyphoon();

            $validated = $request->validate([
                'bridges' => 'required|array',
                'bridges.*.id' => ['nullable', 'integer'],
                'bridges.*.road_classification' => 'nullable|string|max:255',
                'bridges.*.name_of_bridge' => 'nullable|string|max:255',
                'bridges.*.status' => 'nullable|string|max:255',
                'bridges.*.areas_affected' => 'nullable|string|max:500',
                'bridges.*.re_routing' => 'nullable|string|max:500',
                'bridges.*.remarks' => 'nullable|string|max:500',
            ]);

            DB::transaction(function () use ($validated, $activeTyphoon) {
                foreach ($validated['bridges'] as $bridgeData) {
                    // Skip empty rows - check all fields except 'id'
                    $fieldsToCheck = array_diff_key($bridgeData, ['id' => '']);
                    $hasData = ! empty(array_filter($fieldsToCheck, function ($value) {
                        return $value !== null && $value !== '';
                    }));

                    if (! $hasData) {
                        continue;
                    }

                    // If ID exists and is numeric, update existing record
                    if (! empty($bridgeData['id']) && is_numeric($bridgeData['id'])) {
                        $bridge = $this->findWritableRecord(Bridge::class, $bridgeData['id']);
                        if ($bridge) {
                            $bridge->update([
                                'road_classification' => $bridgeData['road_classification'] ?? null,
                                'name_of_bridge' => $bridgeData['name_of_bridge'] ?? null,
                                'status' => $bridgeData['status'] ?? null,
                                'areas_affected' => $bridgeData['areas_affected'] ?? null,
                                're_routing' => $bridgeData['re_routing'] ?? null,
                                'remarks' => $bridgeData['remarks'] ?? null,
                                'disaster_id' => $activeTyphoon->id,
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
                            'disaster_id' => $activeTyphoon->id,
                        ]);
                    }
                }
            });

            // Return fresh data after save (limit to recent 100 records)
            $user = Auth::user();

            $updatedQuery = Bridge::with('user:id,name')
                ->where('disaster_id', $activeTyphoon->id)
                ->where(function ($query) {
                    // Filter out completely empty rows
                    $query->where(function ($q) {
                        $q->whereNotNull('road_classification')->where('road_classification', '!=', '');
                    })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('name_of_bridge')->where('name_of_bridge', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('status')->where('status', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('areas_affected')->where('areas_affected', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('re_routing')->where('re_routing', '!=', '');
                        })
                        ->orWhere(function ($q) {
                            $q->whereNotNull('remarks')->where('remarks', '!=', '');
                        });
                });

            if ($user && ! $user->isAdmin()) {
                $accessibleUserIds = $user->getAccessibleUserIds('read');
                $updatedQuery->whereIn('user_id', $accessibleUserIds);
            }

            $updatedBridges = $updatedQuery
                ->orderBy('updated_at', 'desc')
                ->limit(100)
                ->get();

            return response()->json([
                'message' => 'Bridge reports saved successfully',
                'bridges' => $updatedBridges,
            ]);
        } catch (HttpExceptionInterface|ValidationException $e) {
            throw $e; // Refusals, not failures: a 500 would make a queued save retry forever.
        } catch (\Exception $e) {
            \Log::error('Bridge form submission error: '.$e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
            ]);

            // Exception details stay in the log; the client only learns that it failed.
            return response()->json([
                'error' => 'An error occurred while saving bridge reports',
                'message' => 'An error occurred while saving bridge reports',
            ], 500);
        }
    }

    /* ------------------- MODIFICATIONS ------------------- */
    /** @param  class-string<Model>  $modelClass */
    private function buildModificationResponse(string $modelClass, bool $sharedList = false): JsonResponse
    {
        $modifications = Modification::forActiveDisaster($modelClass)
            ->when(! $sharedList, fn ($query) => $query->readableBy(Auth::user(), $modelClass))
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by model_id and field to track modifications per row
        $history = [];
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            foreach ($mod->changed_fields as $field => $change) {
                // Key format: "modelId_field" to track each row+field combination
                $key = $modelId.'_'.$field;
                $history[$key][] = [
                    'user' => $change['user'] ?? ['id' => $mod->user->id, 'name' => $mod->user->name],
                    'old' => $change['old'] ?? null,
                    'new' => $change['new'] ?? null,
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
                    'old' => $change['old'] ?? null,
                    'new' => $change['new'] ?? null,
                    'user' => $change['user'] ?? ['id' => $latest->user->id, 'name' => $latest->user->name],
                ];
            }
            $latest->changed_fields = $latestChangedFields;
        }

        return response()->json([
            'history' => $history,
            'latest' => $latest,
        ]);
    }

    public function weatherModification()
    {
        $this->authorizeForm('access-weather-form');

        return $this->buildModificationResponse(WeatherReport::class);
    }

    public function waterLevelModification()
    {
        $this->authorizeForm('access-water-level-form');

        return $this->buildModificationResponse(WaterLevel::class);
    }

    public function electricityModification()
    {
        $this->authorizeForm('access-electricity-form');

        return $this->buildModificationResponse(ElectricityService::class);
    }

    public function waterServiceModification()
    {
        $this->authorizeForm('access-water-service-form');

        // One list every holder of the form edits, so its history is shared too.
        return $this->buildModificationResponse(WaterService::class, sharedList: true);
    }

    public function communicationModification()
    {
        $this->authorizeForm('access-communication-form');

        return $this->buildModificationResponse(Communication::class);
    }

    public function roadModification()
    {
        $this->authorizeForm('access-road-form');

        return $this->buildModificationResponse(Road::class);
    }

    public function bridgeModification()
    {
        $this->authorizeForm('access-bridge-form');

        return $this->buildModificationResponse(Bridge::class);
    }

    /* ------------------- API: GET WEATHER REPORTS ------------------- */
    public function getReports()
    {
        $this->authorizeForm('access-weather-form');

        // Optimized: Limit to recent 200 records
        $weatherReports = WeatherReport::with('user:id,name')
            ->orderBy('updated_at', 'desc')
            ->limit(200)
            ->get();

        return response()->json([
            'reports' => $weatherReports,
        ]);
    }

    /* ------------------- REAL-TIME TYPING BROADCAST ------------------- */
    public function broadcastTyping(Request $request)
    {
        // Old clients still send userId and userName; they are ignored, the account is the signed-in one.
        $validated = $request->validate([
            'fieldKey' => 'required|string|max:255',
            'isTyping' => 'required|boolean',
            'channel' => ['required', Rule::in(UserTyping::CHANNELS)],
        ]);

        // Broadcast the typing event
        broadcast(new UserTyping(
            Auth::id(),
            Auth::user()->name,
            $validated['fieldKey'],
            $validated['isTyping'],
            $validated['channel']
        ))->toOthers();

        return response()->json(['status' => 'success']);
    }

    /* ------------------- GET ELECTRICITY HISTORY ------------------- */
    public function getElectricityHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(ElectricityService::class, ['status', 'barangays_affected', 'remarks'], Auth::user()));
    }

    /* ------------------- VIEW/DOWNLOAD ELECTRICITY PDF ------------------- */
    public function viewElectricityPdf($typhoonId)
    {
        $user = Auth::user();

        // Get the typhoon
        $typhoon = Typhoon::findOrFail($typhoonId);

        // Get all electricity reports for this typhoon by accessible users
        $accessibleUserIds = $user->getAccessibleUserIds('read');
        $reports = ElectricityService::where('disaster_id', $typhoonId)
            ->whereIn('user_id', $accessibleUserIds)
            ->with(['user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        if ($reports->isEmpty()) {
            abort(404, 'No electricity reports found for this disaster.');
        }

        // Prepare data for PDF
        $data = [
            'typhoon' => $typhoon,
            'reports' => $reports,
            'user' => $user,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        // Generate PDF
        $pdf = \PDF::loadView('reports.electricity_service', $data);
        $pdf->setPaper('a4', 'portrait');

        // Check if download is requested
        if (request()->has('download')) {
            $filename = 'Electricity_Report_'.str_replace(' ', '_', $typhoon->name).'_'.now()->format('Y-m-d').'.pdf';

            return $pdf->download($filename);
        }

        // Otherwise, stream for viewing
        return $pdf->stream('Electricity_Report_'.str_replace(' ', '_', $typhoon->name).'.pdf');
    }

    /* ------------------- VIEW/DOWNLOAD WATER SERVICE PDF ------------------- */
    public function viewWaterServicePdf($typhoonId)
    {
        $user = Auth::user();

        // Get the typhoon
        $typhoon = Typhoon::findOrFail($typhoonId);

        // Get all water service reports for this typhoon (no user filtering due to collaborative editing)
        $reports = WaterService::where('disaster_id', $typhoonId)
            ->with(['user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        if ($reports->isEmpty()) {
            abort(404, 'No water service reports found for this disaster.');
        }

        // Prepare data for PDF
        $data = [
            'typhoon' => $typhoon,
            'reports' => $reports,
            'user' => $user,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];

        // Generate PDF
        $pdf = \PDF::loadView('reports.water_service', $data);
        $pdf->setPaper('a4', 'portrait');

        // Check if download is requested
        if (request()->has('download')) {
            $filename = 'Water_Service_Report_'.str_replace(' ', '_', $typhoon->name).'_'.now()->format('Y-m-d').'.pdf';

            return $pdf->download($filename);
        }

        // Otherwise, stream for viewing
        return $pdf->stream('Water_Service_Report_'.str_replace(' ', '_', $typhoon->name).'.pdf');
    }

    /* ------------------- GET WATER SERVICE HISTORY ------------------- */
    public function getWaterServiceHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(WaterService::class, ['source_of_water', 'barangays_served', 'status', 'remarks'], Auth::user()));
    }

    /* ------------------- GET WEATHER HISTORY ------------------- */
    public function getWeatherHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(WeatherReport::class, ['municipality', 'sky_condition', 'wind', 'precipitation', 'sea_condition'], Auth::user()));
    }

    /* ------------------- GET COMMUNICATION HISTORY ------------------- */
    public function getCommunicationHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(Communication::class, ['globe', 'smart', 'pldt_landline', 'pldt_internet', 'vhf', 'remarks'], Auth::user(), ['serviceValues.service:id,name'], extra: fn ($report) => [
            'service_values' => $report->serviceValues->map(fn ($value) => ['name' => $value->service?->name, 'status' => $value->status])->values(),
        ]));
    }

    /* ------------------- GET ROAD HISTORY ------------------- */
    public function getRoadHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(Road::class, ['road_classification', 'name_of_road', 'status', 'areas_affected', 're_routing', 'remarks'], Auth::user()));
    }

    /* ------------------- GET BRIDGE HISTORY ------------------- */
    public function getBridgeHistory(): JsonResponse
    {
        return response()->json(ReportHistory::forUser(Bridge::class, ['road_classification', 'name_of_bridge', 'status', 'areas_affected', 're_routing', 'remarks'], Auth::user()));
    }
}
