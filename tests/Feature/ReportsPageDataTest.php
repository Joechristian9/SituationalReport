<?php

use App\Models\Road;
use App\Models\Typhoon;
use App\Models\WeatherReport;
use Inertia\Testing\AssertableInertia as Assert;

it('sends a field account only the records of the forms it holds', function () {
    $admin = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    $account = userWithPermissions('access-weather-form');
    WeatherReport::create(['disaster_id' => $disaster->id, 'user_id' => $account->id, 'municipality' => 'City of Ilagan']);
    Road::create(['disaster_id' => $disaster->id, 'user_id' => $account->id, 'name_of_road' => 'Not this account\'s form']);

    $this->actingAs($account)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('weatherReports', 1)
            ->where('roads', [])
            ->where('casualties', [])
            ->where('agriculture', []));
});

it('still sends an admin every form', function () {
    $admin = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    Road::create(['disaster_id' => $disaster->id, 'user_id' => userWithRole('user')->id, 'name_of_road' => 'Main road']);

    $this->actingAs($admin)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('roads', 1));
});
