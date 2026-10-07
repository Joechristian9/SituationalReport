<?php

use App\Models\Injured;
use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function disasterWithStatus(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Storm '.uniqid(), 'status' => $status, 'created_by' => User::factory()->create()->id]);
}

function injuredFor(User $owner, Typhoon $disaster): Injured
{
    return Injured::factory()->create(['user_id' => $owner->id, 'disaster_id' => $disaster->id, 'name' => 'Original']);
}

function shareWith(User $owner, User $grantee, string $type): void
{
    DB::table('user_data_sharing')->insert([
        'user_id' => $owner->id, 'shared_with_user_id' => $grantee->id, 'permission_type' => $type,
        'created_at' => now(), 'updated_at' => now(),
    ]);
}

it('lets a barangay edit its own record', function () {
    $owner = userWithRole('user');
    $record = injuredFor($owner, disasterWithStatus());

    $this->actingAs($owner)->patch(route('injured.update', $record), ['name' => 'Edited'])->assertRedirect();

    expect($record->fresh()->name)->toBe('Edited');
});

it('stops a barangay editing another barangay\'s record', function () {
    $record = injuredFor(userWithRole('user'), disasterWithStatus());

    $this->actingAs(userWithRole('user'))->patch(route('injured.update', $record), ['name' => 'Tampered'])->assertForbidden();

    expect($record->fresh()->name)->toBe('Original');
});

it('allows edits through a write share but not a read share', function () {
    $owner = userWithRole('user');
    $writer = userWithRole('user');
    $reader = userWithRole('user');
    shareWith($owner, $writer, 'write');
    shareWith($owner, $reader, 'read');
    $record = injuredFor($owner, disasterWithStatus());

    $this->actingAs($reader)->patch(route('injured.update', $record), ['name' => 'By reader'])->assertForbidden();
    $this->actingAs($writer)->patch(route('injured.update', $record), ['name' => 'By writer'])->assertRedirect();

    expect($record->fresh()->name)->toBe('By writer');
});

it('stops a barangay editing its record from a disaster that has ended', function () {
    $owner = userWithRole('user');
    $old = injuredFor($owner, disasterWithStatus('ended'));
    disasterWithStatus('active');

    $this->actingAs($owner)->patch(route('injured.update', $old), ['name' => 'Rewritten'])->assertForbidden();

    expect($old->fresh()->name)->toBe('Original');
});

it('lets an admin edit any record', function () {
    $record = injuredFor(userWithRole('user'), disasterWithStatus());

    $this->actingAs(userWithRole('admin'))->patch(route('injured.update', $record), ['name' => 'Corrected'])->assertRedirect();

    expect($record->fresh()->name)->toBe('Corrected');
});

it('saves nothing when no disaster is active', function () {
    $owner = userWithRole('user');
    $record = injuredFor($owner, disasterWithStatus('ended'));

    $this->actingAs($owner)->patch(route('injured.update', $record), ['name' => 'Late edit']);

    expect($record->fresh()->name)->toBe('Original');
});

it('guards every report update route', function (string $controller) {
    $source = file_get_contents(app_path("Http/Controllers/{$controller}.php"));

    expect($source)->toMatch('/public function update\([^)]*\)\s*\{\s*\$this->authorizeRecordWrite\(/');
})->with([
    'AffectedTouristController', 'AssistanceExtendedController', 'AssistanceProvidedLguController',
    'CasualtyController', 'DamagedHouseReportController', 'UscDeclarationController',
    'IncidentMonitoredController', 'InjuredController', 'MissingController', 'PrePositioningController',
]);
