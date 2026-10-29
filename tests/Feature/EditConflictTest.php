<?php

use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\Typhoon;
use App\Models\User;
use Spatie\Permission\Models\Permission;

/** An active disaster, a road account, and one of its roads as both its phones loaded it. */
function roadLoadedOnTwoPhones(): array
{
    $account = userWithPermissions('access-road-form');
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => User::factory()->create()->id]);
    $road = Road::create(['name_of_road' => 'Old', 'status' => 'Passable', 'user_id' => $account->id, 'disaster_id' => $disaster->id]);

    return [$account, $road, $road->updated_at->toIso8601String()];
}

/** Phone A saves its change a minute after both phones loaded the road. */
function changedOnTheOtherPhone(Road $road): void
{
    test()->travel(1)->minutes();
    $road->update(['name_of_road' => 'From phone A', 'updated_by' => $road->user_id]);
}

function saveRoads(User $account, array $roads)
{
    return test()->actingAs($account)->postJson(route('road-reports.store'), ['roads' => $roads, '_editCheck' => 'roads']);
}

it('turns down the whole save when a changed row was also changed on another device', function () {
    [$account, $road, $loadedAt] = roadLoadedOnTwoPhones();
    changedOnTheOtherPhone($road);

    saveRoads($account, [
        ['id' => $road->id, 'name_of_road' => 'From phone B', 'status' => 'Passable', 'updated_at' => $loadedAt, '_changed' => true],
        ['id' => null, 'name_of_road' => 'New road', 'status' => 'Closed'],
    ])->assertStatus(409)
        ->assertJsonPath('conflicts.0.id', $road->id)
        ->assertJsonPath('conflicts.0.byYou', true)
        ->assertJsonMissingPath('conflicts.0.name_of_road');

    // Nothing is saved in part.
    expect($road->fresh()->name_of_road)->toBe('From phone A')
        ->and(Road::where('name_of_road', 'New road')->exists())->toBeFalse();
});

it('keeps another device\'s change in a row this device did not touch', function () {
    [$account, $road, $loadedAt] = roadLoadedOnTwoPhones();
    $other = Road::create(['name_of_road' => 'Second', 'status' => 'Passable', 'user_id' => $account->id, 'disaster_id' => $road->disaster_id]);
    $otherLoadedAt = $other->updated_at->toIso8601String();
    changedOnTheOtherPhone($road);

    saveRoads($account, [
        ['id' => $road->id, 'name_of_road' => 'Old', 'status' => 'Passable', 'updated_at' => $loadedAt],
        ['id' => $other->id, 'name_of_road' => 'Second, edited', 'status' => 'Passable', 'updated_at' => $otherLoadedAt, '_changed' => true],
    ])->assertOk();

    expect($road->fresh()->name_of_road)->toBe('From phone A')
        ->and($other->fresh()->name_of_road)->toBe('Second, edited');
});

it('saves over the other device\'s change once the person chooses to keep theirs', function () {
    [$account, $road] = roadLoadedOnTwoPhones();
    changedOnTheOtherPhone($road);

    // "Keep mine": the device sends the row again stamped with the time it was told about.
    saveRoads($account, [
        ['id' => $road->id, 'name_of_road' => 'From phone B', 'status' => 'Passable', 'updated_at' => $road->fresh()->updated_at->toIso8601String(), '_changed' => true],
    ])->assertOk();

    expect($road->fresh()->name_of_road)->toBe('From phone B');
});

it('keeps a service status another device changed, in a communication row this device did not touch', function () {
    [$account, $road] = roadLoadedOnTwoPhones();
    $account->givePermissionTo(Permission::findOrCreate('access-communication-form'));
    $service = CommunicationService::create(['name' => 'Globe', 'category' => 'cellphone', 'order' => 1, 'is_active' => true]);
    $row = Communication::create(['remarks' => 'Both phones', 'user_id' => $account->id, 'disaster_id' => $road->disaster_id]);
    $row->serviceValues()->create(['service_id' => $service->id, 'status' => 'Signal']);
    $loadedAt = $row->fresh()->updated_at->toIso8601String();

    // Phone A: Globe is down. Saving the status counts as a change of the row.
    $this->travel(1)->minutes();
    $row->serviceValues()->first()->update(['status' => 'No signal']);
    expect($row->fresh()->updated_at->toIso8601String())->not->toBe($loadedAt);

    // Phone B saves its old copy of the row, untouched.
    $this->actingAs($account)->postJson(route('communication-reports.store'), [
        'communications' => [['id' => $row->id, 'remarks' => 'Both phones', 'updated_at' => $loadedAt, 'service_values' => [['service_id' => $service->id, 'status' => 'Signal']]]],
        '_editCheck' => 'communications',
    ])->assertOk();

    expect($row->serviceValues()->first()->status)->toBe('No signal');
});

it('never copies another account\'s row into a save', function () {
    [, $road] = roadLoadedOnTwoPhones();
    $owner = userWithPermissions('access-suspension-classes-form');
    $intruder = userWithPermissions('access-suspension-classes-form');
    $row = SuspensionOfClass::create(['province_city_municipality' => 'Private', 'user_id' => $owner->id, 'disaster_id' => $road->disaster_id]);

    // An old timestamp and no edit: the row must be left out, not filled with its saved values
    // (this save would otherwise turn it into a new row of the intruder's).
    $this->actingAs($intruder)->postJson(route('suspension-classes-reports.store'), [
        'suspension_of_classes' => [['id' => $row->id, 'province_city_municipality' => 'Guess', 'updated_at' => '2000-01-01T00:00:00Z']],
        '_editCheck' => 'suspension_of_classes',
    ]);

    expect(SuspensionOfClass::where('user_id', $intruder->id)->count())->toBe(0)
        ->and($row->fresh()->province_city_municipality)->toBe('Private');
});
