<?php

namespace App\Traits;

use App\Http\Middleware\NoteSkippedRows;
use App\Models\Typhoon;
use Closure;
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

        if ($record && $this->canWriteRecord($record)) {
            return $record;
        }

        $this->noteSkippedRow($id);

        return null;
    }

    /**
     * Abort with 403 unless the current user is an admin or holds this form's permission.
     * checkPermissionTo, not hasPermissionTo: the latter throws (a 500) when the permission row is missing.
     */
    protected function authorizeForm(string $permission): void
    {
        $user = Auth::user();

        abort_unless($user->isAdmin() || $user->checkPermissionTo($permission), 403, 'Unauthorized access to this form');
    }

    /**
     * Count a row a bulk save left out, for NoteSkippedRows to tell the person.
     *
     * Forms on useRowEditor send every row on screen and flag the edited ones (`_editCheck`,
     * `_changed`), so a view-only row left alone lost nothing and isn't mentioned.
     */
    protected function noteSkippedRow(mixed $id): void
    {
        $request = request();
        $key = $request->input('_editCheck');

        if (is_string($key) && $key !== '') {
            $row = collect($request->input($key))->first(fn ($row) => is_array($row) && (string) ($row['id'] ?? '') === (string) $id);

            if (empty($row['_changed'])) {
                return;
            }
        }

        $request->attributes->set(NoteSkippedRows::ATTRIBUTE, $request->attributes->get(NoteSkippedRows::ATTRIBUTE, 0) + 1);
    }

    protected function canWriteRecord(Model $record): bool
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return true;
        }

        $writableUserIds = $this->rememberForRequest('writable-user-ids', fn () => array_map('intval', $user->getAccessibleUserIds('write')));
        if (! in_array((int) $record->user_id, $writableUserIds, true)) {
            return false;
        }

        $activeDisaster = $this->rememberForRequest('active-disaster', fn () => Typhoon::getActiveTyphoon());

        return $activeDisaster && (int) $record->disaster_id === $activeDisaster->id;
    }

    /**
     * Bulk saves ask this for every row. Kept on the request, not the controller: a controller
     * instance can outlive a request, and each request is new. Keyed by account as a second guard.
     */
    private function rememberForRequest(string $key, Closure $load): mixed
    {
        $attributes = request()->attributes;
        $key = "record-writes.{$key}.".Auth::id();

        if (! $attributes->has($key)) {
            $attributes->set($key, $load());
        }

        return $attributes->get($key);
    }
}
