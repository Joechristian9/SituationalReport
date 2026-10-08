<?php

use App\Models\ElectricityService;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WaterService;
use Spatie\Permission\Models\Permission;

function electricityAccount(): User
{
    Permission::findOrCreate('access-electricity-form');
    $user = userWithRole('user');
    $user->givePermissionTo('access-electricity-form');

    return $user;
}

it('keeps electricity records the saving account cannot see', function () {
    $barangay = electricityAccount();
    $otherOffice = electricityAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $barangay->id]);
    $hidden = ElectricityService::create(['disaster_id' => $disaster->id, 'user_id' => $otherOffice->id, 'status' => 'Feeder 3 down']);

    $this->actingAs($barangay)->postJson(route('electricity-reports.store'), [
        'electricityServices' => [['id' => null, 'status' => '66 barangays energized']],
    ])->assertOk();

    expect(ElectricityService::find($hidden->id))->not->toBeNull()
        ->and(ElectricityService::count())->toBe(2);
});

it('records the saving account as the creator, whatever user_id is sent', function () {
    $barangay = electricityAccount();
    $someoneElse = electricityAccount();
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $barangay->id]);

    $this->actingAs($barangay)->postJson(route('electricity-reports.store'), [
        'electricityServices' => [['id' => null, 'user_id' => $someoneElse->id, 'status' => 'All energized']],
    ])->assertOk();

    expect(ElectricityService::sole()->user_id)->toBe($barangay->id);
});

it('still removes a cleared row the account owns', function () {
    $barangay = electricityAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $barangay->id]);
    $own = ElectricityService::create(['disaster_id' => $disaster->id, 'user_id' => $barangay->id, 'status' => 'Old status']);

    $this->actingAs($barangay)->postJson(route('electricity-reports.store'), [
        'electricityServices' => [['id' => null, 'status' => 'New status']],
    ])->assertOk();

    expect(ElectricityService::find($own->id))->toBeNull()
        ->and(ElectricityService::sole()->status)->toBe('New status');
});

it('does not let an account without the electricity permission save', function () {
    $user = userWithRole('user');
    Permission::findOrCreate('access-electricity-form');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('electricity-reports.store'), [
        'electricityServices' => [['id' => null, 'status' => 'x']],
    ])->assertForbidden();
});

it('never lets a water services save change who created a record', function () {
    Permission::findOrCreate('access-water-service-form');
    $iwd = userWithRole('user');
    $iwd->givePermissionTo('access-water-service-form');
    $cdrrmo = userWithRole('user');
    $cdrrmo->givePermissionTo('access-water-service-form');
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $iwd->id]);
    $record = WaterService::create(['disaster_id' => $disaster->id, 'user_id' => $iwd->id, 'status' => 'Operational']);

    $this->actingAs($cdrrmo)->postJson(route('water-service-reports.store'), [
        'waterServices' => [
            ['id' => $record->id, 'user_id' => $cdrrmo->id, 'status' => 'Limited supply'],
            ['id' => null, 'user_id' => $iwd->id, 'status' => 'New source'],
        ],
    ])->assertOk();

    expect($record->fresh())->user_id->toBe($iwd->id)->status->toBe('Limited supply')
        ->and(WaterService::where('status', 'New source')->sole()->user_id)->toBe($cdrrmo->id);
});
