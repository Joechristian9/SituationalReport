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

        // Get the active or paused typhoon
        $typhoon = Typhoon::whereIn('status', ['active', 'paused'])->latest()->first();

        // Check if there's no typhoon at all
        if (!$typhoon) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'No active typhoon report. Forms are currently disabled.',
                    'hasActiveTyphoon' => false,
                ], 403);
            }

            // For Inertia requests, redirect to dashboard with message
            return redirect()->route('dashboard')->with('error', 'No active typhoon report. Forms are currently disabled.');
        }

        // If typhoon is paused, allow page to load but forms will be disabled
        // The frontend will handle showing disabled state based on typhoon status
        // Only block API requests (form submissions)
        if ($typhoon->status === 'paused' && $request->expectsJson()) {
            return response()->json([
                'message' => 'Typhoon report is currently paused. Forms are temporarily disabled.',
                'hasActiveTyphoon' => false,
                'isPaused' => true,
            ], 403);
        }

        return $next($request);
    }
}
