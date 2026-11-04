<?php

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\ResponseOperation;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\UscDeclaration;
use App\Models\User;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\WeatherReport;

function skippedRowsDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Storm '.uniqid(), 'status' => $status, 'created_by' => User::factory()->create()->id]);
}

/** A disaster with one row $owner may edit, and one it may not because that disaster has ended. */
function writableAndRefusedRows(string $model, string $field, mixed $old, User $owner): array
{
    $ended = skippedRowsDisaster('ended');
    $active = skippedRowsDisaster();

    return [
        $model::create(['disaster_id' => $active->id, 'user_id' => $owner->id, $field => $old]),
        $model::create(['disaster_id' => $ended->id, 'user_id' => $owner->id, $field => $old]),
    ];
}

it('saves the row it may and says which one it could not, still as a success', function (string $route, string $permission, string $model, string $key, string $field, mixed $old, mixed $new, array $extra) {
    $owner = userWithPermissions($permission);
    [$writable, $refused] = writableAndRefusedRows($model, $field, $old, $owner);

    $this->actingAs($owner)->postJson(route($route), [$key => [
        ['id' => $writable->id, $field => $new] + $extra,
        ['id' => $refused->id, $field => $new] + $extra,
    ]])
        ->assertSuccessful()
        ->assertJsonPath('message', "Saved. 1 row wasn't saved because you can't edit it.")
        ->assertJsonPath('skipped_rows', 1);

    expect($writable->fresh()->{$field})->toEqual($new)
        ->and($refused->fresh()->{$field})->toEqual($old);
})->with([
    'injured' => ['injured.store', 'access-injured-form', Injured::class, 'injured', 'name', 'Old', 'New', []],
    'casualties' => ['casualties.store', 'access-casualty-form', Casualty::class, 'casualties', 'name', 'Old', 'New', []],
    'missing' => ['missing.store', 'access-missing-form', Missing::class, 'missing', 'name', 'Old', 'New', []],
    'incidents' => ['incident-monitored.store', 'access-incident-form', IncidentMonitored::class, 'incidents', 'location', 'Old', 'New', []],
    'tourists' => ['affected-tourists.store', 'access-tourist-form', AffectedTourist::class, 'affected_tourists', 'location', 'Old', 'New', []],
    'damaged houses' => ['damaged-houses.store', 'access-damaged-houses-form', DamagedHouseReport::class, 'damaged_houses', 'partially', 1, 9, ['barangay' => null]],
    'pre-positioning' => ['pre-positioning.store', 'access-pre-positioning-form', PrePositioning::class, 'pre_positionings', 'team_units', 'Old', 'New', []],
    'declarations' => ['declaration-usc.store', 'access-declaration-form', UscDeclaration::class, 'usc_declarations', 'declared_by', 'Old', 'New', []],
    'class suspensions' => ['suspension-classes-reports.store', 'access-suspension-classes-form', SuspensionOfClass::class, 'suspension_of_classes', 'level', 'Old', 'New', []],
    'work suspensions' => ['suspension-work-reports.store', 'access-suspension-work-form', SuspensionOfWork::class, 'suspension_of_work', 'remarks', 'Old', 'New', []],
    'assistance' => ['assistance-extendeds.store', 'access-assistance-extended', AssistanceExtended::class, 'assistances', 'beneficiaries', 'Old', 'New', []],
    'response operations' => ['response-operations-reports.store', 'access-response-operations', ResponseOperation::class, 'responses', 'team_unit', 'Old', 'New', []],
    'pre-emptive' => ['pre-emptive-reports.store', 'access-pre-emptive-form', PreEmptiveReport::class, 'reports', 'evacuation_center', 'Old', 'New', []],
    'weather' => ['weather-reports.store', 'access-weather-form', WeatherReport::class, 'reports', 'sky_condition', 'Old', 'New', []],
    'water levels' => ['water-level-reports.store', 'access-water-level-form', WaterLevel::class, 'reports', 'gauging_station', 'Old', 'New', ['current_level' => null, 'alarm_level' => null, 'critical_level' => null, 'affected_areas' => null]],
    'electricity' => ['electricity-reports.store', 'access-electricity-form', ElectricityService::class, 'electricityServices', 'status', 'Old', 'New', []],
    'water services' => ['water-service-reports.store', 'access-water-service-form', WaterService::class, 'waterServices', 'status', 'Old', 'New', []],
    'communications' => ['communication-reports.store', 'access-communication-form', Communication::class, 'communications', 'globe', 'Old', 'New', []],
    'roads' => ['road-reports.store', 'access-road-form', Road::class, 'roads', 'name_of_road', 'Old', 'New', []],
    'bridges' => ['bridge-reports.store', 'access-bridge-form', Bridge::class, 'bridges', 'name_of_bridge', 'Old', 'New', []],
    'agriculture' => ['agriculture-reports.store', 'access-agriculture-form', AgricultureReport::class, 'crops', 'crops_affected', 'Old', 'New', []],
]);

