<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A bulk save leaves out rows the account can't edit, and the rest still save. The person must
 * hear about those rows, but the status stays a success: a 4xx or 5xx would mark the whole
 * save failed, or make a queued one retry forever. Saves with nothing skipped pass untouched.
 */
class NoteSkippedRows
{
    /** Request attribute holding the count; see AuthorizesRecordWrites::noteSkippedRow(). */
    public const ATTRIBUTE = 'record-writes.skipped-rows';

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $skipped = (int) $request->attributes->get(self::ATTRIBUTE, 0);

        if ($skipped === 0 || ! ($response->isSuccessful() || $response->isRedirection())) {
            return $response;
        }

        $message = $skipped === 1
            ? "Saved. 1 row wasn't saved because you can't edit it."
            : "Saved. {$skipped} rows weren't saved because you can't edit them.";

        if ($response instanceof JsonResponse) {
            $response->setData(['message' => $message, 'skipped_rows' => $skipped] + $response->getData(true));
        } elseif ($request->hasSession()) {
            $request->session()->flash('success', $message);
        }

        return $response;
    }
}
