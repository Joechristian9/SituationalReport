<?php

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\AssistanceExtended;
use App\Models\Casualty;
use App\Models\DamagedHouseReport;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PrePositioning;
use App\Models\ResponseOperation;
use App\Models\Typhoon;
use App\Models\UscDeclaration;
use App\Models\User;
use App\Models\WaterLevel;

function endedDisaster(string $name, string $startedAt): Typhoon
{
    return Typhoon::create(['name' => $name, 'status' => 'ended', 'started_at' => $startedAt, 'created_by' => userWithRole('admin')->id]);
}

$types = [
    'casualties' => ['casualties', 'access-casualty-form', Casualty::class, ['name' => 'Juan Dela Cruz', 'cause_of_death' => 'Drowning']],
    'injured' => ['injured', 'access-injured-form', Injured::class, ['name' => 'Maria Santos', 'diagnosis' => 'Fracture']],
    'missing' => ['missing', 'access-missing-form', Missing::class, ['name' => 'Pedro Reyes', 'cause' => 'Swept away']],
    'tourists' => ['tourists', 'access-tourist-form', AffectedTourist::class, ['location' => 'Beach resort', 'remarks' => 'Stranded']],
    'damaged houses' => ['damaged-houses', 'access-damaged-houses-form', DamagedHouseReport::class, ['barangay' => 'Rugao']],
    'pre-positioning' => ['pre-positioning', 'access-pre-positioning-form', PrePositioning::class, ['team_units' => 'Rescue 1']],
    'response operations' => ['response-operations', 'access-response-operations', ResponseOperation::class, ['team_unit' => 'Alpha']],
    'assistance extended' => ['assistance-extended', 'access-assistance-extended', AssistanceExtended::class, ['beneficiaries' => '12 families']],
    'declaration' => ['declaration', 'access-declaration-form', UscDeclaration::class, ['resolution_number' => 'Res-12']],
    'water level' => ['water-level', 'access-water-level-form', WaterLevel::class, ['gauging_station' => 'Ilagan River']],
];
$typeKeys = array_map(fn ($case) => [$case[0]], $types);

it('lists the account\'s reports grouped by disaster, newest disaster first', function (string $type, string $permission, string $model, array $fields) {
    $user = userWithPermissions($permission);
    $older = endedDisaster('Older Storm', '2026-01-01');
    $newer = endedDisaster('Newer Storm', '2026-06-01');
    $model::create(['disaster_id' => $older->id, 'user_id' => $user->id] + $fields);
    $model::create(['disaster_id' => $newer->id, 'user_id' => $user->id] + $fields);

    $groups = $this->actingAs($user)->getJson(route('api.report-history', $type))->assertOk()->json('data');

    expect($groups)->toBeList()->toHaveCount(2)
        ->and(array_column(array_column($groups, 'typhoon'), 'name'))->toBe(['Newer Storm', 'Older Storm']);
    foreach ($fields as $field => $value) {
        expect($groups[0]['reports'][0][$field])->toBe($value);
    }
    expect(array_keys($groups[0]['reports'][0]['user']))->toEqualCanonicalizing(['id', 'name']);
})->with($types);

it('refuses the history to an account without that form\'s permission', function (string $type) {
    $user = userWithPermissions('access-weather-form');

    $this->actingAs($user)->getJson(route('api.report-history', $type))->assertForbidden();
    $this->actingAs($user)->get(route('report-history.show', $type))->assertForbidden();
})->with($typeKeys);

it('opens the history page for an account with the permission', function (string $type, string $permission) {
    $this->actingAs(userWithPermissions($permission))
        ->get(route('report-history.show', $type))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('ReportHistory/Index')->where('type', $type));
})->with($types);

it('lets an admin read every history', function (string $type) {
    $this->actingAs(userWithRole('admin'))->getJson(route('api.report-history', $type))->assertOk();
})->with($typeKeys);

it('only lists reports from accounts the user may read', function () {
    $user = userWithPermissions('access-casualty-form');
    $stranger = userWithRole('user');
    $disaster = endedDisaster('Storm', '2026-06-01');
    Casualty::create(['disaster_id' => $disaster->id, 'user_id' => $stranger->id, 'name' => 'Hidden']);

    $this->actingAs($user)->getJson(route('api.report-history', 'casualties'))->assertOk()->assertJsonPath('data', []);
});

it('does not serve a history type that does not exist', function () {
    $this->actingAs(userWithRole('admin'))->getJson('/api/report-history/unknown')->assertNotFound();
});

it('refuses the history to an account without a role', function () {
    $this->actingAs(User::factory()->create())
        ->getJson(route('api.report-history', 'casualties'))
        ->assertForbidden();
});

it('serves the shared agriculture history with only the columns it shows', function () {
    $user = userWithPermissions('access-agriculture-form');
    $disaster = endedDisaster('Storm', '2026-06-01');
    AgricultureReport::create(['disaster_id' => $disaster->id, 'user_id' => userWithRole('user')->id, 'crops_affected' => 'Rice']);

    $groups = $this->actingAs($user)->getJson(route('api.agriculture-history'))->assertOk()->json('data');

    expect($groups[0]['reports'][0]['crops_affected'])->toBe('Rice')
        ->and(array_keys($groups[0]['reports'][0]))->not->toContain('updated_by');
});