it('counts several skipped rows in the plural', function () {
    $owner = userWithPermissions('access-road-form');
    $ended = skippedRowsDisaster('ended');
    skippedRowsDisaster();
    $rows = collect(range(1, 2))->map(fn () => Road::create(['disaster_id' => $ended->id, 'user_id' => $owner->id, 'name_of_road' => 'Old']));

    $this->actingAs($owner)->postJson(route('road-reports.store'), [
        'roads' => $rows->map(fn (Road $road) => ['id' => $road->id, 'name_of_road' => 'New'])->all(),
    ])
        ->assertOk()
        ->assertJsonPath('message', "Saved. 2 rows weren't saved because you can't edit them.")
        ->assertJsonPath('skipped_rows', 2);
});

it('answers exactly as before when nothing is skipped', function () {
    $owner = userWithPermissions('access-road-form');
    $active = skippedRowsDisaster();
    $road = Road::create(['disaster_id' => $active->id, 'user_id' => $owner->id, 'name_of_road' => 'Old']);

    $this->actingAs($owner)->postJson(route('road-reports.store'), ['roads' => [['id' => $road->id, 'name_of_road' => 'New']]])
        ->assertOk()
        ->assertJsonPath('message', 'Road reports saved successfully')
        ->assertJsonMissingPath('skipped_rows')
        ->assertDontSee('wasn', false);
});

it('stays quiet about a view-only row the person left alone, and speaks up when they edited it', function () {
    $owner = userWithPermissions('access-road-form');
    $sharedBy = User::factory()->create();
    $active = skippedRowsDisaster();
    $mine = Road::create(['disaster_id' => $active->id, 'user_id' => $owner->id, 'name_of_road' => 'Mine']);
    $shared = Road::create(['disaster_id' => $active->id, 'user_id' => $sharedBy->id, 'name_of_road' => 'Theirs']);
    $save = fn (array $sharedRow) => $this->actingAs($owner)->postJson(route('road-reports.store'), [
        '_editCheck' => 'roads',
        'roads' => [['id' => $mine->id, 'name_of_road' => 'Mine edited', '_changed' => true], ['id' => $shared->id, 'name_of_road' => 'Theirs'] + $sharedRow],
    ]);

    // The forms send every row on screen, edited or not.
    $save([])->assertOk()->assertJsonMissingPath('skipped_rows');
    $save(['_changed' => true])->assertOk()->assertJsonPath('skipped_rows', 1);

    expect($shared->fresh()->name_of_road)->toBe('Theirs');
});

it('says so in the flash too when the save answers with a redirect', function () {
    $owner = userWithPermissions('access-injured-form');
    $ended = skippedRowsDisaster('ended');
    skippedRowsDisaster();
    $refused = Injured::factory()->create(['user_id' => $owner->id, 'disaster_id' => $ended->id, 'name' => 'Old']);

    $this->actingAs($owner)
        ->post(route('injured.store'), ['injured' => [['id' => $refused->id, 'name' => 'New']]])
        ->assertRedirect()
        ->assertSessionHas('success', "Saved. 1 row wasn't saved because you can't edit it.");
});

it('marks a queued save with a skipped row as done, so a retry writes nothing again', function () {
    $owner = userWithPermissions('access-injured-form');
    $ended = skippedRowsDisaster('ended');
    $active = skippedRowsDisaster();
    $refused = Injured::factory()->create(['user_id' => $owner->id, 'disaster_id' => $ended->id, 'name' => 'Old']);
    $headers = ['X-Offline-Key' => 'skipped-row-key', 'X-Offline-Disaster' => (string) $active->id];
    $payload = ['injured' => [['id' => $refused->id, 'name' => 'New'], ['name' => 'Brand new']]];

    $this->actingAs($owner)->postJson(route('injured.store'), $payload, $headers)->assertOk()->assertJsonPath('skipped_rows', 1);
    $this->actingAs($owner)->postJson(route('injured.store'), $payload, $headers)->assertOk()->assertJson(['replayed' => true]);

    expect($refused->fresh()->name)->toBe('Old')
        ->and(Injured::where('disaster_id', $active->id)->count())->toBe(1);
});

