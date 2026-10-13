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

    $groups = $this->actingAs($user)->getJson(route($route))->assertOk()->json('data');

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

    $this->actingAs($user)->getJson(route('api.road-history'))->assertOk()->assertJsonPath('data', []);
});

it('pages the disasters, newest first, and only returns the reports of the page', function () {
    $user = userWithRole('user');
    foreach (range(1, 7) as $n) {
        $disaster = historyDisaster("Storm {$n}", "2026-0{$n}-01");
        Road::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'name_of_road' => "Road {$n}"]);
    }

    $first = $this->actingAs($user)->getJson(route('api.road-history'))->assertOk();
    expect(array_column(array_column($first->json('data'), 'typhoon'), 'name'))->toBe(['Storm 7', 'Storm 6', 'Storm 5', 'Storm 4', 'Storm 3'])
        ->and($first->json('meta'))->toBe(['current_page' => 1, 'last_page' => 2, 'per_page' => 5, 'total' => 7]);

    $second = $this->actingAs($user)->getJson(route('api.road-history', ['page' => 2]))->assertOk();
    expect(array_column(array_column($second->json('data'), 'typhoon'), 'name'))->toBe(['Storm 2', 'Storm 1'])
        ->and($second->json('data.0.reports'))->toHaveCount(1);

    $wide = $this->actingAs($user)->getJson(route('api.road-history', ['per_page' => 10]))->assertOk();
    expect($wide->json('data'))->toHaveCount(7)->and($wide->json('meta.per_page'))->toBe(10);

    $odd = $this->actingAs($user)->getJson(route('api.road-history', ['per_page' => 9999]))->assertOk();
    expect($odd->json('meta.per_page'))->toBe(5);
});

it('searches the disasters by name or type', function () {
    $user = userWithRole('user');
    $storm = historyDisaster('Tropical Storm Aghon', '2026-06-01');
    $quake = Typhoon::create(['name' => 'Big Shake', 'disaster_type' => 'Earthquake', 'status' => 'ended', 'started_at' => '2026-05-01', 'created_by' => $user->id]);
    foreach ([$storm, $quake] as $disaster) {
        Road::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'name_of_road' => 'Road']);
    }

    $byName = $this->actingAs($user)->getJson(route('api.road-history', ['search' => 'aghon']))->assertOk();
    $byType = $this->actingAs($user)->getJson(route('api.road-history', ['search' => 'earthquake']))->assertOk();

    expect(array_column(array_column($byName->json('data'), 'typhoon'), 'name'))->toBe(['Tropical Storm Aghon'])
        ->and($byName->json('meta.total'))->toBe(1)
        ->and(array_column(array_column($byType->json('data'), 'typhoon'), 'name'))->toBe(['Big Shake']);
});

it('does not list a disaster that only has reports from accounts the user may not read', function () {
    $user = userWithRole('user');
    $disaster = historyDisaster('Storm', '2026-06-01');
    Road::create(['disaster_id' => $disaster->id, 'user_id' => userWithRole('user')->id, 'name_of_road' => 'Hidden']);

    $this->actingAs($user)->getJson(route('api.road-history'))->assertOk()->assertJsonPath('meta.total', 0);
});
