<?php

namespace App\Http\Middleware;

use App\Models\Typhoon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTyphoonStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow admins to bypass this check
        if ($request->user() && $request->user()->hasRole('admin')) {
            return $next($request);
        }

        // Check if there's an active typhoon
        if (!Typhoon::hasActiveTyphoon()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'No active typhoon report. Forms are currently disabled.',
                    'hasActiveTyphoon' => false,
                ], 403);
            }

            // For Inertia requests, redirect to dashboard with message
            return redirect()->route('dashboard')->with('error', 'No active typhoon report. Forms are currently disabled.');
        }

        return $next($request);
    }
}
