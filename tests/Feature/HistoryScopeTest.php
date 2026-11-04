<?php

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\Bridge;
use App\Models\Communication;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
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

function historyScopeDisaster(): Typhoon
{
    return Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => User::factory()->create()->id]);
}

/** A row saved by $owner, so its value lands in the edit history. */
function rowWithLoggedValue(string $model, string $field, User $owner, Typhoon $disaster, array $extra = []): void
{
    test()->actingAs($owner);
    $model::create(['disaster_id' => $disaster->id, 'user_id' => $owner->id, $field => 'Secret Value'] + $extra);
}

function shareRowsWith(User $owner, User $grantee, string $type = 'read'): void
{
    DB::table('user_data_sharing')->insert(['user_id' => $owner->id, 'shared_with_user_id' => $grantee->id, 'permission_type' => $type, 'created_at' => now(), 'updated_at' => now()]);
}

it('limits a form\'s edit history to the rows that form shows the account', function (string $route, string $permission, string $model, string $field) {
    $disaster = historyScopeDisaster();
    $owner = userWithPermissions($permission);
    $stranger = userWithPermissions($permission);
    $reader = userWithPermissions($permission);
    shareRowsWith($owner, $reader);
    rowWithLoggedValue($model, $field, $owner, $disaster);
    $history = fn (User $user) => $this->actingAs($user)->getJson(route($route))->assertOk();

    $history($stranger)->assertDontSee('Secret Value');
    $history($owner)->assertSee('Secret Value');
    $history($reader)->assertSee('Secret Value');
    $history(userWithRole('admin'))->assertSee('Secret Value');
})->with([
    'weather' => ['modifications.weather', 'access-weather-form', WeatherReport::class, 'sky_condition'],
    'water level' => ['modifications.water-level', 'access-water-level-form', WaterLevel::class, 'gauging_station'],
    'electricity' => ['modifications.electricity', 'access-electricity-form', ElectricityService::class, 'status'],
    'communication' => ['modifications.communication', 'access-communication-form', Communication::class, 'globe'],
    'road' => ['modifications.road', 'access-road-form', Road::class, 'name_of_road'],
    'bridge' => ['modifications.bridge', 'access-bridge-form', Bridge::class, 'name_of_bridge'],
    'incidents' => ['modifications.incident-monitored', 'access-incident-form', IncidentMonitored::class, 'location'],
    'tourists' => ['modifications.affected-tourists', 'access-tourist-form', AffectedTourist::class, 'location'],
    'damaged houses' => ['modifications.damaged-houses', 'access-damaged-houses-form', DamagedHouseReport::class, 'barangay'],
    'class suspensions' => ['modifications.suspension-classes', 'access-suspension-classes-form', SuspensionOfClass::class, 'level'],
    'work suspensions' => ['modifications.suspension-work', 'access-suspension-work-form', SuspensionOfWork::class, 'remarks'],
    'response operations' => ['modifications.response-operations', 'access-response-operations', ResponseOperation::class, 'team_unit'],
    'assistance' => ['modifications.assistance-extended', 'access-assistance-extended', AssistanceExtended::class, 'beneficiaries'],
]);

it('keeps pre-positioning history to the account\'s own rows, as its page lists only those', function () {
    $disaster = historyScopeDisaster();
    $owner = userWithPermissions('access-pre-positioning-form');
    $reader = userWithPermissions('access-pre-positioning-form');
    shareRowsWith($owner, $reader);
    rowWithLoggedValue(PrePositioning::class, 'team_units', $owner, $disaster);
    $history = fn (User $user) => $this->actingAs($user)->getJson(route('modifications.pre-positioning'))->assertOk();

    $history($reader)->assertDontSee('Secret Value');
    $history($owner)->assertSee('Secret Value');
    $history(userWithRole('admin'))->assertSee('Secret Value');
});

it('leaves the history of shared lists open to every holder of the form', function (string $route, string $permission, string $model, string $field) {
    $disaster = historyScopeDisaster();
    $owner = userWithPermissions($permission);
    rowWithLoggedValue($model, $field, $owner, $disaster);

    $this->actingAs(userWithPermissions($permission))->getJson(route($route))->assertOk()->assertSee('Secret Value');
})->with([
    'water service' => ['modifications.water-service', 'access-water-service-form', WaterService::class, 'status'],
    'declarations' => ['modifications.usc-declaration', 'access-declaration-form', UscDeclaration::class, 'declared_by'],
    'agriculture' => ['modifications.agriculture', 'access-agriculture-form', AgricultureReport::class, 'crops_affected'],
    'pre-emptive, for an office' => ['modifications.pre-emptive', 'access-pre-emptive-form', PreEmptiveReport::class, 'evacuation_center'],
]);

it('lets admins through a history route even when its permission row is missing', function (string $route) {
    historyScopeDisaster();

    $this->actingAs(userWithRole('admin'))->getJson(route($route))->assertOk();
    $this->actingAs(userWithRole('user'))->getJson(route($route))->assertForbidden();
})->with([
    'modifications.water-level', 'modifications.electricity', 'modifications.water-service',
    'modifications.communication', 'modifications.road', 'modifications.bridge',
]);
