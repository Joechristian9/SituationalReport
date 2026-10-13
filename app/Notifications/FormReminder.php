<?php

namespace App\Notifications;

use App\Models\Typhoon;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

/**
 * An admin's reminder that an account still has forms to submit for a disaster.
 * Stored in the database only; the account reads it from the bell in the app header.
 */
class FormReminder extends Notification
{
    /** An account is not reminded again about the same disaster within this many minutes. */
    public const COOLDOWN_MINUTES = 60;

    /**
     * @param  array<int, string>  $tables  report tables still to submit when it was sent
     */
    public function __construct(
        private readonly Typhoon $disaster,
        private readonly array $tables,
        private readonly string $sentBy,
        private readonly ?string $note = null,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'disaster_id' => $this->disaster->id,
            'disaster_name' => $this->disaster->name,
            'tables' => $this->tables,
            'note' => $this->note,
            'sent_by' => $this->sentBy,
        ];
    }

    /**
     * How every stored reminder about this disaster begins: toArray() puts the disaster id
     * first, so a LIKE on this prefix finds them without decoding the JSON.
     */
    public static function dataPrefix(Typhoon $disaster): string
    {
        return '{"disaster_id":'.$disaster->id.',';
    }

    /**
     * When each account was last reminded about the disaster. One grouped query: the
     * disaster id is the first key of the stored data, so a prefix match finds its reminders.
     *
     * @return array<int, CarbonInterface> account id => time of its latest reminder
     */
    public static function lastSentByUser(Typhoon $disaster): array
    {
        return DatabaseNotification::query()
            ->where('type', self::class)
            ->where('notifiable_type', (new User)->getMorphClass())
            ->where('data', 'like', self::dataPrefix($disaster).'%')
            ->selectRaw('notifiable_id, max(created_at) as sent_at')
            ->groupBy('notifiable_id')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->notifiable_id => Carbon::parse($row->sent_at)])
            ->all();
    }
}
