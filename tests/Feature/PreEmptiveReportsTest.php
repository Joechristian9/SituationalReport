<?php

use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Models\User;
use Spatie\Permission\Models\Permission;

function preEmptiveAccount(): User
{
    Permission::findOrCreate('access-pre-emptive-form');
    $user = userWithRole('user');
    $user->givePermissionTo('access-pre-emptive-form');

    return $user;
}

it('computes the totals on the server, ignoring totals sent by the browser', function () {
    $user = preEmptiveAccount();
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [[
            'id' => null, 'barangay' => 'Rugao', 'families' => 3, 'persons' => 12,
            'outside_families' => 2, 'outside_persons' => 7, 'total_families' => 999, 'total_persons' => 999,
        ]],
    ])->assertOk();

    expect(PreEmptiveReport::sole())->total_families->toBe(5)->total_persons->toBe(19);
});

it('keeps the totals right when a saved row is edited', function () {
    $user = preEmptiveAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $report = PreEmptiveReport::create([
        'disaster_id' => $disaster->id, 'user_id' => $user->id, 'barangay' => 'Rugao',
        'families' => 3, 'persons' => 12, 'total_families' => 3, 'total_persons' => 12,
    ]);

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [['id' => $report->id, 'barangay' => 'Rugao', 'families' => 4, 'persons' => 12, 'outside_persons' => 1]],
    ])->assertOk();

    expect($report->fresh())->total_families->toBe(4)->total_persons->toBe(13);
});

it('does not let an account without the pre-emptive permission save', function () {
    Permission::findOrCreate('access-pre-emptive-form');
    $user = userWithRole('user');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [['id' => null, 'barangay' => 'Rugao', 'families' => 1]],
    ])->assertForbidden();

    expect(PreEmptiveReport::count())->toBe(0);
});
