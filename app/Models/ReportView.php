<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ReportView extends Model
{
    protected $fillable = [
        'user_id',
        'report_type',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    /**
     * Report types that support "new report" badges, mapped to their models.
     */
    public const TYPES = [
        'casualties' => Casualty::class,
        'injured' => Injured::class,
        'missing' => Missing::class,
    ];

    /**
     * Mark a report type as seen by the current user.
     */
    public static function markSeen(string $type): void
    {
        if (!Auth::check()) {
            return;
        }

        static::updateOrCreate(
            ['user_id' => Auth::id(), 'report_type' => $type],
            ['last_seen_at' => now()]
        );
    }

    /**
     * Count reports created since the current user last viewed each type.
     * Reports submitted by the user themself are not counted.
     */
    public static function newCountsFor(?int $disasterId): array
    {
        $counts = array_fill_keys(array_keys(self::TYPES), 0);

        if (!$disasterId || !Auth::check()) {
            return $counts;
        }

        $lastSeen = static::where('user_id', Auth::id())
            ->pluck('last_seen_at', 'report_type');

        foreach (self::TYPES as $type => $model) {
            $counts[$type] = $model::where('disaster_id', $disasterId)
                ->where('user_id', '!=', Auth::id())
                ->when($lastSeen[$type] ?? null, fn($q, $seenAt) => $q->where('created_at', '>', $seenAt))
                ->count();
        }

        return $counts;
    }
}
