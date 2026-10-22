<?php

use App\Models\WeatherReport;
use Spatie\Permission\Models\Permission;

beforeEach(fn () => Permission::findOrCreate('access-weather-form'));

function ilaganWeather(string $municipality = 'Tumauini'): array
{
    return ['reports' => [[
        'municipality' => $municipality, 'sky_condition' => 'Partly Cloudy',
        'wind' => 'Light breeze', 'precipitation' => 'No rainfall', 'sea_condition' => null,
    ]]];
}

it('saves weather for Ilagan whatever location is sent', function () {
    $disaster = activeStorm();

    $this->actingAs(userWithPermissions('access-weather-form'))
        ->postJson(route('weather-reports.store'), ilaganWeather('Tumauini'))
        ->assertOk();

    expect(WeatherReport::sole())
        ->municipality->toBe('City of Ilagan')
        ->sky_condition->toBe('Partly Cloudy')
        ->disaster_id->toBe($disaster->id);
});

it('lets an admin save weather without the form permission', function () {
    activeStorm();

    $this->actingAs(userWithRole('admin'))
        ->postJson(route('weather-reports.store'), ilaganWeather())
        ->assertOk();

    expect(WeatherReport::count())->toBe(1);
});

it('stops an account without the weather permission', function () {
    activeStorm();

    $this->actingAs(userWithPermissions('access-communication-form'))
        ->postJson(route('weather-reports.store'), ilaganWeather())
        ->assertForbidden();

    expect(WeatherReport::count())->toBe(0);
});

it('saves nothing when no disaster is active', function () {
    $this->actingAs(userWithPermissions('access-weather-form'))
        ->postJson(route('weather-reports.store'), ilaganWeather());

    expect(WeatherReport::count())->toBe(0);
});

it('takes the weather form away from barangay accounts only', function () {
    $barangay = barangayWithPermissions('Alibagu', 'access-weather-form', 'access-road-form');
    $cdrrmo = userWithPermissions('access-weather-form');

    (require database_path('migrations/2026_10_22_000000_revoke_weather_form_from_barangay_accounts.php'))->up();

    expect($barangay->fresh()->hasPermissionTo('access-weather-form'))->toBeFalse()
        ->and($barangay->fresh()->hasPermissionTo('access-road-form'))->toBeTrue()
        ->and($cdrrmo->fresh()->hasPermissionTo('access-weather-form'))->toBeTrue();
});
