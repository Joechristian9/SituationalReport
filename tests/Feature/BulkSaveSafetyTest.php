<?php

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\AssistanceProvidedLgu;
use App\Models\AuditLog;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\CommunicationServiceValue;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\Modification;
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
use Illuminate\Support\Facades\DB;

function bulkSaveDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Storm '.uniqid(), 'status' => $status, 'created_by' => User::factory()->create()->id]);
}

/** How many of the queries $save runs mention $table. */
function queriesOn(string $table, Closure $save): int
{
    DB::flushQueryLog();
    DB::enableQueryLog();
    $save();
    $count = collect(DB::getQueryLog())->filter(fn (array $query) => str_contains($query['query'], "\"{$table}\""))->count();
    DB::disableQueryLog();

    return $count;
}

// route, permission, model, request key, two rows to save
dataset('multi-row saves', [
    'injured' => ['injured.store', 'access-injured-form', Injured::class, 'injured', [['name' => 'A'], ['name' => 'B']]],
    'casualties' => ['casualties.store', 'access-casualty-form', Casualty::class, 'casualties', [['name' => 'A'], ['name' => 'B']]],
    'missing' => ['missing.store', 'access-missing-form', Missing::class, 'missing', [['name' => 'A'], ['name' => 'B']]],
    'incidents' => ['incident-monitored.store', 'access-incident-form', IncidentMonitored::class, 'incidents', [['location' => 'A'], ['location' => 'B']]],
    'tourists' => ['affected-tourists.store', 'access-tourist-form', AffectedTourist::class, 'affected_tourists', [['location' => 'A'], ['location' => 'B']]],
    'damaged houses' => ['damaged-houses.store', 'access-damaged-houses-form', DamagedHouseReport::class, 'damaged_houses', [['barangay' => null, 'partially' => 1], ['barangay' => null, 'partially' => 2]]],
    'pre-positioning' => ['pre-positioning.store', 'access-pre-positioning-form', PrePositioning::class, 'pre_positionings', [['team_units' => 'A'], ['team_units' => 'B']]],
    'declarations' => ['declaration-usc.store', 'access-declaration-form', UscDeclaration::class, 'usc_declarations', [['declared_by' => 'A'], ['declared_by' => 'B']]],
    'class suspensions' => ['suspension-classes-reports.store', 'access-suspension-classes-form', SuspensionOfClass::class, 'suspension_of_classes', [['level' => 'A'], ['level' => 'B']]],
    'work suspensions' => ['suspension-work-reports.store', 'access-suspension-work-form', SuspensionOfWork::class, 'suspension_of_work', [['remarks' => 'A'], ['remarks' => 'B']]],
    'assistance' => ['assistance-extendeds.store', 'access-assistance-extended', AssistanceExtended::class, 'assistances', [['beneficiaries' => 'A'], ['beneficiaries' => 'B']]],
    'lgu assistance' => ['assistance-provided-lgus.store', 'access-assistance-extended', AssistanceProvidedLgu::class, 'assistances', [['province' => 'A'], ['province' => 'B']]],
    'response operations' => ['response-operations-reports.store', 'access-response-operations', ResponseOperation::class, 'responses', [['team_unit' => 'A'], ['team_unit' => 'B']]],
    'pre-emptive' => ['pre-emptive-reports.store', 'access-pre-emptive-form', PreEmptiveReport::class, 'reports', [['evacuation_center' => 'A'], ['evacuation_center' => 'B']]],
    'weather' => ['weather-reports.store', 'access-weather-form', WeatherReport::class, 'reports', [
        ['sky_condition' => 'A', 'wind' => null, 'precipitation' => null, 'sea_condition' => null],
        ['sky_condition' => 'B', 'wind' => null, 'precipitation' => null, 'sea_condition' => null],
    ]],
    'water levels' => ['water-level-reports.store', 'access-water-level-form', WaterLevel::class, 'reports', [
        ['gauging_station' => 'A', 'current_level' => null, 'alarm_level' => null, 'critical_level' => null, 'affected_areas' => null],
        ['gauging_station' => 'B', 'current_level' => null, 'alarm_level' => null, 'critical_level' => null, 'affected_areas' => null],
    ]],
    'electricity' => ['electricity-reports.store', 'access-electricity-form', ElectricityService::class, 'electricityServices', [['status' => 'A'], ['status' => 'B']]],
    'water services' => ['water-service-reports.store', 'access-water-service-form', WaterService::class, 'waterServices', [['status' => 'A'], ['status' => 'B']]],
    'communications' => ['communication-reports.store', 'access-communication-form', Communication::class, 'communications', [['globe' => 'A'], ['globe' => 'B']]],
    'roads' => ['road-reports.store', 'access-road-form', Road::class, 'roads', [['name_of_road' => 'A'], ['name_of_road' => 'B']]],
    'bridges' => ['bridge-reports.store', 'access-bridge-form', Bridge::class, 'bridges', [['name_of_bridge' => 'A'], ['name_of_bridge' => 'B']]],
    'agriculture' => ['agriculture-reports.store', 'access-agriculture-form', AgricultureReport::class, 'crops', [['crops_affected' => 'A'], ['crops_affected' => 'B']]],
]);

