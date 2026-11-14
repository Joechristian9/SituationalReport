<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A phone remembers the accounts that logged in on it, so they can log in there with no
 * internet. Whenever it gets a connection it asks here whether each one is still current: the
 * password unchanged and the account not removed. It then forgets the ones that are not.
 *
 * Open to a phone with nobody logged in, since a logged-out phone must be able to ask. The
 * answer is the same for a wrong stamp and for an account that doesn't exist, so it tells
 * nothing to someone who doesn't already hold a current stamp.
 */
class OfflineAccountController extends Controller
{
    public function check(Request $request): JsonResponse
    {
        $accounts = $request->validate([
            'accounts' => ['required', 'array', 'min:1', 'max:20'],
            'accounts.*.id' => ['required', 'integer'],
            'accounts.*.stamp' => ['required', 'string', 'size:64'],
        ])['accounts'];

        $users = User::whereIn('id', array_column($accounts, 'id'))->get()->keyBy('id');

        $current = collect($accounts)
            ->filter(fn (array $account) => $users->has($account['id']) && hash_equals($users[$account['id']]->offlineStamp(), $account['stamp']))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        return response()->json(['current' => $current]);
    }
}
