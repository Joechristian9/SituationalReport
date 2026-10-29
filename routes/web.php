<?php

use App\Http\Controllers\AffectedTouristController;
use App\Http\Controllers\AgricultureReportController;
use App\Http\Controllers\AssistanceExtendedController;
use App\Http\Controllers\AssistanceProvidedLguController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CasualtyController;
use App\Http\Controllers\CommunicationServiceController;
use App\Http\Controllers\DamagedHouseReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisasterController;
use App\Http\Controllers\FormReminderController;
use App\Http\Controllers\IncidentMonitoredController;
use App\Http\Controllers\InjuredController;
use App\Http\Controllers\MissingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PagasaAlertController;
use App\Http\Controllers\PreEmptiveReportController;
use App\Http\Controllers\PrePositioningController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportHistoryController;
use App\Http\Controllers\ResponseOperationController;
use App\Http\Controllers\SituationOverviewController;
use App\Http\Controllers\SuspensionOfClassController;
use App\Http\Controllers\SuspensionOfWorkController;
use App\Http\Controllers\UscDeclarationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\YearController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('welcome');

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    // Deleting an account cascades to its reports, so only admins may do it.
    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->middleware('role:admin')
        ->name('profile.destroy');
});

// Situation Reports
Route::middleware(['auth', 'role:user|admin'])->group(function () {

    // Dashboard - accessible even without active typhoon (for regular users)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Route to display the HTML overview of the report for a specific year
    Route::get('/reports/view', [ReportController::class, 'view'])
        ->name('reports.view')
        ->middleware(['auth', 'throttle:pdf']);

    // Route to handle the PDF download for a specific year
    Route::get('/reports/download', [ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware(['auth', 'throttle:pdf']);

    // The bell in the app header of report accounts (admins send reminders, they don't get them)
    Route::middleware('role:user')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    });

    // Situation Reports Index - accessible even without active typhoon
    Route::get('/situation-reports', [SituationOverviewController::class, 'index'])
        ->name('situation-reports.index');

    // Electricity History Page - accessible even without active typhoon
    Route::get('/electricity/history', function () {
        return inertia('ElectricityHistory/Index');
    })->name('electricity.history');

    // Water Service History Page - accessible even without active typhoon
    Route::get('/water-service/history', function () {
        return inertia('WaterServiceHistory/Index');
    })->name('water-service.history');

    // Weather History Page - accessible even without active typhoon
    Route::get('/weather/history', function () {
        return inertia('WeatherHistory/Index');
    })->name('weather.history');

    // Communication History Page - accessible even without active typhoon
    Route::get('/communication/history', function () {
        return inertia('CommunicationHistory/Index');
    })->name('communication.history');

    // Pre-Emptive History Page - accessible even without active typhoon
    Route::get('/pre-emptive/history', function () {
        return inertia('PreEmptiveHistory/Index');
    })->name('pre-emptive.history');

    // Agriculture History Page - accessible even without active typhoon
    Route::get('/agriculture/history', [AgricultureReportController::class, 'history'])
        ->middleware('permission:access-agriculture-form')
        ->name('agriculture.history');

    // Incident History Page - accessible even without active typhoon
    Route::get('/incident/history', [IncidentMonitoredController::class, 'history'])
        ->name('incident.history');

    // Road History Page - accessible even without active typhoon
    Route::get('/road/history', function () {
        return inertia('RoadHistory/Index');
    })->name('road.history');

    // Bridge History Page - accessible even without active typhoon
    Route::get('/bridge/history', function () {
        return inertia('BridgeHistory/Index');
    })->name('bridge.history');

    // History of the remaining forms (casualties, tourists, response operations, ...).
    Route::get('/report-history/{type}', [ReportHistoryController::class, 'page'])
        ->whereIn('type', ReportHistoryController::types())
        ->name('report-history.show');

    // ============= MODIFICATIONS (Accessible without active typhoon) =============
    Route::prefix('modifications')->group(function () {
        Route::get('/weather', [SituationOverviewController::class, 'weatherModification'])->name('modifications.weather');
        Route::get('/water-level', [SituationOverviewController::class, 'waterLevelModification'])->name('modifications.water-level');
        Route::get('/electricity', [SituationOverviewController::class, 'electricityModification'])->name('modifications.electricity');
        Route::get('/water-service', [SituationOverviewController::class, 'waterServiceModification'])->name('modifications.water-service');
        Route::get('/communication', [SituationOverviewController::class, 'communicationModification'])->name('modifications.communication');
        Route::get('/road', [SituationOverviewController::class, 'roadModification'])->name('modifications.road');
        Route::get('/bridge', [SituationOverviewController::class, 'bridgeModification'])->name('modifications.bridge');
    });

    // ============= FORM ROUTES (Requires Active Typhoon) =============
    // offline.sync only acts on saves sent later from a device's offline queue.
    // Each form below is gated by the same permission the UI uses to show it; admins pass.
    Route::middleware(['typhoon.active', 'offline.sync', 'throttle:report-writes'])->group(function () {

        /* ---------------- Weather Reports (new API routes) ---------------- */
        Route::post('/weather-reports', [SituationOverviewController::class, 'storeWeather'])
            ->name('weather-reports.store');
        Route::get('/api/weather-reports', [SituationOverviewController::class, 'getReports'])
            ->name('api.weather-reports');
        Route::get('/api/weather-timeline', [SituationOverviewController::class, 'getWeatherTimeline'])
            ->name('api.weather-timeline');

        /* ---------------- Real-time Typing Indicator ---------------- */
        Route::post('/broadcast-typing', [SituationOverviewController::class, 'broadcastTyping'])
            ->name('broadcast.typing');

        /* ---------------- Water Level Reports ---------------- */
        Route::post('/water-level-reports', [SituationOverviewController::class, 'storeWaterLevel'])
            ->name('water-level-reports.store');

        /* ---------------- Electricity Reports ---------------- */
        Route::post('/electricity-reports', [SituationOverviewController::class, 'storeElectricity'])
            ->name('electricity-reports.store');

        /* ---------------- Water Service Reports ---------------- */
        Route::post('/water-service-reports', [SituationOverviewController::class, 'storeWaterService'])
            ->name('water-service-reports.store');

        /* ---------------- Communication Reports ---------------- */
        Route::post('/communication-reports', [SituationOverviewController::class, 'storeCommunication'])
            ->name('communication-reports.store');

        /* ---------------- Communication Services Management ---------------- */
        Route::get('/communication-services', [CommunicationServiceController::class, 'index'])
            ->name('communication-services.index');
        Route::post('/communication-services', [CommunicationServiceController::class, 'store'])
            ->name('communication-services.store');
        Route::delete('/communication-services/{id}', [CommunicationServiceController::class, 'destroy'])
            ->name('communication-services.destroy');

        /* ---------------- Road Reports ---------------- */
        Route::post('/road-reports', [SituationOverviewController::class, 'storeRoad'])
            ->name('road-reports.store');

        /* ---------------- Bridge Reports ---------------- */
        Route::post('/bridge-reports', [SituationOverviewController::class, 'storeBridge'])
            ->name('bridge-reports.store');

        // Pre-Emptive Reports - API routes for modernized form
        Route::post('/pre-emptive-reports', [PreEmptiveReportController::class, 'saveReports'])->name('pre-emptive-reports.store');
        Route::get('/modifications/pre-emptive', [PreEmptiveReportController::class, 'getModifications'])->name('modifications.pre-emptive');

        // Declaration under State of Calamity
        Route::middleware('role_or_permission:admin|access-declaration-form')->group(function () {
            Route::resource('declaration-usc', UscDeclarationController::class)
                ->only(['index', 'store', 'update']);
            Route::post('/declaration-usc', [UscDeclarationController::class, 'store'])
                ->name('declaration-usc.store');
            Route::get('/declaration-usc', [UscDeclarationController::class, 'index'])
                ->name('declaration-usc.index');
            Route::get('/modifications/usc-declaration', [UscDeclarationController::class, 'getModifications'])
                ->name('modifications.usc-declaration');
        });

        /* ---------------- Response Operations (API routes) ---------------- */
        Route::middleware('role_or_permission:admin|access-response-operations')->group(function () {
            Route::get('/response-operations', [ResponseOperationController::class, 'index'])
                ->name('response-operations.index');
            Route::post('/response-operations-reports', [ResponseOperationController::class, 'store'])
                ->name('response-operations-reports.store');
            Route::get('/modifications/response-operations', [ResponseOperationController::class, 'getModifications'])
                ->name('modifications.response-operations');
        });

        // Deployment of Response Assets
        Route::middleware('role_or_permission:admin|access-pre-positioning-form')->group(function () {
            Route::resource('pre-positioning', PrePositioningController::class)
                ->only(['index', 'store', 'update']);
            Route::post('/pre-positioning', [PrePositioningController::class, 'store'])
                ->name('pre-positioning.store');
            Route::get('/pre-positioning', [PrePositioningController::class, 'index'])
                ->name('pre-positioning.index');
            Route::get('/modifications/pre-positioning', [PrePositioningController::class, 'getModifications'])
                ->name('modifications.pre-positioning');
        });

        // Effects forms. Each needs its own permission (set in User Management) and is filled in
        // on the Situation Overview; the old Effects page addresses send people there.
        foreach (['incident-monitored', 'casualties', 'injured', 'missing', 'affected-tourists', 'damaged-houses'] as $oldPage) {
            Route::get("/{$oldPage}", fn () => redirect()->route('situation-reports.index'));
        }

        Route::middleware('role_or_permission:admin|access-incident-form')->group(function () {
            Route::resource('incident-monitored', IncidentMonitoredController::class)
                ->only(['store', 'update']);
            Route::post('/incident-monitored', [IncidentMonitoredController::class, 'store'])
                ->name('incident-monitored.store');
            Route::get('/modifications/incident-monitored', [IncidentMonitoredController::class, 'getModifications'])
                ->name('modifications.incident-monitored');
        });

        Route::middleware('role_or_permission:admin|access-suspension-classes-form')->group(function () {
            Route::post('/suspension-classes-reports', [SuspensionOfClassController::class, 'store'])
                ->name('suspension-classes-reports.store');
            Route::get('/modifications/suspension-classes', [SuspensionOfClassController::class, 'getModifications'])
                ->name('modifications.suspension-classes');
        });

        Route::middleware('role_or_permission:admin|access-suspension-work-form')->group(function () {
            Route::post('/suspension-work-reports', [SuspensionOfWorkController::class, 'store'])
                ->name('suspension-work-reports.store');
            Route::get('/modifications/suspension-work', [SuspensionOfWorkController::class, 'getModifications'])
                ->name('modifications.suspension-work');
        });

        // Agriculture Reports
        Route::middleware('permission:access-agriculture-form')->group(function () {
            Route::post('/agriculture-reports', [AgricultureReportController::class, 'store'])
                ->name('agriculture-reports.store');
            Route::get('/modifications/agriculture', [AgricultureReportController::class, 'getModifications'])
                ->name('modifications.agriculture');
        });

        // Casualties Dead
        Route::middleware('role_or_permission:admin|access-casualty-form')->group(function () {
            Route::resource('casualties', CasualtyController::class)
                ->only(['store', 'update']);
            Route::post('/casualties', [CasualtyController::class, 'store'])
                ->name('casualties.store');
            Route::get('/modifications/casualties', [CasualtyController::class, 'getModifications'])
                ->name('modifications.casualties');
        });

        // Injured
        Route::middleware('role_or_permission:admin|access-injured-form')->group(function () {
            Route::resource('injured', InjuredController::class)
                ->only(['store', 'update']);
            Route::post('/injured', [InjuredController::class, 'store'])
                ->name('injured.store');
            Route::get('/modifications/injured', [InjuredController::class, 'getModifications'])
                ->name('modifications.injured');
        });

        // Missing Persons
        Route::middleware('role_or_permission:admin|access-missing-form')->group(function () {
            Route::resource('missing', MissingController::class)
                ->only(['store', 'update']);
            Route::post('/missing', [MissingController::class, 'store'])
                ->name('missing.store');
            Route::get('/modifications/missing', [MissingController::class, 'getModifications'])
                ->name('modifications.missing');
        });

        // Affected Tourists
        Route::middleware('role_or_permission:admin|access-tourist-form')->group(function () {
            Route::resource('affected-tourists', AffectedTouristController::class)
                ->only(['store', 'update']);
            Route::post('/affected-tourists', [AffectedTouristController::class, 'store'])
                ->name('affected-tourists.store');

            /* ---------------- Affected Tourists Reports (new API routes) ---------------- */
            Route::post('/affected-tourists-reports', [AffectedTouristController::class, 'store'])
                ->name('affected-tourists-reports.store');
            Route::get('/modifications/affected-tourists', [AffectedTouristController::class, 'getModifications'])
                ->name('modifications.affected-tourists');
        });

        // Damaged Houses
        Route::middleware('role_or_permission:admin|access-damaged-houses-form')->group(function () {
            Route::resource('damaged-houses', DamagedHouseReportController::class)
                ->only(['store', 'update']);
            Route::post('/damaged-houses', [DamagedHouseReportController::class, 'store'])
                ->name('damaged-houses.store');

            /* ---------------- Damaged Houses Reports (new API routes) ---------------- */
            Route::post('/damaged-houses-reports', [DamagedHouseReportController::class, 'store'])
                ->name('damaged-houses-reports.store');
            Route::get('/modifications/damaged-houses', [DamagedHouseReportController::class, 'getModifications'])
                ->name('modifications.damaged-houses');
        });

        // Assistance Extended and Assistance Provided LGUs share one page
        Route::middleware('role_or_permission:admin|access-assistance-extended')->group(function () {
            Route::resource('assistance-extendeds', AssistanceExtendedController::class)
                ->only(['index', 'store', 'update']);
            Route::post('/assistance-extendeds', [AssistanceExtendedController::class, 'store'])
                ->name('assistance-extendeds.store');
            Route::get('/assistance-extendeds', [AssistanceExtendedController::class, 'index'])
                ->name('assistance-extendeds.index');
            Route::get('/modifications/assistance-extended', [AssistanceExtendedController::class, 'getModifications'])
                ->name('modifications.assistance-extended');

            Route::get('/assistance', function () {
                return inertia('AssistanceExtended/AssistanceIndex');
            })->name('assistance.index');

            Route::resource('assistance-provided-lgus', AssistanceProvidedLguController::class)
                ->only(['index', 'store', 'update']);
            Route::post('/assistance-provided-lgus', [AssistanceProvidedLguController::class, 'store'])
                ->name('assistance-provided-lgus.store');
            Route::get('/assistance-provided-lgus', [AssistanceProvidedLguController::class, 'index'])
                ->name('assistance-provided-lgus.index');
        });

    }); // End of typhoon.active middleware group
});

