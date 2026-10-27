<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use App\Notifications\FormReminder;
use App\Services\PendingForms;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * The bell in the app header of report accounts: why forms are closed (no disaster, or
 * paused) and the admin's reminders to submit forms for the current disaster.
 */
class NotificationController extends Controller
{
    /** Reminders listed in the bell. */
    private const LIMIT = 10;

    /**
     * The notice and the latest reminders about the current disaster (active or paused),
     * each showing only the forms still missing now. Once everything is submitted, or the
     * disaster has ended, its reminders drop out.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $disaster = Typhoon::getActiveTyphoon();

        // No current disaster: nothing to remind about, so the reminders are not even read.
        $reminders = $disaster === null ? collect() : $user->notifications()
            ->where('type', FormReminder::class)
            ->where('data', 'like', FormReminder::dataPrefix($disaster).'%')
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'data', 'created_at', 'read_at']);

        $missing = $reminders->isEmpty() ? [] : PendingForms::missing($user->getPermissionNames()->all(), PendingForms::submittedBy($user, $disaster), $disaster->disaster_type);
        $forms = array_map([PendingForms::class, 'label'], $missing);

        $items = $missing === [] ? collect() : $reminders->map(fn ($reminder) => [
            'id' => $reminder->id,
            'disaster' => $reminder->data['disaster_name'],
            'forms' => $forms,
            'note' => $reminder->data['note'] ?? null,
            'sent_by' => $reminder->data['sent_by'] ?? null,
            'sent_at' => $reminder->created_at->toIso8601String(),
            'read' => $reminder->read_at !== null,
        ]);

        return response()->json([
            'notice' => $this->notice($disaster),
            'unread' => $items->where('read', false)->count(),
            'items' => $items->values(),
        ]);
    }

    /** Mark every reminder read (the bell was opened). */
    public function markRead(): JsonResponse
    {
        Auth::user()->unreadNotifications()->where('type', FormReminder::class)->update(['read_at' => now()]);

        return response()->json(['unread' => 0]);
    }

    /**
     * Why forms are closed right now, or null while a disaster is active.
     *
     * @return array{kind: string, disaster_id: int|null, disaster: string|null, title: string, message: string}|null
     */
    private function notice(?Typhoon $disaster): ?array
    {
        if ($disaster?->status === 'active') {
            return null;
        }

        return $disaster === null
            ? [
                'kind' => 'none',
                'disaster_id' => null,
                'disaster' => null,
                'title' => 'No active disaster',
                'message' => 'Forms are closed until an administrator starts a disaster report. You can still view your report history.',
            ]
            : [
                'kind' => 'paused',
                'disaster_id' => $disaster->id,
                'disaster' => $disaster->name,
                'title' => "{$disaster->name} is paused",
                'message' => 'Forms are closed until an administrator resumes the report. You can still view your report history.',
            ];
    }
}