it('refuses numbers too big for their decimal column', function (string $route, string $permission, string $key, array $row) {
    skippedRowsDisaster();

    $this->actingAs(userWithPermissions($permission))->postJson(route($route), [$key => [$row]])->assertStatus(422);
})->with([
    'water level' => ['water-level-reports.store', 'access-water-level-form', 'reports', ['gauging_station' => 'A', 'current_level' => '1000000']],
    'negative water level' => ['water-level-reports.store', 'access-water-level-form', 'reports', ['gauging_station' => 'A', 'current_level' => '-1000000']],
    'alarm level' => ['water-level-reports.store', 'access-water-level-form', 'reports', ['gauging_station' => 'A', 'alarm_level' => '1000000']],
    'critical level' => ['water-level-reports.store', 'access-water-level-form', 'reports', ['gauging_station' => 'A', 'critical_level' => '1000000']],
    'standing crop' => ['agriculture-reports.store', 'access-agriculture-form', 'crops', ['crops_affected' => 'A', 'standing_crop_ha' => '100000000']],
    'area affected' => ['agriculture-reports.store', 'access-agriculture-form', 'crops', ['crops_affected' => 'A', 'total_area_affected_ha' => '100000000']],
    'production loss' => ['agriculture-reports.store', 'access-agriculture-form', 'crops', ['crops_affected' => 'A', 'total_production_loss' => '10000000000000']],
]);

it('accepts the largest numbers those columns hold', function (string $route, string $permission, string $key, string $model, array $row) {
    skippedRowsDisaster();

    $this->actingAs(userWithPermissions($permission))->postJson(route($route), [$key => [$row]])->assertSuccessful();

    expect($model::count())->toBe(1);
})->with([
    'water levels' => ['water-level-reports.store', 'access-water-level-form', 'reports', WaterLevel::class, ['gauging_station' => 'A', 'current_level' => '999999.99', 'alarm_level' => '-999999.99', 'critical_level' => '999999.99', 'affected_areas' => null]],
    'agriculture' => ['agriculture-reports.store', 'access-agriculture-form', 'crops', AgricultureReport::class, ['crops_affected' => 'A', 'standing_crop_ha' => '99999999.99', 'total_area_affected_ha' => '99999999.99', 'total_production_loss' => '9999999999999.99']],
]);

it('lets an admin save without the form\'s permission row, and refuses anyone else with 403', function (string $route, string $table, string $key, array $row) {
    skippedRowsDisaster();

    $this->actingAs(userWithRole('user'))->postJson(route($route), [$key => [$row]])->assertForbidden();
    expect(DB::table($table)->count())->toBe(0);

    $this->actingAs(userWithRole('admin'))->postJson(route($route), [$key => [$row]])->assertSuccessful();
    expect(DB::table($table)->count())->toBe(1);
})->with([
    'weather' => ['weather-reports.store', 'weather_reports', 'reports', ['sky_condition' => 'A', 'wind' => null, 'precipitation' => null, 'sea_condition' => null]],
    'water levels' => ['water-level-reports.store', 'water_levels', 'reports', ['gauging_station' => 'A', 'current_level' => null, 'alarm_level' => null, 'critical_level' => null, 'affected_areas' => null]],
    'electricity' => ['electricity-reports.store', 'electricity_services', 'electricityServices', ['status' => 'A']],
    'water services' => ['water-service-reports.store', 'water_services', 'waterServices', ['status' => 'A']],
    'communications' => ['communication-reports.store', 'communications', 'communications', ['globe' => 'A']],
    'roads' => ['road-reports.store', 'roads', 'roads', ['name_of_road' => 'A']],
    'bridges' => ['bridge-reports.store', 'bridges', 'bridges', ['name_of_bridge' => 'A']],
    'pre-emptive' => ['pre-emptive-reports.store', 'pre_emptive_reports', 'reports', ['evacuation_center' => 'A']],
]);
