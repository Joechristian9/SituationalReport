<?php

use App\Models\Injured;
use App\Models\Typhoon;
use App\Models\User;

function injuredPayload(): array
{
    return ['injured' => [['id' => null, 'name' => 'Juan Dela Cruz', 'diagnosis' => 'Fractured arm']]];
}

it('saves a queued offline report once, even if it is sent twice', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);
    $headers = ['X-Offline-Key' => 'abc12345-key', 'X-Offline-Disaster' => (string) $disaster->id, 'Accept' => 'application/json'];

    // `saved` is what lets the phone delete its copy (sync.js).
    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload(), $headers)
        ->assertSuccessful()
        ->assertJson(['saved' => true]);
    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload(), $headers)
        ->assertOk()
        ->assertJson(['saved' => true, 'replayed' => true]);

    expect(Injured::count())->toBe(1)
        ->and(Injured::first()->disaster_id)->toBe($disaster->id);
});

it('answers a queued report with JSON where the form would get a redirect, and leaves no message behind', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);
    $headers = ['X-Offline-Key' => 'redirect-key-1', 'X-Offline-Disaster' => (string) $disaster->id];

    // Not asking for JSON: the controller answers back()->with('success', ...).
    $this->actingAs($user)->post(route('injured.store'), injuredPayload(), $headers)
        ->assertOk()
        ->assertExactJson(['saved' => true])
        ->assertSessionMissing('success');

    expect(Injured::count())->toBe(1);
});

it('does not call a refused queued report saved', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);
    $headers = ['X-Offline-Key' => 'invalid-rows-1', 'X-Offline-Disaster' => (string) $disaster->id];

    $this->actingAs($user)->postJson(route('injured.store'), ['injured' => 'not rows'], $headers)
        ->assertStatus(422)
        ->assertJsonMissingPath('saved');
});

it('treats the same key from another user as a separate report', function () {
    $first = userWithPermissions('access-injured-form');
    $second = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $first->id]);
    $headers = ['X-Offline-Key' => 'shared-key-123', 'X-Offline-Disaster' => (string) $disaster->id];

    $this->actingAs($first)->postJson(route('injured.store'), injuredPayload(), $headers)->assertSuccessful();
    $this->actingAs($second)->postJson(route('injured.store'), injuredPayload(), $headers)->assertSuccessful();

    expect(Injured::count())->toBe(2);
});

it('refuses a report filed for a disaster that is no longer the active one', function () {
    $user = userWithPermissions('access-injured-form');
    $old = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $user->id]);
    Typhoon::create(['name' => 'New Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('injured.store'), injuredPayload(), ['X-Offline-Key' => 'late-report-1', 'X-Offline-Disaster' => (string) $old->id])
        ->assertStatus(409)
        ->assertJson(['error' => 'DISASTER_CHANGED']);

    expect(Injured::count())->toBe(0);
});

it('keeps blocking offline reports while there is no active disaster', function () {
    $user = userWithPermissions('access-injured-form');

    $this->actingAs($user)
        ->postJson(route('injured.store'), injuredPayload(), ['X-Offline-Key' => 'no-disaster-1', 'X-Offline-Disaster' => '1'])
        ->assertForbidden();

    expect(Injured::count())->toBe(0);
});

it('asks the device to wait while the disaster is paused', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'paused', 'created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('injured.store'), injuredPayload(), ['X-Offline-Key' => 'paused-key-1', 'X-Offline-Disaster' => (string) $disaster->id])
        ->assertForbidden()
        ->assertJson(['isPaused' => true]);

    expect(Injured::count())->toBe(0);
});

it('rejects offline reports from accounts without a reporting role', function () {
    $user = User::factory()->create();
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('injured.store'), injuredPayload(), ['X-Offline-Key' => 'no-role-key', 'X-Offline-Disaster' => (string) $disaster->id])
        ->assertForbidden();

    expect(Injured::count())->toBe(0);
});

it('refuses a queued report that another account wrote', function () {
    $writer = userWithPermissions('access-injured-form');
    $loggedIn = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $writer->id]);
    $headers = ['X-Offline-Key' => 'shared-phone-1', 'X-Offline-Disaster' => (string) $disaster->id, 'X-Offline-User' => (string) $writer->id];

    $this->actingAs($loggedIn)->postJson(route('injured.store'), injuredPayload(), $headers)
        ->assertStatus(409)->assertJson(['error' => 'WRONG_ACCOUNT']);
    expect(Injured::count())->toBe(0);

    // The writer can still send it later with the same key.
    $this->actingAs($writer)->postJson(route('injured.store'), injuredPayload(), $headers)->assertSuccessful();
    expect(Injured::count())->toBe(1);
});

it('saves a queued report sent by the account that wrote it', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload(), [
        'X-Offline-Key' => 'own-report-01', 'X-Offline-Disaster' => (string) $disaster->id, 'X-Offline-User' => (string) $user->id,
    ])->assertSuccessful();

    expect(Injured::count())->toBe(1);
});

it('leaves ordinary online saves unchanged', function () {
    $user = userWithPermissions('access-injured-form');
    Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload())->assertSuccessful();
    $this->actingAs($user)->postJson(route('injured.store'), injuredPayload())->assertSuccessful();

    expect(Injured::count())->toBe(2);
});