// Admin-only pages. They have no URL prefix: the role middleware is what keeps others out.
Route::middleware(['auth', 'role:admin'])->group(function () {
    // PAGASA alerts for the dashboard's PAGASA tab (cached server-side)
    Route::get('pagasa-alerts', [PagasaAlertController::class, 'index'])->name('admin.pagasa-alerts');

    // Form Submission Status (Admin only)
    Route::get('form-submission-status', [DisasterController::class, 'formSubmissionStatus'])
        ->name('admin.form-submission-status');
    Route::get('user-form-data/{userId}', [DisasterController::class, 'getUserFormData'])
        ->name('admin.user-form-data');
    Route::post('form-submission-status/remind', [FormReminderController::class, 'store'])
        ->name('admin.form-reminders.store');

    // Audit Logs (Admin only)
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('admin.audit-logs');
    Route::get('audit-logs/export', [AuditLogController::class, 'export'])->name('admin.audit-logs.export');
    Route::get('audit-logs/{id}', [AuditLogController::class, 'show'])->whereNumber('id')->name('admin.audit-logs.show');

    // Year Management (Admin only)
    Route::get('years', [YearController::class, 'index'])->name('admin.years.index');
    Route::post('years', [YearController::class, 'store'])->name('admin.years.store');
    Route::delete('years/{year}', [YearController::class, 'destroy'])->name('admin.years.destroy');

    // User Management (Admin only)
    Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('users', [UserController::class, 'store'])->name('admin.users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');

    // Submission Activity Pages (Admin only)
    Route::get('casualties/submissions', [CasualtyController::class, 'submissions'])->name('admin.casualties.submissions');
    Route::get('injured/submissions', [InjuredController::class, 'submissions'])->name('admin.injured.submissions');
    Route::get('missing/submissions', [MissingController::class, 'submissions'])->name('admin.missing.submissions');

    // Disaster Management (Admin only)
    Route::prefix('disasters')->group(function () {
        Route::get('/', [DisasterController::class, 'index'])->name('disasters.index');
        Route::post('/', [DisasterController::class, 'store'])->name('disasters.store');
        Route::patch('/{disaster}', [DisasterController::class, 'update'])->name('disasters.update');
        Route::get('/{disaster}/summary', [DisasterController::class, 'summary'])->name('disasters.summary');
        Route::post('/{disaster}/pause', [DisasterController::class, 'pause'])->name('disasters.pause');
        Route::post('/{disaster}/resume', [DisasterController::class, 'resume'])->name('disasters.resume');
        Route::get('/{disaster}/snapshot', [DisasterController::class, 'downloadSnapshot'])->middleware('throttle:pdf')->name('disasters.snapshot');
        Route::post('/{disaster}/end', [DisasterController::class, 'end'])->name('disasters.end');
        Route::delete('/{disaster}', [DisasterController::class, 'destroy'])->name('disasters.destroy');
        Route::get('/{disaster}/download', [DisasterController::class, 'downloadPdf'])->middleware('throttle:pdf')->name('disasters.download');
    });
});

