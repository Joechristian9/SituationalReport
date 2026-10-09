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
        abort_unless($this->canWriteRecord($record), 403);
    }

    /**
     * The record behind an id sent in a bulk save, or null when the user may not change it.
     *
     * Bulk saves take row ids from the request, so a plain find() would let a user
     * overwrite another account's rows or rows of an ended disaster.
     *
     * @param  class-string<Model>  $modelClass
     */
    protected function findWritableRecord(string $modelClass, mixed $id): ?Model
    {
        $record = $modelClass::find($id);

        return $record && $this->canWriteRecord($record) ? $record : null;
    }

    protected function canWriteRecord(Model $record): bool
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return true;
        }

        $writableUserIds = array_map('intval', $user->getAccessibleUserIds('write'));
        if (! in_array((int) $record->user_id, $writableUserIds, true)) {
            return false;
        }

        $activeDisaster = Typhoon::getActiveTyphoon();

        return $activeDisaster && (int) $record->disaster_id === $activeDisaster->id;
    }
}
