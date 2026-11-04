<?php

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\AssistanceProvidedLgu;
use App\Models\Bridge;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\ResponseOperation;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WaterService;
use Spatie\Permission\Models\Permission;

function saveOutcomeDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Storm '.uniqid(), 'status' => $status, 'created_by' => User::factory()->create()->id]);
}

it('answers a bridge save that is not allowed with 403, not a server error', function () {
    saveOutcomeDisaster();
    Permission::findOrCreate('access-bridge-form');

    $this->actingAs(userWithRole('user'))
        ->postJson(route('bridge-reports.store'), ['bridges' => [['status' => 'Passable']]])
        ->assertForbidden();

    expect(Bridge::count())->toBe(0);
});

it('answers an invalid bridge save with 422, not a server error', function () {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions('access-bridge-form'))
        ->postJson(route('bridge-reports.store'), ['bridges' => [['status' => str_repeat('x', 256)]]])
        ->assertStatus(422)
        ->assertJsonValidationErrors('bridges.0.status');
});

it('still answers a real failure of a bridge save with a 500 that gives nothing away', function () {
    saveOutcomeDisaster();
    Bridge::creating(fn () => throw new RuntimeException('Secret database detail'));

    $this->actingAs(userWithPermissions('access-bridge-form'))
        ->postJson(route('bridge-reports.store'), ['bridges' => [['status' => 'Passable']]])
        ->assertStatus(500)
        ->assertDontSee('Secret database detail');
});

it('refuses an amount too big for its column', function (string $route, string $field) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions('access-assistance-extended'))
        ->postJson(route($route), ['assistances' => [['beneficiaries' => 'A', $field => 10000000000]]])
        ->assertStatus(422);
})->with([
    'assistance amount' => ['assistance-extendeds.store', 'amount'],
    'lgu amount' => ['assistance-provided-lgus.store', 'amount'],
    'lgu cost per unit' => ['assistance-provided-lgus.store', 'cost_per_unit'],
]);

it('accepts the largest amount the column holds', function (string $route, string $model, string $field) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions('access-assistance-extended'))
        ->postJson(route($route), ['assistances' => [[$field => 9999999999.99]]]);

    expect((float) $model::sole()->{$field})->toBe(9999999999.99);
})->with([
    'assistance amount' => ['assistance-extendeds.store', AssistanceExtended::class, 'amount'],
    'lgu amount' => ['assistance-provided-lgus.store', AssistanceProvidedLgu::class, 'amount'],
    'lgu cost per unit' => ['assistance-provided-lgus.store', AssistanceProvidedLgu::class, 'cost_per_unit'],
]);

it('refuses an oversized amount when editing one record too', function (string $route, string $model, string $field) {
    $disaster = saveOutcomeDisaster();
    $owner = userWithPermissions('access-assistance-extended');
    $record = $model::create(['disaster_id' => $disaster->id, 'user_id' => $owner->id]);

    $this->actingAs($owner)->patchJson(route($route, $record), [$field => 10000000000])->assertStatus(422);
})->with([
    'assistance amount' => ['assistance-extendeds.update', AssistanceExtended::class, 'amount'],
    'lgu amount' => ['assistance-provided-lgus.update', AssistanceProvidedLgu::class, 'amount'],
    'lgu cost per unit' => ['assistance-provided-lgus.update', AssistanceProvidedLgu::class, 'cost_per_unit'],
]);

// route, permission, model, request key, field, other values the row needs
dataset('saves with one list per account', [
    'tourists' => ['affected-tourists.store', 'access-tourist-form', AffectedTourist::class, 'affected_tourists', 'location', []],
    'damaged houses' => ['damaged-houses.store', 'access-damaged-houses-form', DamagedHouseReport::class, 'damaged_houses', 'barangay', ['partially' => 1]],
    'response operations' => ['response-operations-reports.store', 'access-response-operations', ResponseOperation::class, 'responses', 'team_unit', []],
    'class suspensions' => ['suspension-classes-reports.store', 'access-suspension-classes-form', SuspensionOfClass::class, 'suspension_of_classes', 'level', []],
    'work suspensions' => ['suspension-work-reports.store', 'access-suspension-work-form', SuspensionOfWork::class, 'suspension_of_work', 'remarks', []],
]);

