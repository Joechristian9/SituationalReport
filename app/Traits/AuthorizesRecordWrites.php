<?php

namespace App\Traits;

use App\Models\Typhoon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait AuthorizesRecordWrites
{
    /**
     * Abort with 403 unless the current user may change this report record.
     *
     * Route-model binding resolves any id, so without this check one barangay
     * could edit another's records, or records of a disaster that has ended.
     */
    protected function authorizeRecordWrite(Model $record): void
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return;
        }

        $writableUserIds = array_map('intval', $user->getAccessibleUserIds('write'));
        abort_unless(in_array((int) $record->user_id, $writableUserIds, true), 403);

        $activeDisaster = Typhoon::getActiveTyphoon();
        abort_unless($activeDisaster && (int) $record->disaster_id === $activeDisaster->id, 403);
    }
}
