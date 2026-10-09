<?php

namespace App\Http\Middleware;

use App\Models\Typhoon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDisasterStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
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
        if (! $typhoon) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'No active disaster report. Forms are currently disabled.',
                    'hasActiveTyphoon' => false,
                ], 403);
            }

            // For Inertia requests, send users to their home page with the message
            return redirect()->route($request->user()->homeRoute())->with('error', 'No active disaster report. Forms are currently disabled.');
        }

        // A paused disaster still lets pages load (the forms show as disabled), but nothing
        // may be saved. Inertia form posts don't ask for JSON, so writes are blocked by
        // method rather than by expectsJson().
        if ($typhoon->status === 'paused' && ($request->expectsJson() || ! $request->isMethodSafe())) {
            $message = 'Typhoon report is currently paused. Forms are temporarily disabled.';

            if (! $request->expectsJson()) {
                return back()->with('error', $message);
            }

            return response()->json([
                'message' => $message,
                'hasActiveTyphoon' => false,
                'isPaused' => true,
            ], 403);
        }

        return $next($request);
    }
}