it('saves nothing when a queued save fails midway, so the retry writes each row once', function (string $route, string $permission, string $model, string $key, array $rows) {
    $user = userWithPermissions($permission);
    $disaster = bulkSaveDisaster();
    $headers = ['X-Offline-Key' => 'retry-key-123', 'X-Offline-Disaster' => (string) $disaster->id];

    $failing = true;
    $seen = 0;
    $model::creating(function () use (&$failing, &$seen) {
        if ($failing && ++$seen === 2) {
            throw new RuntimeException('The second row failed');
        }
    });

    $this->actingAs($user)->postJson(route($route), [$key => $rows], $headers)->assertServerError();

    expect($model::count())->toBe(0)
        ->and(Modification::where('model_type', class_basename($model))->count())->toBe(0)
        ->and(AuditLog::where('auditable_type', $model)->count())->toBe(0);

    $failing = false;
    // Some of these saves answer with a redirect, which the offline queue also counts as saved.
    $retry = $this->actingAs($user)->postJson(route($route), [$key => $rows], $headers);

    expect($retry->isSuccessful() || $retry->isRedirection())->toBeTrue()
        ->and($model::count())->toBe(2);
})->with('multi-row saves');

it('undoes an edit made earlier in a save that then fails', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = bulkSaveDisaster();
    $saved = Injured::factory()->create(['user_id' => $user->id, 'disaster_id' => $disaster->id, 'name' => 'Original']);
    Injured::creating(fn () => throw new RuntimeException('The new row failed'));

    $this->actingAs($user)->postJson(route('injured.store'), ['injured' => [
        ['id' => $saved->id, 'name' => 'Edited'],
        ['name' => 'New'],
    ]])->assertServerError();

    expect($saved->fresh()->name)->toBe('Original')
        ->and(Modification::where('model_id', $saved->id)->where('action', 'updated')->count())->toBe(0);
});

it('refuses integers too big for their column before saving anything', function (string $route, string $permission, string $key, array $row) {
    $user = userWithPermissions($permission);
    bulkSaveDisaster();

    $this->actingAs($user)->postJson(route($route), [$key => [$row]])->assertStatus(422);
})->with([
    'age' => ['injured.store', 'access-injured-form', 'injured', ['name' => 'A', 'age' => 151]],
    'casualty age' => ['casualties.store', 'access-casualty-form', 'casualties', ['name' => 'A', 'age' => 151]],
    'missing age' => ['missing.store', 'access-missing-form', 'missing', ['name' => 'A', 'age' => 151]],
    'families' => ['pre-emptive-reports.store', 'access-pre-emptive-form', 'reports', ['families' => 1000001]],
    'persons' => ['pre-emptive-reports.store', 'access-pre-emptive-form', 'reports', ['outside_persons' => 1000001]],
    'houses' => ['damaged-houses.store', 'access-damaged-houses-form', 'damaged_houses', ['barangay' => null, 'totally' => 1000001]],
    'tourists' => ['affected-tourists.store', 'access-tourist-form', 'affected_tourists', ['local_tourists' => 1000001]],
    'personnel' => ['pre-positioning.store', 'access-pre-positioning-form', 'pre_positionings', ['personnel_deployed' => 1000001]],
]);

