<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * What an admin downloads to prepare a phone: for the chosen accounts, the offline password
 * check (User::rememberOfflinePassword) and what the app needs to show their forms. With it
 * they can sign in on that phone with no internet, until the preparation expires.
 */
class OfflineAccountController extends Controller
{
    public const VALID_DAYS = 30;

    public function index(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['integer'],
        ])['ids'];

        // Report accounts only: an admin's check on a phone would be the most valuable thing to steal.
        $accounts = User::whereIn('id', $ids)
            ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'admin'))
            ->orderBy('name')
            ->get();
        [$ready, $notReady] = $accounts->partition(fn (User $user) => $user->offline_hash !== null);

        if ($ready->isNotEmpty()) {
            AuditLogger::logDevicePrepared('Prepared a phone for offline sign-in: '.$ready->pluck('name')->join(', '));
        }

        return response()->json([
            'expiresAt' => now()->addDays(self::VALID_DAYS)->toIso8601String(),
            'iterations' => User::OFFLINE_ITERATIONS,
            'accounts' => $ready->map(fn (User $user) => [
                'user' => $user->forPage(),
                'salt' => $user->offline_salt,
                'hash' => $user->offline_hash,
            ])->values(),
            // No check yet: the server hasn't seen a long enough password since this was added.
            'notReady' => $notReady->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->values(),
        ]);
    }
}
