<?php

use App\Http\Controllers\CasualtyController;
use App\Http\Controllers\IncidentMonitoredController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SituationOverviewController;
use App\Http\Controllers\PreEmptiveReportController;
use App\Http\Controllers\UscDeclarationController;
use App\Http\Controllers\PrePositioningController;
use App\Http\Controllers\InjuredController;
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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

//  Situation Reports
Route::middleware('auth')->group(function () {
    Route::resource('situation-reports', SituationOverviewController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/weather-reports', [SituationOverviewController::class, 'store'])->name('weather-reports.store');
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])->name('situation-reports.index');
});

//  Pre-Emptive Reports
Route::middleware('auth')->group(function () {
    Route::resource('preemptive-reports', PreEmptiveReportController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/preemptive-reports', [PreEmptiveReportController::class, 'store'])->name('preemptive-reports.store');
    Route::get('/preemptive-reports', [PreEmptiveReportController::class, 'index'])->name('preemptive-reports.index');
});

// Declaration under State of Calamity
Route::middleware('auth')->group(function () {
    Route::resource('declaration-usc', UscDeclarationController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/declaration-usc', [UscDeclarationController::class, 'store'])->name('declaration-usc.store');
    Route::get('/declaration-usc', [UscDeclarationController::class, 'index'])->name('declaration-usc.index');
});

// Deployment of Response Assets
Route::middleware('auth')->group(function () {
    Route::resource('pre-positioning', PrePositioningController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/pre-positioning', [PrePositioningController::class, 'store'])->name('pre-positioning.store');
    Route::get('/pre-positioning', [PrePositioningController::class, 'index'])->name('pre-positioning.index');
});

//Effects of Incident Monitored
Route::middleware('auth')->group(function () {
    Route::resource('incident-monitored', IncidentMonitoredController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/incident-monitored', [IncidentMonitoredController::class, 'store'])->name('incident-monitored.store');
    Route::get('/incident-monitored', [IncidentMonitoredController::class, 'index'])->name('incident-monitored.index');
});

//Casualties Dead
Route::middleware('auth')->group(function () {
    Route::resource('casualties', CasualtyController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/casualties', [CasualtyController::class, 'store'])->name('casualties.store');
    Route::get('/casualties', [CasualtyController::class, 'index'])->name('casualties.index');
});

//Injured
Route::middleware('auth')->group(function () {
    Route::resource('injured', \App\Http\Controllers\InjuredController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/injured', [\App\Http\Controllers\InjuredController::class, 'store'])->name('injured.store');
    Route::get('/injured', [\App\Http\Controllers\InjuredController::class, 'index'])->name('injured.index');
});

//Missing Persons
Route::middleware('auth')->group(function () {
    Route::resource('missing', \App\Http\Controllers\MissingController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/missing', [\App\Http\Controllers\MissingController::class, 'store'])->name('missing.store');
    Route::get('/missing', [\App\Http\Controllers\MissingController::class, 'index'])->name('missing.index');
});


// Affected Tourists
Route::middleware('auth')->group(function () {
    Route::resource('affected-tourists', \App\Http\Controllers\AffectedTouristController::class)
        ->only(['index', 'store', 'update']);

    Route::post('/affected-tourists', [\App\Http\Controllers\AffectedTouristController::class, 'store'])->name('affected-tourists.store');
    Route::get('/affected-tourists', [\App\Http\Controllers\AffectedTouristController::class, 'index'])->name('affected-tourists.index');
});
require __DIR__ . '/auth.php';