dataset('saves of shared lists', [
    'water services' => ['water-service-reports.store', 'access-water-service-form', WaterService::class, 'waterServices', 'status', []],
    'electricity' => ['electricity-reports.store', 'access-electricity-form', ElectricityService::class, 'electricityServices', 'status', []],
    'agriculture' => ['agriculture-reports.store', 'access-agriculture-form', AgricultureReport::class, 'crops', 'crops_affected', []],
]);

it('creates nothing for another account\'s row', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    $disaster = saveOutcomeDisaster();
    $row = $model::create(['disaster_id' => $disaster->id, 'user_id' => User::factory()->create()->id, $field => 'Old']);

    $this->actingAs(userWithPermissions($permission))
        ->postJson(route($route), [$key => [['id' => $row->id, $field => $field === 'barangay' ? null : 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::count())->toBe(1)
        ->and($row->fresh()->{$field})->toBe('Old');
})->with('saves with one list per account');

it('creates nothing for a row of another disaster', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    $ended = saveOutcomeDisaster('ended');
    $active = saveOutcomeDisaster();
    $user = userWithPermissions($permission);
    $row = $model::create(['disaster_id' => $ended->id, 'user_id' => $user->id, $field => 'Old']);

    $this->actingAs($user)
        ->postJson(route($route), [$key => [['id' => $row->id, $field => $field === 'barangay' ? null : 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::where('disaster_id', $active->id)->count())->toBe(0)
        ->and($row->fresh()->{$field})->toBe('Old');
})->with('saves with one list per account');

it('creates nothing for a row of another disaster on a shared list', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    $ended = saveOutcomeDisaster('ended');
    $active = saveOutcomeDisaster();
    $user = userWithPermissions($permission);
    $row = $model::create(['disaster_id' => $ended->id, 'user_id' => $user->id, $field => 'Old']);

    $this->actingAs($user)
        ->postJson(route($route), [$key => [['id' => $row->id, $field => 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::where('disaster_id', $active->id)->count())->toBe(0)
        ->and($row->fresh()->{$field})->toBe('Old');
})->with('saves of shared lists');

it('creates nothing for an id that does not exist', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions($permission))
        ->postJson(route($route), [$key => [['id' => 999999, $field => $field === 'barangay' ? null : 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::count())->toBe(0);
})->with('saves with one list per account');

it('creates nothing for an unknown id on the water services list, which has no delete', function () {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions('access-water-service-form'))
        ->postJson(route('water-service-reports.store'), ['waterServices' => [['id' => 999999, 'status' => 'Sent']]])
        ->assertSuccessful();

    expect(WaterService::count())->toBe(0);
});

// Another device can have removed the row from these lists, and the edit on this one must not vanish.
it('keeps a row whose id is gone from a list where rows can be removed', function (string $route, string $permission, string $model, string $key, string $field) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions($permission))
        ->postJson(route($route), [$key => [['id' => 999999, $field => 'Sent']]])
        ->assertSuccessful();

    expect($model::sole()->{$field})->toBe('Sent');
})->with([
    'electricity' => ['electricity-reports.store', 'access-electricity-form', ElectricityService::class, 'electricityServices', 'status'],
    'agriculture' => ['agriculture-reports.store', 'access-agriculture-form', AgricultureReport::class, 'crops', 'crops_affected'],
]);

it('still creates a truly new row', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions($permission))
        ->postJson(route($route), [$key => [['id' => null, $field => $field === 'barangay' ? null : 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::count())->toBe(1);
})->with('saves with one list per account');

it('still creates a truly new row on a shared list', function (string $route, string $permission, string $model, string $key, string $field, array $extra) {
    saveOutcomeDisaster();

    $this->actingAs(userWithPermissions($permission))
        ->postJson(route($route), [$key => [['id' => null, $field => 'Sent'] + $extra]])
        ->assertSuccessful();

    expect($model::sole()->{$field})->toBe('Sent');
})->with('saves of shared lists');