it('still accepts large real values', function () {
    $user = userWithPermissions('access-injured-form', 'access-pre-emptive-form');
    bulkSaveDisaster();

    $this->actingAs($user)->postJson(route('injured.store'), ['injured' => [['name' => 'A', 'age' => 120]]])->assertSuccessful();
    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), ['reports' => [['families' => 1000000, 'persons' => 1000000]]])->assertSuccessful();

    expect(PreEmptiveReport::sole()->total_persons)->toBe(1000000);
});

// route, permission, model, request key, field, its old and new value, other values the row needs
dataset('bulk saves with row ids', [
    'injured' => ['injured.store', 'access-injured-form', Injured::class, 'injured', 'name', 'Old', 'New', []],
    'casualties' => ['casualties.store', 'access-casualty-form', Casualty::class, 'casualties', 'name', 'Old', 'New', []],
    'missing' => ['missing.store', 'access-missing-form', Missing::class, 'missing', 'name', 'Old', 'New', []],
    'incidents' => ['incident-monitored.store', 'access-incident-form', IncidentMonitored::class, 'incidents', 'location', 'Old', 'New', []],
    'tourists' => ['affected-tourists.store', 'access-tourist-form', AffectedTourist::class, 'affected_tourists', 'location', 'Old', 'New', []],
    'damaged houses' => ['damaged-houses.store', 'access-damaged-houses-form', DamagedHouseReport::class, 'damaged_houses', 'partially', 1, 9, ['barangay' => null]],
    'pre-positioning' => ['pre-positioning.store', 'access-pre-positioning-form', PrePositioning::class, 'pre_positionings', 'team_units', 'Old', 'New', []],
    'assistance' => ['assistance-extendeds.store', 'access-assistance-extended', AssistanceExtended::class, 'assistances', 'beneficiaries', 'Old', 'New', []],
    'response operations' => ['response-operations-reports.store', 'access-response-operations', ResponseOperation::class, 'responses', 'team_unit', 'Old', 'New', []],
]);

it('stops a non-admin changing a row of an ended disaster through a bulk save', function (string $route, string $permission, string $model, string $key, string $field, mixed $old, mixed $new, array $extra) {
    $owner = userWithPermissions($permission);
    $ended = bulkSaveDisaster('ended');
    bulkSaveDisaster();
    $row = $model::create(['disaster_id' => $ended->id, 'user_id' => $owner->id, $field => $old]);

    $this->actingAs($owner)->postJson(route($route), [$key => [['id' => $row->id, $field => $new] + $extra]])->assertSuccessful();

    expect($row->fresh()->{$field})->toBe($old)
        ->and((int) $row->fresh()->disaster_id)->toBe($ended->id);
})->with('bulk saves with row ids');

it('lets a non-admin change its row of the active disaster through a bulk save', function (string $route, string $permission, string $model, string $key, string $field, mixed $old, mixed $new, array $extra) {
    $owner = userWithPermissions($permission);
    $active = bulkSaveDisaster();
    $row = $model::create(['disaster_id' => $active->id, 'user_id' => $owner->id, $field => $old]);

    $this->actingAs($owner)->postJson(route($route), [$key => [['id' => $row->id, $field => $new] + $extra]])->assertSuccessful();

    expect($row->fresh()->{$field})->toBe($new)
        ->and($model::count())->toBe(1);
})->with('bulk saves with row ids');

it('still stops a bulk save changing another account\'s row', function () {
    $active = bulkSaveDisaster();
    $row = Injured::factory()->create(['user_id' => User::factory()->create()->id, 'disaster_id' => $active->id, 'name' => 'Original']);

    $this->actingAs(userWithPermissions('access-injured-form'))
        ->postJson(route('injured.store'), ['injured' => [['id' => $row->id, 'name' => 'Tampered']]])
        ->assertSuccessful();

    expect($row->fresh()->name)->toBe('Original');
});

it('looks up write access and the disaster once per save, however many rows it carries', function () {
    $user = userWithPermissions('access-injured-form');
    $disaster = bulkSaveDisaster();
    $save = function (int $rowCount) use ($user, $disaster) {
        $rows = Injured::factory()->count($rowCount)->create(['user_id' => $user->id, 'disaster_id' => $disaster->id]);

        return fn () => $this->actingAs($user)->postJson(route('injured.store'), [
            'injured' => $rows->map(fn (Injured $row) => ['id' => $row->id, 'name' => 'Edited '.uniqid()])->all(),
        ])->assertSuccessful();
    };

    expect(queriesOn('user_data_sharing', $save(1)))->toBe(queriesOn('user_data_sharing', $save(5)))
        ->and(queriesOn('disasters', $save(1)))->toBe(queriesOn('disasters', $save(5)));
});

