<?php

use App\Http\Controllers\AffectedTouristController;
use App\Http\Controllers\AssistanceExtendedController;
use App\Http\Controllers\AssistanceProvidedLguController;
use App\Http\Controllers\CasualtyController;
use App\Http\Controllers\DamagedHouseReportController;
use App\Http\Controllers\IncidentMonitoredController;
use App\Http\Controllers\MissingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SituationOverviewController;
use App\Http\Controllers\PreEmptiveReportController;
use App\Http\Controllers\UscDeclarationController;
use App\Http\Controllers\PrePositioningController;
use App\Http\Controllers\InjuredController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SuspensionOfClassController;
use App\Http\Controllers\SuspensionOfWorkController;
use App\Models\SuspensionOfClass;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Situation Reports
Route::middleware(['auth', 'role:user|admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');


    // Route to display the HTML overview of the report for a specific year
    Route::get('/reports/view', [ReportController::class, 'view'])
        ->name('reports.view')
        ->middleware(['auth']); // Or your preferred auth middleware

    // Route to handle the PDF download for a specific year
    Route::get('/reports/download', [ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware(['auth']);

    // Situation Reports Index
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])
        ->name('situation-reports.index');

    /* ---------------- Weather Reports ---------------- */
    Route::post('/weather-reports', [SituationOverviewController::class, 'storeWeather'])
        ->name('weather-reports.store');
    Route::get('/modifications/weather', [SituationOverviewController::class, 'weatherModification'])
        ->name('modifications.weather');
    
    /* ---------------- Real-time Typing Indicator ---------------- */
    Route::post('/broadcast-typing', [SituationOverviewController::class, 'broadcastTyping'])
        ->name('broadcast.typing');


    /* ---------------- Water Level Reports ---------------- */
    Route::post('/water-level-reports', [SituationOverviewController::class, 'storeWaterLevel'])
        ->name('water-level-reports.store');
    Route::get('/modifications/water-level', [SituationOverviewController::class, 'waterLevelModification'])
        ->name('modifications.water-level');


    /* ---------------- Electricity Reports ---------------- */
    Route::post('/electricity-reports', [SituationOverviewController::class, 'storeElectricity'])
        ->name('electricity-reports.store');
    Route::get('/modifications/electricity', [SituationOverviewController::class, 'electricityModification'])
        ->name('modifications.electricity');

    /* ---------------- Water Service Reports ---------------- */
    Route::post('/water-service-reports', [SituationOverviewController::class, 'storeWaterService'])
        ->name('water-service-reports.store');
    Route::get('/modifications/water-service', [SituationOverviewController::class, 'waterServiceModification'])
        ->name('modifications.water-service');

    /* ---------------- Communication Reports ---------------- */
    Route::post('/communication-reports', [SituationOverviewController::class, 'storeCommunication'])
        ->name('communication-reports.store');
    Route::get('/modifications/communication', [SituationOverviewController::class, 'communicationModification'])
        ->name('modifications.communication');

    /* ---------------- Road Reports ---------------- */
    Route::post('/road-reports', [SituationOverviewController::class, 'storeRoad'])
        ->name('road-reports.store');
    Route::get('/modifications/road', [SituationOverviewController::class, 'roadModification'])
        ->name('modifications.road');

    /* ---------------- Bridge Reports ---------------- */
    Route::post('/bridge-reports', [SituationOverviewController::class, 'storeBridge'])
        ->name('bridge-reports.store');
    Route::get('/modifications/bridge', [SituationOverviewController::class, 'bridgeModification'])
        ->name('modifications.bridge');

    // Modifications
    Route::prefix('modifications')->group(function () {
        Route::get('/weather', [SituationOverviewController::class, 'weatherModification'])->name('modifications.weather');
        Route::get('/water-level', [SituationOverviewController::class, 'waterLevelModification'])->name('modifications.water-level');
        Route::get('/electricity', [SituationOverviewController::class, 'electricityModification'])->name('modifications.electricity');
        Route::get('/water-service', [SituationOverviewController::class, 'waterServiceModification'])->name('modifications.water-service');
        Route::get('/communication', [SituationOverviewController::class, 'communicationModification'])->name('modifications.communication');
        Route::get('/road', [SituationOverviewController::class, 'roadModification'])->name('modifications.road');
        Route::get('/bridge', [SituationOverviewController::class, 'bridgeModification'])->name('modifications.bridge');
    });


    // Pre-Emptive Reports
    Route::resource('preemptive-reports', PreEmptiveReportController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/preemptive-reports', [PreEmptiveReportController::class, 'store'])
        ->name('preemptive-reports.store');
    Route::get('/preemptive-reports', [PreEmptiveReportController::class, 'index'])
        ->name('preemptive-reports.index');
    
    // Pre-Emptive Reports - New API routes for modernized form
    Route::post('/pre-emptive-reports', [PreEmptiveReportController::class, 'saveReports']);
    Route::get('/modifications/pre-emptive', [PreEmptiveReportController::class, 'getModifications']);

    // Declaration under State of Calamity
    Route::resource('declaration-usc', UscDeclarationController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/declaration-usc', [UscDeclarationController::class, 'store'])
        ->name('declaration-usc.store');
    Route::get('/declaration-usc', [UscDeclarationController::class, 'index'])
        ->name('declaration-usc.index');
    Route::get('/modifications/usc-declaration', [UscDeclarationController::class, 'getModifications'])
        ->name('modifications.usc-declaration');

    /* ---------------- Response Operations (API routes) ---------------- */
    Route::get('/response-operations', [\App\Http\Controllers\ResponseOperationController::class, 'index'])
        ->name('response-operations.index');
    Route::post('/response-operations-reports', [\App\Http\Controllers\ResponseOperationController::class, 'store'])
        ->name('response-operations-reports.store');
    Route::get('/modifications/response-operations', [\App\Http\Controllers\ResponseOperationController::class, 'getModifications'])
        ->name('modifications.response-operations');

    // Deployment of Response Assets
    Route::resource('pre-positioning', PrePositioningController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/pre-positioning', [PrePositioningController::class, 'store'])
        ->name('pre-positioning.store');
    Route::get('/pre-positioning', [PrePositioningController::class, 'index'])
        ->name('pre-positioning.index');
    Route::get('/modifications/pre-positioning', [PrePositioningController::class, 'getModifications'])
        ->name('modifications.pre-positioning');

    // Effects of Incident Monitored
    Route::resource('incident-monitored', IncidentMonitoredController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/incident-monitored', [IncidentMonitoredController::class, 'store'])
        ->name('incident-monitored.store');
    Route::get('/incident-monitored', [IncidentMonitoredController::class, 'index'])
        ->name('incident-monitored.index');
    Route::get('/modifications/incident-monitored', [IncidentMonitoredController::class, 'getModifications'])
        ->name('modifications.incident-monitored');

    // Casualties Dead
    Route::resource('casualties', CasualtyController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/casualties', [CasualtyController::class, 'store'])
        ->name('casualties.store');
    Route::get('/casualties', [CasualtyController::class, 'index'])
        ->name('casualties.index');
    Route::get('/modifications/casualties', [CasualtyController::class, 'getModifications'])
        ->name('modifications.casualties');

    // Injured
    Route::resource('injured', InjuredController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/injured', [InjuredController::class, 'store'])
        ->name('injured.store');
    Route::get('/injured', [InjuredController::class, 'index'])
        ->name('injured.index');
    Route::get('/modifications/injured', [InjuredController::class, 'getModifications'])
        ->name('modifications.injured');

    // Missing Persons
    Route::resource('missing', MissingController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/missing', [MissingController::class, 'store'])
        ->name('missing.store');
    Route::get('/missing', [MissingController::class, 'index'])
        ->name('missing.index');
    Route::get('/modifications/missing', [MissingController::class, 'getModifications'])
        ->name('modifications.missing');

    // Affected Tourists
    Route::resource('affected-tourists', AffectedTouristController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/affected-tourists', [AffectedTouristController::class, 'store'])
        ->name('affected-tourists.store');
    Route::get('/affected-tourists', [AffectedTouristController::class, 'index'])
        ->name('affected-tourists.index');
    
    /* ---------------- Affected Tourists Reports (new API routes) ---------------- */
    Route::post('/affected-tourists-reports', [AffectedTouristController::class, 'store'])
        ->name('affected-tourists-reports.store');
    Route::get('/modifications/affected-tourists', [AffectedTouristController::class, 'getModifications'])
        ->name('modifications.affected-tourists');

    // Damaged Houses
    Route::resource('damaged-houses', DamagedHouseReportController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/damaged-houses', [DamagedHouseReportController::class, 'store'])
        ->name('damaged-houses.store');
    Route::get('/damaged-houses', [DamagedHouseReportController::class, 'index'])
        ->name('damaged-houses.index');
    
    /* ---------------- Damaged Houses Reports (new API routes) ---------------- */
    Route::post('/damaged-houses-reports', [DamagedHouseReportController::class, 'store'])
        ->name('damaged-houses-reports.store');
    Route::get('/modifications/damaged-houses', [DamagedHouseReportController::class, 'getModifications'])
        ->name('modifications.damaged-houses');


    // Assistance Extended
    Route::resource('assistance-extendeds', AssistanceExtendedController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/assistance-extendeds', [AssistanceExtendedController::class, 'store'])
        ->name('assistance-extendeds.store');
    Route::get('/assistance-extendeds', [AssistanceExtendedController::class, 'index'])
        ->name('assistance-extendeds.index');

    /* ---------------- Suspension of Classes (API routes) ---------------- */
    Route::post('/suspension-classes-reports', [SuspensionOfClassController::class, 'store'])
        ->name('suspension-classes-reports.store');
    Route::get('/modifications/suspension-classes', [SuspensionOfClassController::class, 'getModifications'])
        ->name('modifications.suspension-classes');

    /* ---------------- Suspension of Work (API routes) ---------------- */
    Route::post('/suspension-work-reports', [SuspensionOfWorkController::class, 'store'])
        ->name('suspension-work-reports.store');
    Route::get('/modifications/suspension-work', [SuspensionOfWorkController::class, 'getModifications'])
        ->name('modifications.suspension-work');

    Route::get('/assistance', function () {
        return inertia('AssistanceExtended/AssistanceIndex');
    })->name('assistance.index');

    // Assistance Provided LGUs
    Route::resource('assistance-provided-lgus', AssistanceProvidedLguController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/assistance-provided-lgus', [AssistanceProvidedLguController::class, 'store'])
        ->name('assistance-provided-lgus.store');
    Route::get('/assistance-provided-lgus', [AssistanceProvidedLguController::class, 'index'])
        ->name('assistance-provided-lgus.index');
});

use App\Http\Controllers\DashboardController;

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('admin/dashboard', [DashboardController::class, 'index'])
        ->name('admin.dashboard');
});

require __DIR__ . '/auth.php';
