<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

// Import models for audit logging
use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\ElectricityService;
use App\Models\WaterService;
use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\Road;
use App\Models\Bridge;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\IncidentMonitored;
use App\Models\Casualty;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\AffectedTourist;
use App\Models\DamagedHouseReport;
use App\Models\ResponseOperation;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\AssistanceExtended;
use App\Models\AssistanceProvidedLgu;
use App\Models\AgricultureReport;
use App\Models\User;
use App\Models\Typhoon;

use App\Observers\AuditableObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Inertia::share([
            'flash' => function () {
                return [
                    'success' => session('success'),
                    'error' => session('error'),
                ];
            },
        ]);

        // Register audit observers for all models
        $this->registerAuditObservers();
    }

    /**
     * Register observers for audit logging
     */
    private function registerAuditObservers(): void
    {
        // Report models
        WeatherReport::observe(AuditableObserver::class);
        WaterLevel::observe(AuditableObserver::class);
        ElectricityService::observe(AuditableObserver::class);
        WaterService::observe(AuditableObserver::class);
        Communication::observe(AuditableObserver::class);
        CommunicationService::observe(AuditableObserver::class);
        Road::observe(AuditableObserver::class);
        Bridge::observe(AuditableObserver::class);
        PreEmptiveReport::observe(AuditableObserver::class);
        PrePositioning::observe(AuditableObserver::class);
        IncidentMonitored::observe(AuditableObserver::class);
        AgricultureReport::observe(AuditableObserver::class);

        // Casualty models
        Casualty::observe(AuditableObserver::class);
        Injured::observe(AuditableObserver::class);
        Missing::observe(AuditableObserver::class);
        AffectedTourist::observe(AuditableObserver::class);

        // Damage and assistance models
        DamagedHouseReport::observe(AuditableObserver::class);
        ResponseOperation::observe(AuditableObserver::class);
        SuspensionOfClass::observe(AuditableObserver::class);
        SuspensionOfWork::observe(AuditableObserver::class);
        AssistanceExtended::observe(AuditableObserver::class);
        AssistanceProvidedLgu::observe(AuditableObserver::class);

        // System models
        User::observe(AuditableObserver::class);
        Typhoon::observe(AuditableObserver::class);
    }
}