it('does not carry remembered write access over to the next request or another user', function () {
    $owner = userWithPermissions('access-injured-form');
    $writer = userWithPermissions('access-injured-form');
    $stranger = userWithPermissions('access-injured-form');
    DB::table('user_data_sharing')->insert(['user_id' => $owner->id, 'shared_with_user_id' => $writer->id, 'permission_type' => 'write', 'created_at' => now(), 'updated_at' => now()]);
    $first = bulkSaveDisaster('ended');
    $row = Injured::factory()->create(['user_id' => $owner->id, 'disaster_id' => $first->id, 'name' => 'Original']);
    $edit = fn (User $user, string $name) => $this->actingAs($user)->postJson(route('injured.store'), ['injured' => [['id' => $row->id, 'name' => $name]]]);

    // A disaster is running, but not this row's one.
    $running = bulkSaveDisaster();
    $edit($writer, 'Too late')->assertSuccessful();
    expect($row->fresh()->name)->toBe('Original');

    // The row's disaster becomes the active one between requests.
    $running->update(['status' => 'ended']);
    $first->update(['status' => 'active']);
    $edit($writer, 'By writer')->assertSuccessful();
    expect($row->fresh()->name)->toBe('By writer');

    $edit($stranger, 'By stranger')->assertSuccessful();
    expect($row->fresh()->name)->toBe('By writer');

    $edit($owner, 'By owner')->assertSuccessful();
    expect($row->fresh()->name)->toBe('By owner');
});

it('saves added communication services with the same queries however many a row carries', function () {
    $user = userWithPermissions('access-communication-form');
    $disaster = bulkSaveDisaster();
    $services = collect(range(1, 3))->map(fn (int $order) => CommunicationService::create(['name' => "S{$order}", 'category' => 'cellphone', 'order' => $order, 'is_active' => true]));
    $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Up']);
    $save = fn (int $count, string $status) => fn () => $this->actingAs($user)->postJson(route('communication-reports.store'), [
        'communications' => [[
            'id' => $report->id,
            'globe' => 'Up',
            'service_values' => $services->take($count)->map(fn ($service) => ['service_id' => $service->id, 'status' => $status])->all(),
        ]],
    ])->assertOk();

    // Same values as the last save, so nothing but reads differ between the runs.
    $save(3, 'Up')();
    $selectsWithOne = queriesOn('communication_services', $save(1, 'Up'));
    $selectsWithThree = queriesOn('communication_services', $save(3, 'Up'));
    $valuesWithOne = queriesOn('communication_service_values', $save(1, 'Up'));
    $valuesWithThree = queriesOn('communication_service_values', $save(3, 'Up'));

    expect($selectsWithThree)->toBe($selectsWithOne)
        ->and($valuesWithThree)->toBe($valuesWithOne)
        ->and(CommunicationServiceValue::count())->toBe(3);
});

it('updates and adds added communication services on a saved row', function () {
    $user = userWithPermissions('access-communication-form');
    $disaster = bulkSaveDisaster();
    $kept = CommunicationService::create(['name' => 'KEPT', 'category' => 'cellphone', 'order' => 1, 'is_active' => true]);
    $added = CommunicationService::create(['name' => 'ADDED', 'category' => 'radio', 'order' => 2, 'is_active' => false]);
    $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Up']);
    CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $kept->id, 'status' => 'Old']);

    $this->actingAs($user)->postJson(route('communication-reports.store'), ['communications' => [[
        'id' => $report->id,
        'globe' => 'Up',
        'service_values' => [
            ['service_id' => $kept->id, 'status' => 'New'],
            ['service_id' => $added->id, 'status' => 'Added'],
            ['service_id' => $added->id, 'status' => 'Added twice'],
        ],
    ]]])->assertOk();

    $this->actingAs($user)->postJson(route('communication-reports.store'), ['communications' => [[
        'globe' => 'Up',
        'service_values' => [['service_id' => 999999, 'status' => 'No such service']],
    ]]])->assertStatus(422);

    expect(CommunicationServiceValue::orderBy('service_id')->pluck('status', 'service_id')->all())
        ->toBe([$kept->id => 'New', $added->id => 'Added twice']);
});
