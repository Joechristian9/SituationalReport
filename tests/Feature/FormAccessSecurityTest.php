<?php

use App\Models\Casualty;
use App\Models\Injured;
use App\Models\SuspensionOfClass;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WaterService;
use App\Models\WeatherReport;

function stormWithStatus(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Storm '.uniqid(), 'status' => $status, 'created_by' => User::factory()->create()->id]);
}

function casualtyPayload(): array
{
    return ['casualties' => [['name' => 'Juan Dela Cruz', 'cause_of_death' => 'Drowning']]];
}

function weatherPayload(int $id, string $sky): array
{
    return ['reports' => [[
        'id' => $id, 'municipality' => 'Ilagan', 'sky_condition' => $sky,
        'wind' => null, 'precipitation' => null, 'sea_condition' => null,
    ]]];
}

/* ---------------- Paused disaster ---------------- */

it('does not save an Inertia form post while the disaster is paused', function () {
    stormWithStatus('paused');

    $this->actingAs(userWithPermissions('access-injured-form'))
        ->from(route('situation-reports.index'))
        ->post(route('injured.store'), ['injured' => [['name' => 'X', 'diagnosis' => 'Y']]], ['X-Inertia' => 'true'])
        ->assertRedirect(route('situation-reports.index'))
        ->assertSessionHas('error');

    expect(Injured::count())->toBe(0);
});

it('still lets an admin save while the disaster is paused', function () {
    stormWithStatus('paused');

    $this->actingAs(userWithRole('admin'))
        ->post(route('injured.store'), ['injured' => [['name' => 'X', 'diagnosis' => 'Y']]], ['X-Inertia' => 'true'])
        ->assertRedirect();

    expect(Injured::count())->toBe(1);
});

/* ---------------- Form permissions ---------------- */

it('refuses report forms to an account without their permission', function (string $route) {
    stormWithStatus();

    $this->actingAs(userWithRole('user'))->postJson(route($route), [])->assertForbidden();
})->with([
    'casualties.store', 'injured.store', 'missing.store', 'affected-tourists-reports.store',
    'damaged-houses-reports.store', 'incident-monitored.store', 'suspension-classes-reports.store',
    'suspension-work-reports.store', 'declaration-usc.store', 'pre-positioning.store',
    'response-operations-reports.store', 'assistance-extendeds.store', 'assistance-provided-lgus.store',
]);

it('does not save casualties for an account without the permission', function () {
    stormWithStatus();

    $this->actingAs(userWithRole('user'))->postJson(route('casualties.store'), casualtyPayload())->assertForbidden();

    expect(Casualty::count())->toBe(0);
});

it('saves casualties for the casualty, incident and admin accounts', function (User $account) {
    stormWithStatus();

    $this->actingAs($account)->postJson(route('casualties.store'), casualtyPayload())->assertOk();

    expect(Casualty::count())->toBe(1);
})->with([
    'casualty form' => fn () => userWithPermissions('access-casualty-form'),
    'incidents page' => fn () => userWithPermissions('access-incident-form'),
    'admin' => fn () => userWithRole('admin'),
]);

it('refuses casualties when no disaster is active', function () {
    $this->actingAs(userWithPermissions('access-casualty-form'))
        ->postJson(route('casualties.store'), casualtyPayload())
        ->assertForbidden();

    expect(Casualty::count())->toBe(0);
});

/* ---------------- Bulk saves only change writable rows ---------------- */

it('stops an account overwriting another account\'s suspension row', function () {
    $disaster = stormWithStatus();
    $owner = userWithPermissions('access-incident-form');
    $record = SuspensionOfClass::create(['province_city_municipality' => 'Owner', 'user_id' => $owner->id, 'disaster_id' => $disaster->id]);

    $this->actingAs(userWithPermissions('access-incident-form'))->postJson(route('suspension-classes-reports.store'), [
        'suspension_of_classes' => [['id' => $record->id, 'province_city_municipality' => 'Tampered']],
    ]);

    expect($record->fresh()->province_city_municipality)->toBe('Owner');
});

