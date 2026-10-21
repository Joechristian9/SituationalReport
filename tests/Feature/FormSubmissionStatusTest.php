<?php

use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

it('counts each account\'s records per form for the current disaster only', function () {
    $admin = userWithRole('admin');
    $old = Typhoon::create(['name' => 'Old', 'status' => 'ended', 'created_by' => $admin->id]);
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    $account = userWithPermissions('access-weather-form', 'access-road-form', 'access-agriculture-form');
    $row = fn (string $table, int $disasterId, string $at) => DB::table($table)->insert(['disaster_id' => $disasterId, 'user_id' => $account->id, 'created_at' => $at, 'updated_at' => $at]);
    $row('weather_reports', $disaster->id, '2026-10-01 08:00:00');
    $row('weather_reports', $disaster->id, '2026-10-02 09:00:00');
    $row('roads', $old->id, '2026-09-01 08:00:00'); // other disaster: ignored
    DB::table('agriculture_reports')->insert(['disaster_id' => $disaster->id, 'crops_affected' => 'Rice', 'created_at' => '2026-10-03 10:00:00', 'updated_at' => '2026-10-03 10:00:00']);

    $this->actingAs($admin)
        ->get(route('admin.form-submission-status'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeTyphoon', ['id' => $disaster->id, 'name' => 'Storm', 'status' => 'active'])
            ->where('users.0.id', $account->id)
            ->where('users.0.has_submitted', true)
            ->where('users.0.submitted_form_types', ['weather_reports', 'agriculture_reports'])
            ->where('users.0.submitted_forms.0.count', 2)
            ->where('users.0.submitted_forms.0.name', 'Weather Report')
            ->where('users.0.submitted_forms.1.name', 'Agriculture Report')
            ->where('users.0.last_submission', '2026-10-03 10:00:00')
            ->where('users.0.pending_forms', ['Roads'])
            ->where('users.0.forms', ['done' => 2, 'total' => 3, 'toSubmit' => ['Roads'], 'submitted' => ['Weather Report', 'Agriculture Report']]));
});

it('shows every account as not submitted when no disaster is running', function () {
    $admin = userWithRole('admin');
    userWithPermissions('access-weather-form');

    $this->actingAs($admin)
        ->get(route('admin.form-submission-status'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeTyphoon', null)
            ->where('users.0.has_submitted', false)
            ->where('users.0.pending_forms', [])
            ->where('users.0.forms', ['done' => 0, 'total' => 1, 'toSubmit' => ['Weather Report'], 'submitted' => []]));
});
