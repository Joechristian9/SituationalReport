<?php

namespace App\Http\Middleware;

use App\Models\Typhoon;
use App\Services\Barangays;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Routes rendering SituationReports/Index or IncidentMonitored/Index, the pages with barangay
     * dropdowns. A new route rendering either page must be added here (ReportBarangayTest checks two).
     */
    private const FORM_PAGES = [
        'situation-reports.index', 'incident-monitored.index', 'casualties.index', 'injured.index',
        'missing.index', 'damaged-houses.index', 'affected-tourists.index',
    ];

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * The signed-in user as the browser sees it. Inertia prints shared props into every page's
     * HTML, so send only what the UI reads, never the whole model with its pivot rows.
     *
     * @return array<string, mixed>|null
     */
    private function sharedUser(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $user->loadMissing('roles:id,name', 'permissions:id,name');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            // The profile form checks this to decide whether to show the verify-email notice.
            'email_verified_at' => $user->email_verified_at,
            'roles' => $user->roles->map(fn ($role) => ['name' => $role->name])->values(),
            'permissions' => $user->permissions->map(fn ($permission) => ['name' => $permission->name])->values(),
        ];
    }

    /**
     * Define the props that are shared by default.
     * Optimized: Eager load roles for better performance
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->sharedUser($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // The report forms' barangay lists, only on the pages that host those forms.
            'barangays' => fn () => $request->user() && $request->routeIs(self::FORM_PAGES) ? Barangays::names() : [],
            'typhoon' => [
                'active' => fn () => Typhoon::with('creator:id,name')->whereIn('status', ['active', 'paused'])->latest()->first(),
                'hasActive' => fn () => Typhoon::hasActiveTyphoon(),
            ],
        ];
    }
}