// Disaster status and history APIs. They need a role like every other data
// route; an account without one must not read report data.
Route::middleware(['auth', 'role:user|admin'])->group(function () {
    Route::get('/api/disaster/active', [DisasterController::class, 'getActiveTyphoon'])->name('api.disaster.active');
    Route::get('/api/electricity-history', [SituationOverviewController::class, 'getElectricityHistory'])->name('api.electricity-history');
    Route::get('/api/electricity-history/{typhoon}/pdf', [SituationOverviewController::class, 'viewElectricityPdf'])->middleware('throttle:pdf')->name('api.electricity-history.pdf');
    Route::get('/api/water-service-history', [SituationOverviewController::class, 'getWaterServiceHistory'])->name('api.water-service-history');
    Route::get('/api/water-service-history/{typhoon}/pdf', [SituationOverviewController::class, 'viewWaterServicePdf'])->middleware('throttle:pdf')->name('api.water-service-history.pdf');
    Route::get('/api/weather-history', [SituationOverviewController::class, 'getWeatherHistory'])->name('api.weather-history');
    Route::get('/api/communication-history', [SituationOverviewController::class, 'getCommunicationHistory'])->name('api.communication-history');
    Route::get('/api/pre-emptive-history', [PreEmptiveReportController::class, 'getPreEmptiveHistory'])->name('api.pre-emptive-history');
    Route::get('/api/agriculture-history', [AgricultureReportController::class, 'apiHistory'])
        ->middleware('permission:access-agriculture-form')
        ->name('api.agriculture-history');
    Route::get('/api/incident-history', [IncidentMonitoredController::class, 'apiHistory'])->name('api.incident-history');
    Route::get('/api/road-history', [SituationOverviewController::class, 'getRoadHistory'])->name('api.road-history');
    Route::get('/api/bridge-history', [SituationOverviewController::class, 'getBridgeHistory'])->name('api.bridge-history');
    Route::get('/api/report-history/{type}', [ReportHistoryController::class, 'data'])
        ->whereIn('type', ReportHistoryController::types())
        ->name('api.report-history');
});

require __DIR__.'/auth.php';
