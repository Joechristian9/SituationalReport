<?php

use App\Models\Typhoon;
use App\Services\PendingForms;
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

it('credits a pre-emptive row to its filer and to the barangay it names, once each', function () {
    $admin = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    $other = Typhoon::create(['name' => 'Other', 'status' => 'ended', 'created_by' => $admin->id]);
    $office = userWithPermissions('access-pre-emptive-form');
    $rugao = userWithPermissions('access-pre-emptive-form');
    $rugao->update(['name' => 'Rugao', 'email' => 'rugao@barangay.local']);
    $alibagu = userWithPermissions('access-pre-emptive-form');
    $alibagu->update(['name' => 'Alibagu', 'email' => 'alibagu@barangay.local']);
    // Same name as Alibagu's account: both are credited, as the name is all a row carries.
    $twin = userWithPermissions('access-pre-emptive-form');
    $twin->update(['name' => 'Alibagu', 'email' => 'twin@barangay.local']);
    $row = fn (int $userId, ?string $barangay, string $at, ?int $disasterId = null) => DB::table('pre_emptive_reports')->insert(['disaster_id' => $disasterId ?? $disaster->id, 'user_id' => $userId, 'barangay' => $barangay, 'created_at' => $at, 'updated_at' => $at]);

    $row($rugao->id, 'Rugao', '2026-10-01 08:00:00');      // own row naming itself: counts once
    $row($office->id, 'Rugao', '2026-10-02 08:00:00');     // office's row for Rugao: both
    $row($office->id, null, '2026-10-03 08:00:00');        // office only
    $row($rugao->id, 'Alibagu', '2026-10-04 08:00:00');    // Rugao, Alibagu and its twin
    $row($office->id, 'Alibagu', '2026-10-05 08:00:00');   // office, Alibagu and its twin
    $row($office->id, 'Nowhere', '2026-10-06 08:00:00');   // names nobody: office only
    $row($office->id, 'Rugao', '2026-10-07 08:00:00', $other->id); // other disaster: ignored

    $byUser = PendingForms::submissionsByUser($disaster);
    $counts = array_map(fn (array $forms) => $forms['pre_emptive_reports'], $byUser);
    ksort($counts);
    $expected = [
        $office->id => ['count' => 4, 'last_updated' => '2026-10-06 08:00:00'],
        $rugao->id => ['count' => 3, 'last_updated' => '2026-10-04 08:00:00'],
        $alibagu->id => ['count' => 2, 'last_updated' => '2026-10-05 08:00:00'],
        $twin->id => ['count' => 2, 'last_updated' => '2026-10-05 08:00:00'],
    ];
    ksort($expected);

    expect($counts)->toBe($expected);
});
