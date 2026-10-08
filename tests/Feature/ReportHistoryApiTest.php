<?php

use App\Models\Bridge;
use App\Models\PreEmptiveReport;
use App\Models\Road;
use App\Models\Typhoon;
use App\Models\WeatherReport;

function historyDisaster(string $name, string $startedAt): Typhoon
{
    return Typhoon::create(['name' => $name, 'status' => 'ended', 'started_at' => $startedAt, 'created_by' => userWithRole('admin')->id]);
}

it('returns every history as a list grouped by disaster, newest disaster first', function (string $route, string $model, array $fields) {
    $user = userWithRole('user');
    $older = historyDisaster('Older Storm', '2026-01-01');
    $newer = historyDisaster('Newer Storm', '2026-06-01');
    $model::create(['disaster_id' => $older->id, 'user_id' => $user->id] + $fields);
    $model::create(['disaster_id' => $newer->id, 'user_id' => $user->id] + $fields);

    $groups = $this->actingAs($user)->getJson(route($route))->assertOk()->json();

    expect($groups)->toBeList()->toHaveCount(2)
        ->and(array_column(array_column($groups, 'typhoon'), 'name'))->toBe(['Newer Storm', 'Older Storm']);
    foreach ($fields as $field => $value) {
        expect($groups[0]['reports'][0][$field])->toBe($value);
    }
    expect(array_keys($groups[0]['reports'][0]['user']))->toEqualCanonicalizing(['id', 'name']);
})->with([
    'weather' => ['api.weather-history', WeatherReport::class, ['municipality' => 'City of Ilagan', 'sky_condition' => 'Cloudy']],
    'pre-emptive' => ['api.pre-emptive-history', PreEmptiveReport::class, ['barangay' => 'Rugao', 'families' => 3]],
    'road' => ['api.road-history', Road::class, ['road_classification' => 'National', 'areas_affected' => 'Rugao, Ugac']],
    'bridge' => ['api.bridge-history', Bridge::class, ['road_classification' => 'Provincial', 'areas_affected' => 'Caritan']],
]);

it('only lists road reports from accounts the user may read', function () {
    $user = userWithRole('user');
    $stranger = userWithRole('user');
    $disaster = historyDisaster('Storm', '2026-06-01');
    Road::create(['disaster_id' => $disaster->id, 'user_id' => $stranger->id, 'name_of_road' => 'Hidden road']);

    $this->actingAs($user)->getJson(route('api.road-history'))->assertOk()->assertExactJson([]);
});
