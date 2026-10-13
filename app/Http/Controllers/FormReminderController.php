<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use App\Models\User;
use App\Notifications\FormReminder;
use App\Services\AuditLogger;
use App\Services\PendingForms;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Admin action on the Form Submission Status page: remind accounts that still
 * have forms to submit for the active disaster.
 */
class FormReminderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => ['nullable', 'array', 'max:500'],
            'user_ids.*' => ['integer', 'distinct'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);

        $disaster = Typhoon::getActiveTyphoon();
        if (! $disaster) {
            return response()->json(['message' => 'There is no active disaster to remind accounts about.', 'error' => 'NO_ACTIVE_TYPHOON'], 422);
        }
        if ($disaster->status !== 'active') {
            return response()->json(['message' => 'This disaster is paused, so forms are closed. Resume it before sending reminders.', 'error' => 'TYPHOON_PAUSED'], 422);
        }

        // Without a list, every account that has something to submit.
        $accounts = User::query()
            ->select('id', 'name')
            ->with('permissions:id,name')
            ->whereHas('roles', fn ($query) => $query->where('name', 'user'))
            ->when(isset($validated['user_ids']), fn ($query) => $query->whereIn('id', $validated['user_ids']))
            ->get();

        $missing = PendingForms::missingForUsers($accounts, $disaster);
        $recent = FormReminder::lastSentByUser($disaster);
        $cooldown = now()->subMinutes(FormReminder::COOLDOWN_MINUTES);
        $note = isset($validated['note']) && trim($validated['note']) !== '' ? trim($validated['note']) : null;

        $notified = 0;
        $skippedRecent = 0;
        foreach ($accounts as $account) {
            if ($missing[$account->id] === []) {
                continue;
            }
            if (isset($recent[$account->id]) && $recent[$account->id]->greaterThan($cooldown)) {
                $skippedRecent++;

                continue;
            }
            $account->notify(new FormReminder($disaster, $missing[$account->id], Auth::user()->name, $note));
            $notified++;
        }

        if ($notified > 0) {
            AuditLogger::logReminder($disaster->id, "Reminded {$notified} ".($notified === 1 ? 'account' : 'accounts')." to submit their reports for {$disaster->name}");
        }

        return response()->json(['notified' => $notified, 'skipped_recent' => $skippedRecent]);
    }
}