it('saves suspension rows under the active disaster and lets the owner edit them', function () {
    $disaster = stormWithStatus();
    $owner = userWithPermissions('access-incident-form');

    $this->actingAs($owner)->postJson(route('suspension-classes-reports.store'), [
        'suspension_of_classes' => [['id' => null, 'province_city_municipality' => 'Ilagan']],
    ]);
    $record = SuspensionOfClass::sole();

    $this->actingAs($owner)->postJson(route('suspension-classes-reports.store'), [
        'suspension_of_classes' => [['id' => $record->id, 'province_city_municipality' => 'Ilagan City']],
    ]);

    expect($record->fresh())->disaster_id->toBe($disaster->id)->province_city_municipality->toBe('Ilagan City');
});

it('stops an account editing another account\'s weather row', function () {
    $disaster = stormWithStatus();
    $record = WeatherReport::create(['municipality' => 'Ilagan', 'sky_condition' => 'Cloudy', 'user_id' => userWithRole('user')->id, 'disaster_id' => $disaster->id]);

    $this->actingAs(userWithPermissions('access-weather-form'))
        ->postJson(route('weather-reports.store'), weatherPayload($record->id, 'Tampered'));

    expect($record->fresh()->sky_condition)->toBe('Cloudy');
});

it('stops an account editing its own weather row from an ended disaster', function () {
    $owner = userWithPermissions('access-weather-form');
    $old = stormWithStatus('ended');
    stormWithStatus();
    $record = WeatherReport::create(['municipality' => 'Ilagan', 'sky_condition' => 'Cloudy', 'user_id' => $owner->id, 'disaster_id' => $old->id]);

    $this->actingAs($owner)->postJson(route('weather-reports.store'), weatherPayload($record->id, 'Rewritten'));

    expect($record->fresh()->sky_condition)->toBe('Cloudy');
});

it('lets an account edit its own weather row in the active disaster', function () {
    $owner = userWithPermissions('access-weather-form');
    $record = WeatherReport::create(['municipality' => 'Ilagan', 'sky_condition' => 'Cloudy', 'user_id' => $owner->id, 'disaster_id' => stormWithStatus()->id]);

    $this->actingAs($owner)->postJson(route('weather-reports.store'), weatherPayload($record->id, 'Sunny'))->assertSuccessful();

    expect($record->fresh()->sky_condition)->toBe('Sunny');
});

it('keeps an ended disaster\'s water service row out of the shared water list', function () {
    $old = stormWithStatus('ended');
    stormWithStatus();
    $record = WaterService::create(['disaster_id' => $old->id, 'user_id' => userWithRole('user')->id, 'status' => 'Operational']);

    $this->actingAs(userWithPermissions('access-water-service-form'))->postJson(route('water-service-reports.store'), [
        'waterServices' => [['id' => $record->id, 'status' => 'Rewritten']],
    ]);

    expect($record->fresh())->status->toBe('Operational')->disaster_id->toBe($old->id);
});

/* ---------------- Rate limits ---------------- */

it('limits report saves per account but not page reads', function () {
    stormWithStatus();
    $user = userWithPermissions('access-casualty-form');

    for ($i = 0; $i < 60; $i++) {
        $this->actingAs($user)->postJson(route('casualties.store'), [])->assertUnprocessable();
    }

    $this->actingAs($user)->postJson(route('casualties.store'), casualtyPayload())->assertTooManyRequests();
    $this->actingAs($user)->getJson(route('modifications.casualties'))->assertOk();
    expect(Casualty::count())->toBe(0);
});

it('limits login attempts from one address across many emails', function () {
    for ($i = 0; $i < 30; $i++) {
        $this->post(route('login'), ['email' => "nobody{$i}@example.com", 'password' => 'wrong']);
    }

    $this->post(route('login'), ['email' => 'another@example.com', 'password' => 'wrong'])
        ->assertSessionHasErrors(['email' => trans('auth.throttle', ['seconds' => 60, 'minutes' => 1])]);
});

it('limits guesses of the current password', function () {
    $user = userWithRole('user');

    for ($i = 0; $i < 6; $i++) {
        $this->actingAs($user)->post(route('password.confirm'), ['password' => 'wrong']);
    }

    $this->actingAs($user)->post(route('password.confirm'), ['password' => 'wrong'])->assertTooManyRequests();
});

it('limits PDF requests per account', function () {
    $user = userWithRole('user');

    for ($i = 0; $i < 10; $i++) {
        $this->actingAs($user)->get(route('api.electricity-history.pdf', 999999));
    }

    $this->actingAs($user)->get(route('api.electricity-history.pdf', 999999))->assertTooManyRequests();
});
