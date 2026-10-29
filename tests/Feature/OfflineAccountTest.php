<?php

use App\Models\AuditLog;
use App\Models\User;

/** What a prepared phone computes from a typed password (lib/offline/lock.js), to compare. */
function offlineCheckOf(User $user, string $password): bool
{
    $user->refresh();

    return $user->offline_hash !== null
        && hash_equals($user->offline_hash, base64_encode(hash_pbkdf2('sha256', $password, base64_decode($user->offline_salt), User::OFFLINE_ITERATIONS, 32, true)));
}

it('keeps an offline check of a long enough password at sign-in, and none of a short one', function () {
    $long = User::factory()->create(['password' => 'correct-horse-battery']);
    $short = User::factory()->create(['password' => 'password']);

    $this->post('/login', ['email' => $long->email, 'password' => 'correct-horse-battery']);
    $this->post('/logout');
    $this->post('/login', ['email' => $short->email, 'password' => 'password']);

    expect(offlineCheckOf($long, 'correct-horse-battery'))->toBeTrue()
        ->and(offlineCheckOf($long, 'wrong-horse-battery'))->toBeFalse()
        ->and($short->fresh()->offline_hash)->toBeNull();
});

it('never sends the offline check to the browser', function () {
    $user = userWithPermissions('access-road-form');
    $user->rememberOfflinePassword('correct-horse-battery');

    $this->actingAs($user)->get(route('situation-reports.index'))
        ->assertInertia(fn ($page) => $page->where('auth.user.id', $user->id)->missing('auth.user.offline_hash')->missing('auth.user.offline_salt'));
    expect($user->fresh()->toArray())->not->toHaveKeys(['offline_hash', 'offline_salt']);
});

it('gives an admin the checks of the report accounts chosen for a phone, never an admin\'s', function () {
    $admin = userWithRole('admin');
    $admin->rememberOfflinePassword('admin-horse-battery');
    $fugu = userWithPermissions('access-road-form');
    $fugu->rememberOfflinePassword('correct-horse-battery');
    $notYet = userWithPermissions('access-road-form');

    $response = $this->actingAs($admin)->getJson(route('admin.offline-accounts', ['ids' => [$fugu->id, $notYet->id, $admin->id]]))
        ->assertOk()
        ->assertJsonCount(1, 'accounts')
        ->assertJsonPath('accounts.0.user.id', $fugu->id)
        ->assertJsonPath('accounts.0.user.permissions.0.name', 'access-road-form')
        ->assertJsonPath('notReady.0.id', $notYet->id)
        ->assertJsonCount(1, 'notReady');

    expect($response->json('accounts.0.hash'))->toBe($fugu->fresh()->offline_hash)
        ->and(AuditLog::where('action', 'device_prepared')->count())->toBe(1);
});

it('gives the offline checks to admins only', function () {
    $fugu = userWithPermissions('access-road-form');

    $this->actingAs($fugu)->getJson(route('admin.offline-accounts', ['ids' => [$fugu->id]]))->assertForbidden();
});

it('needs new passwords of at least 12 characters', function () {
    $this->actingAs(userWithRole('admin'))
        ->post(route('admin.users.store'), ['name' => 'Rugao', 'email' => 'rugao@barangay.local', 'password' => 'short-pass1', 'role' => 'user'])
        ->assertSessionHasErrors('password');
});
