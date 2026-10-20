<?php

use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Models\WeatherReport;
use Inertia\Testing\AssertableInertia as Assert;

it('sends the environment graphs only when their tab asks, with only the columns they use', function () {
    $admin = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $admin->id]);
    WeatherReport::create(['disaster_id' => $disaster->id, 'user_id' => userWithRole('user')->id, 'municipality' => 'City of Ilagan', 'wind' => 'Calm']);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->missing('weatherReports')
            ->missing('waterLevels')
            ->missing('preEmptiveReports')
            ->has('casualties')
            ->reloadOnly('weatherReports,waterLevels,preEmptiveReports', fn (Assert $reload) => $reload
                ->has('weatherReports', 1)
                ->where('weatherReports.0.municipality', 'City of Ilagan')
                ->missing('weatherReports.0.user')
                ->missing('weatherReports.0.user_id')
                ->has('waterLevels', 0)
                ->has('preEmptiveReports', 0)));
});

it('sums evacuees per barangay for the active disaster only', function () {
    $admin = userWithRole('admin');
    $user = userWithRole('user');
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $admin->id]);
    $old = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $admin->id]);
    $row = fn (int $disasterId, string $barangay, int $persons) => PreEmptiveReport::create([
        'disaster_id' => $disasterId, 'user_id' => $user->id, 'barangay' => $barangay,
        'families' => 1, 'persons' => $persons, 'outside_families' => 0, 'outside_persons' => 0,
        'total_families' => 1, 'total_persons' => $persons,
    ]);
    // Two evacuation centers in one barangay, one in another, and one from an older disaster.
    $row($disaster->id, 'Poblacion', 10);
    $row($disaster->id, 'Poblacion', 5);
    $row($disaster->id, 'Tambo', 7);
    $row($old->id, 'Poblacion', 100);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->reloadOnly('preEmptiveReports', function (Assert $reload) {
                $rows = collect($reload->toArray()['props']['preEmptiveReports'])->keyBy('barangay');
                expect($rows)->toHaveCount(2)
                    ->and($rows['Poblacion'])->toMatchArray(['inside_persons' => 15, 'inside_families' => 2, 'total_persons' => 15])
                    ->and($rows['Tambo']['total_persons'])->toBe(7);
            }));
});
