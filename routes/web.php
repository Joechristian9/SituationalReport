<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SituationOverviewController;
use App\Http\Controllers\PreEmptiveReportController;
use App\Http\Controllers\UscDeclarationController;
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

// ✅ Situation Reports
Route::middleware('auth')->group(function () {
    Route::resource('situation-reports', SituationOverviewController::class)
        ->only(['index', 'store', 'update'])
        ->middleware('auth');

    Route::post('/weather-reports', [SituationOverviewController::class, 'store'])->name('weather-reports.store');
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])->name('situation-reports.index');
});

// ✅ Pre-Emptive Reports
Route::middleware('auth')->group(function () {
    Route::resource('preemptive-reports', PreEmptiveReportController::class)
        ->only(['index', 'store', 'update'])
        ->middleware('auth');

    Route::post('/preemptive-reports', [PreEmptiveReportController::class, 'store'])->name('preemptive-reports.store');
    Route::get('/preemptive-reports', [PreEmptiveReportController::class, 'index'])->name('preemptive-reports.index');
});

// ✅ Declaration under State of Calamity
Route::middleware('auth')->group(function () {
    Route::resource('declaration-usc', UscDeclarationController::class)
        ->only(['index', 'store', 'update'])
        ->middleware('auth');

    Route::post('/declaration-usc', [UscDeclarationController::class, 'store'])->name('declaration-usc.store');
    Route::get('/declaration-usc', [UscDeclarationController::class, 'index'])->name('declaration-usc.index');
});

require __DIR__ . '/auth.php';
