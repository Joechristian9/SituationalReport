<?php

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
