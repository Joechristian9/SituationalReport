<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class PreEmptiveReport extends Model
{
    use HasFactory, LogsModification;

    /**
     * Fields to track modifications for
     */
    protected $trackedFields = [
        'barangay',
        'evacuation_center',
        'families',
        'persons',
        'outside_center',
        'outside_families',
        'outside_persons',
    ];

    protected $fillable = [
        'barangay',
        'evacuation_center',
        'families',
        'persons',
        'outside_center',
        'outside_families',
        'outside_persons',
        'total_families',
        'total_persons',
        'user_id',
        'updated_by',
        'disaster_id',
    ];

    /**
     * Each pre-emptive report belongs to a user (creator).
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    /**
     * User who last updated the report.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    /**
     * Each pre-emptive report belongs to a typhoon.
     */
    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class, 'disaster_id');
    }

    /**
     * A barangay's rows: the ones its accounts entered, and the ones a city office entered under
     * its name (so it doesn't enter them again and double the totals).
     */
    public function scopeOfBarangay(Builder $query, User $user, string $access = 'read'): void
    {
        $query->where(fn (Builder $rows) => $rows->whereIn('user_id', $user->getAccessibleUserIds($access))->orWhere('barangay', $user->name));
    }

    /**
     * Boot method to automatically handle user_id and updated_by.
     */
    protected static function boot()
    {
        parent::boot();

        // When creating, set user_id and updated_by
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->user_id = $model->user_id ?? Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        // When updating, always update updated_by
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
