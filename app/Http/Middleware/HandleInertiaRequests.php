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
     * Routes rendering SituationReports/Index, the page with barangay dropdowns. A new route
     * rendering it must be added here (ReportBarangayTest checks it).
     */
    private const FORM_PAGES = ['situation-reports.index'];

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /** The signed-in user as the browser sees it (see User::forPage()). */
    private function sharedUser(Request $request): ?array
    {
        return $request->user()?->forPage();
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
            'typhoon' => fn () => Typhoon::forPage(),
        ];
    }
}
