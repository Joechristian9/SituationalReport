<?php

use App\Models\AgricultureReport;
use App\Models\Typhoon;
use App\Models\User;
use Spatie\Permission\Models\Permission;

function agricultureAccount(): User
{
    Permission::findOrCreate('access-agriculture-form');
    $user = userWithRole('user');
    $user->givePermissionTo('access-agriculture-form');

    return $user;
}

it('updates saved crops in place instead of recreating them', function () {
    $user = agricultureAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $rice = AgricultureReport::create(['disaster_id' => $disaster->id, 'crops_affected' => 'Rice', 'standing_crop_ha' => 10]);

    $this->actingAs($user)->postJson(route('agriculture-reports.store'), [
        'crops' => [
            ['id' => $rice->id, 'crops_affected' => 'Rice', 'standing_crop_ha' => 12],
            ['id' => null, 'crops_affected' => 'Corn', 'standing_crop_ha' => 4],
        ],
    ])->assertOk()->assertJsonCount(2, 'agriculture');

    expect($rice->fresh())->not->toBeNull()
        ->and((float) $rice->fresh()->standing_crop_ha)->toBe(12.0)
        ->and(AgricultureReport::where('crops_affected', 'Corn')->sole()->user_id)->toBe($user->id)
        ->and(AgricultureReport::count())->toBe(2);
});

it('removes a crop that was cleared, and leaves other disasters alone', function () {
    $user = agricultureAccount();
    $old = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $user->id]);
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $past = AgricultureReport::create(['disaster_id' => $old->id, 'crops_affected' => 'Rice']);
    $rice = AgricultureReport::create(['disaster_id' => $disaster->id, 'crops_affected' => 'Rice']);
    $corn = AgricultureReport::create(['disaster_id' => $disaster->id, 'crops_affected' => 'Corn']);

    $this->actingAs($user)->postJson(route('agriculture-reports.store'), [
        'crops' => [['id' => $rice->id, 'crops_affected' => 'Rice'], ['id' => $corn->id, 'crops_affected' => '']],
    ])->assertOk();

    expect(AgricultureReport::pluck('id')->sort()->values()->all())->toBe([$past->id, $rice->id]);
});

it('does not let an account without the agriculture permission save', function () {
    Permission::findOrCreate('access-agriculture-form');
    $user = userWithRole('user');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('agriculture-reports.store'), ['crops' => [['crops_affected' => 'Rice']]])->assertForbidden();

    expect(AgricultureReport::count())->toBe(0);
});

it('gives the situation reports page every crop of the active disaster', function () {
    $user = agricultureAccount();
    $old = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $user->id]);
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    AgricultureReport::create(['disaster_id' => $old->id, 'crops_affected' => 'Old rice']);
    AgricultureReport::create(['disaster_id' => $disaster->id, 'crops_affected' => 'Rice']);

    $this->actingAs($user)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('agriculture', 1)->where('agriculture.0.crops_affected', 'Rice'));
});
