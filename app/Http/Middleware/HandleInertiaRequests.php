<?php

namespace App\Http\Middleware;

use App\Models\Typhoon;
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
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
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
                'user' => $request->user() ? $request->user()->load('roles:id,name', 'permissions:id,name') : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'typhoon' => [
                'active' => fn() => Typhoon::with('creator:id,name')->whereIn('status', ['active', 'paused'])->latest()->first(),
                'hasActive' => fn() => Typhoon::hasActiveTyphoon(),
            ],
        ];
    }
}
