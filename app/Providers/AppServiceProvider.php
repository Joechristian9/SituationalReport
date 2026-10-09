<?php

namespace App\Providers;

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\AssistanceProvidedLgu;
use App\Models\Bridge;
use App\Models\Casualty;
// Import models for audit logging
use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\ResponseOperation;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\WeatherReport;
use App\Observers\AuditableObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

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

        $this->registerRateLimiters();

        // /up only proves PHP boots; an uptime monitor must also see the database go down.
        Event::listen(DiagnosingHealth::class, fn () => DB::select('select 1'));

        if ($proxies = config('app.trusted_proxies')) {
            TrustProxies::at(array_map('trim', explode(',', $proxies)));
        }
    }

    private function registerRateLimiters(): void
    {
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(30)->by($request->ip())
            ->response(fn () => back()->withErrors([
                'email' => trans('auth.throttle', ['seconds' => 60, 'minutes' => 1]),
            ])));

        // Only saves count: reading pages and history inside the form group stays unlimited.
        RateLimiter::for('report-writes', function (Request $request) {
            if ($request->isMethodSafe()) {
                return Limit::none();
            }

            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $message = 'Too many saves in a short time. Wait a minute and try again.';

                    return $request->expectsJson()
                        ? response()->json(['message' => $message], 429, $headers)
                        : back()->with('error', $message);
                });
        });

        // PDF rendering is CPU-heavy on shared hosting.
        RateLimiter::for('pdf', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id ?: $request->ip()));
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
