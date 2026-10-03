<?php

namespace App\Http\Middleware;

use App\Models\Typhoon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Report saves that were queued on a device while offline and are being sent later.
 * The client marks them with X-Offline-Key (one per queued save) and
 * X-Offline-Disaster (the disaster active when it was filed). Ordinary saves have
 * neither header and pass straight through.
 */
class HandleOfflineSubmission
{
    private const KEEP_DAYS = 7;

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-Offline-Key');

        if (! $key || ! $request->isMethod('post') || ! $request->user()) {
            return $next($request);
        }

        if (! preg_match('/^[A-Za-z0-9-]{8,64}$/', $key)) {
            return response()->json(['message' => 'Invalid offline submission key.'], 422);
        }

        // Saves are stamped with whichever disaster is active when they arrive, so a
        // report filed under a disaster that has since changed must not be saved.
        $filedFor = (string) $request->header('X-Offline-Disaster', '');
        $active = Typhoon::getActiveTyphoon();
        if ($filedFor !== '' && (! $active || (string) $active->id !== $filedFor)) {
            return response()->json([
                'message' => 'Not saved: the disaster this report was filed for is no longer active.',
                'error' => 'DISASTER_CHANGED',
            ], 409);
        }

        // A retry of a save the server already processed (e.g. the connection dropped
        // before the reply arrived) must not create the rows a second time.
        $doneKey = "offline-submission:{$request->user()->id}:{$key}";
        if (Cache::has($doneKey)) {
            return response()->json(['message' => 'Already saved.', 'replayed' => true]);
        }

        $lock = Cache::lock("{$doneKey}:lock", 30);
        if (! $lock->get()) {
            return response()->json(['message' => 'This report is already being saved. Try again shortly.'], 503);
        }

        try {
            $response = $next($request);

            // Inertia form endpoints answer a successful save with a redirect.
            if ($response->isSuccessful() || $response->isRedirection()) {
                Cache::put($doneKey, true, now()->addDays(self::KEEP_DAYS));
            }

            return $response;
        } finally {
            $lock->release();
        }
    }
}
