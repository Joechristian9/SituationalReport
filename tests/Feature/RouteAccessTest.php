<?php

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

function routeAccessDisaster(): Typhoon
{
    return Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => User::factory()->create()->id]);
}

it('lets only admins create a disaster', function () {
    $payload = ['name' => 'New Storm', 'disaster_type' => 'Typhoon', 'description' => 'Test'];

    $this->actingAs(userWithRole('user'))->postJson(route('disasters.store'), $payload)->assertForbidden();
    expect(Typhoon::count())->toBe(0);

    $this->actingAs(userWithRole('admin'))->postJson(route('disasters.store'), $payload)->assertSuccessful();
    expect(Typhoon::sole()->name)->toBe('New Storm');
});

it('lets only admins edit a disaster', function () {
    $disaster = routeAccessDisaster();
    $payload = ['name' => 'Renamed', 'disaster_type' => 'Typhoon', 'description' => 'Test'];

    $this->actingAs(userWithRole('user'))->patchJson(route('disasters.update', $disaster), $payload)->assertForbidden();
    expect($disaster->fresh()->name)->toBe('Storm');

    $this->actingAs(userWithRole('admin'))->patchJson(route('disasters.update', $disaster), $payload)->assertSuccessful();
    expect($disaster->fresh()->name)->toBe('Renamed');
});

it('lets only holders of the form save it', function (string $route, string $permission, string $table, array $payload) {
    routeAccessDisaster();
    Permission::findOrCreate($permission);

    $this->actingAs(userWithPermissions('access-road-form'))->postJson(route($route), $payload)->assertForbidden();
    expect(DB::table($table)->count())->toBe(0);

    $this->actingAs(userWithPermissions($permission))->postJson(route($route), $payload)->assertSuccessful();
    expect(DB::table($table)->count())->toBe(1);
})->with([
    'water levels' => ['water-level-reports.store', 'access-water-level-form', 'water_levels', ['reports' => [
        ['gauging_station' => 'Ilagan', 'current_level' => null, 'alarm_level' => null, 'critical_level' => null, 'affected_areas' => null],
    ]]],
    'damaged houses' => ['damaged-houses.store', 'access-damaged-houses-form', 'damaged_house_reports', ['damaged_houses' => [['barangay' => null, 'partially' => 1]]]],
    'affected tourists' => ['affected-tourists.store', 'access-tourist-form', 'affected_tourists', ['affected_tourists' => [['location' => 'Falls']]]],
]);

it('gives the report download to accounts with a role, not to others', function () {
    $this->actingAs(User::factory()->create())->get(route('reports.download'))->assertForbidden();

    $this->actingAs(userWithRole('user'))->get(route('reports.download'))->assertOk();
});

it('keeps each edit history to its form and to admins', function (string $route, string $permission) {
    routeAccessDisaster();
    Permission::findOrCreate($permission);

    $this->actingAs(userWithPermissions($permission === 'access-road-form' ? 'access-bridge-form' : 'access-road-form'))->getJson(route($route))->assertForbidden();
    $this->actingAs(User::factory()->create())->getJson(route($route))->assertForbidden();
    $this->actingAs(userWithPermissions($permission))->getJson(route($route))->assertOk();
    // The agriculture routes take the permission alone: admins hold it like any account.
    if ($route !== 'modifications.agriculture') {
        $this->actingAs(userWithRole('admin'))->getJson(route($route))->assertOk();
    }
})->with([
    'weather' => ['modifications.weather', 'access-weather-form'],
    'water level' => ['modifications.water-level', 'access-water-level-form'],
    'electricity' => ['modifications.electricity', 'access-electricity-form'],
    'water service' => ['modifications.water-service', 'access-water-service-form'],
    'communication' => ['modifications.communication', 'access-communication-form'],
    'road' => ['modifications.road', 'access-road-form'],
    'bridge' => ['modifications.bridge', 'access-bridge-form'],
    'pre-emptive' => ['modifications.pre-emptive', 'access-pre-emptive-form'],
    'declaration' => ['modifications.usc-declaration', 'access-declaration-form'],
    'response operations' => ['modifications.response-operations', 'access-response-operations'],
    'pre-positioning' => ['modifications.pre-positioning', 'access-pre-positioning-form'],
    'incidents' => ['modifications.incident-monitored', 'access-incident-form'],
    'class suspensions' => ['modifications.suspension-classes', 'access-suspension-classes-form'],
    'work suspensions' => ['modifications.suspension-work', 'access-suspension-work-form'],
    'agriculture' => ['modifications.agriculture', 'access-agriculture-form'],
    'casualties' => ['modifications.casualties', 'access-casualty-form'],
    'injured' => ['modifications.injured', 'access-injured-form'],
    'missing' => ['modifications.missing', 'access-missing-form'],
    'tourists' => ['modifications.affected-tourists', 'access-tourist-form'],
    'damaged houses' => ['modifications.damaged-houses', 'access-damaged-houses-form'],
    'assistance' => ['modifications.assistance-extended', 'access-assistance-extended'],
]);
