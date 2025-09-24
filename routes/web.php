<?php

use App\Http\Controllers\AffectedTouristController;
use App\Http\Controllers\AssistanceExtendedController;
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
use App\Http\Controllers\SuspensionOfClassController;
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
Route::middleware(['auth', 'role:user'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::resource('situation-reports', SituationOverviewController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/weather-reports', [SituationOverviewController::class, 'store'])
        ->name('weather-reports.store');
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])
        ->name('situation-reports.index');

    // Pre-Emptive Reports
    Route::resource('preemptive-reports', PreEmptiveReportController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/preemptive-reports', [PreEmptiveReportController::class, 'store'])
        ->name('preemptive-reports.store');
    Route::get('/preemptive-reports', [PreEmptiveReportController::class, 'index'])
        ->name('preemptive-reports.index');

    // Declaration under State of Calamity
    Route::resource('declaration-usc', UscDeclarationController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/declaration-usc', [UscDeclarationController::class, 'store'])
        ->name('declaration-usc.store');
    Route::get('/declaration-usc', [UscDeclarationController::class, 'index'])
        ->name('declaration-usc.index');

    // Response Operations added by kevin
    Route::resource('response-operations', \App\Http\Controllers\ResponseOperationController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/response-operations', [\App\Http\Controllers\ResponseOperationController::class, 'store'])
        ->name('response-operations.store');
    Route::get('/response-operations', [\App\Http\Controllers\ResponseOperationController::class, 'index'])
        ->name('response-operations.index');

    // Deployment of Response Assets
    Route::resource('pre-positioning', PrePositioningController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/pre-positioning', [PrePositioningController::class, 'store'])
        ->name('pre-positioning.store');
    Route::get('/pre-positioning', [PrePositioningController::class, 'index'])
        ->name('pre-positioning.index');

    // Effects of Incident Monitored
    Route::resource('incident-monitored', IncidentMonitoredController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/incident-monitored', [IncidentMonitoredController::class, 'store'])
        ->name('incident-monitored.store');
    Route::get('/incident-monitored', [IncidentMonitoredController::class, 'index'])
        ->name('incident-monitored.index');

    // Casualties Dead
    Route::resource('casualties', CasualtyController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/casualties', [CasualtyController::class, 'store'])
        ->name('casualties.store');
    Route::get('/casualties', [CasualtyController::class, 'index'])
        ->name('casualties.index');

    // Injured
    Route::resource('injured', InjuredController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/injured', [InjuredController::class, 'store'])
        ->name('injured.store');
    Route::get('/injured', [InjuredController::class, 'index'])
        ->name('injured.index');

    // Missing Persons
    Route::resource('missing', MissingController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/missing', [MissingController::class, 'store'])
        ->name('missing.store');
    Route::get('/missing', [MissingController::class, 'index'])
        ->name('missing.index');

    // Affected Tourists
    Route::resource('affected-tourists', AffectedTouristController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/affected-tourists', [AffectedTouristController::class, 'store'])
        ->name('affected-tourists.store');
    Route::get('/affected-tourists', [AffectedTouristController::class, 'index'])
        ->name('affected-tourists.index');

    // Damaged Houses
    Route::resource('damaged-houses', DamagedHouseReportController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/damaged-houses', [DamagedHouseReportController::class, 'store'])
        ->name('damaged-houses.store');
    Route::get('/damaged-houses', [DamagedHouseReportController::class, 'index'])
        ->name('damaged-houses.index');



    // Assistance Extended
    Route::resource('assistance-extendeds', AssistanceExtendedController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/assistance-extendeds', [AssistanceExtendedController::class, 'store'])
        ->name('assistance-extendeds.store');
    Route::get('/assistance-extendeds', [AssistanceExtendedController::class, 'index'])
        ->name('assistance-extendeds.index');

    // Suspension of Classes
    Route::resource('suspension-of-classes', SuspensionOfClassController::class)
        ->only(['index', 'store', 'update']);
    Route::post('/suspension-of-classes', [SuspensionOfClassController::class, 'store'])
        ->name('suspension-of-classes.store');
    Route::get('/suspension-of-classes', [SuspensionOfClassController::class, 'index'])
        ->name('suspension-of-classes.index');

});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('admin/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');
});

require __DIR__ . '/auth.php';
