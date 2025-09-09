<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SituationOverviewController;
use Illuminate\Foundation\Application;
use App\Http\Controllers\PreemptiveEvacuationController;
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

// Weather Report
Route::middleware('auth')->group(function () {
    Route::resource('situation-reports', SituationOverviewController::class)
        ->only(['index', 'store', 'update'])
        ->middleware('auth');

    Route::post('/weather-reports', [SituationOverviewController::class, 'store'])->name('weather-reports.store');
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])->name('situation-reports.index');
});

Route::get('/preemptive-evacuations', [PreemptiveEvacuationController::class, 'index'])->name('preemptive.index');
Route::post('/preemptive-evacuations', [PreemptiveEvacuationController::class, 'store'])
    ->name('preemptive-evacuations.store');
require __DIR__ . '/auth.php';
