<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * Optimized: Eager load roles to prevent additional database queries
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();

        // Eager load roles to prevent N+1 query on isAdmin() check
        $user = Auth::user()->load('roles:id,name');

        $request->session()->regenerate();

        // Log successful login
        AuditLogger::logLogin("User {$user->name} logged in successfully");

        // The app logging in by itself in the background: a redirect would look like success
        // even when it led back to the login page, so it gets the account instead.
        if ($request->expectsJson()) {
            return response()->json(['user' => $user->forPage(), 'home' => route($user->homeRoute(), [], false)]);
        }

        return redirect()->intended(route($user->homeRoute(), [], false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse|HttpResponse
    {
        // Log logout before destroying session
        $user = Auth::user();
        if ($user) {
            AuditLogger::logLogout("User {$user->name} logged out");
        }

        // This device only. logout() would replace the account's "Remember me" token, which
        // silently stops the account's other phones from signing back in by themselves.
        Auth::guard('web')->logoutCurrentDevice();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return redirect('/');
    }
}
