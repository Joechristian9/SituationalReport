<?php

use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;

function activeDisaster(): Typhoon
{
    return Typhoon::create([
        'name' => 'Test Storm',
        'status' => 'active',
        'created_by' => userWithRole('admin')->id,
    ]);
}

it('returns a user\'s records for a report table on the form submission page', function () {
    $disaster = activeDisaster();
    $barangay = userWithRole('user');
    $other = userWithRole('user');

    DB::table('casualties')->insert([
        ['name' => 'Mine', 'user_id' => $barangay->id, 'disaster_id' => $disaster->id, 'created_at' => now(), 'updated_at' => now()],
        ['name' => 'Not mine', 'user_id' => $other->id, 'disaster_id' => $disaster->id, 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->actingAs(userWithRole('admin'))
        ->getJson(route('admin.user-form-data', ['userId' => $barangay->id, 'table' => 'casualties', 'form_name' => 'Casualties']))
        ->assertOk()
        ->assertJsonPath('form_name', 'Casualties')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Mine');
});

it('refuses to read tables that are not report forms', function (string $table) {
    activeDisaster();
    $barangay = userWithRole('user');

    $this->actingAs(userWithRole('admin'))
        ->getJson(route('admin.user-form-data', ['userId' => $barangay->id, 'table' => $table]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('table')
        ->assertJsonMissingPath('data');
})->with(['users', 'audit_logs', 'sessions', 'casualties; drop table users']);

it('requires a table', function () {
    activeDisaster();

    $this->actingAs(userWithRole('admin'))
        ->getJson(route('admin.user-form-data', ['userId' => userWithRole('user')->id]))
        ->assertJsonValidationErrors('table');
});

it('is admin only', function () {
    activeDisaster();
    $barangay = userWithRole('user');

    $this->actingAs($barangay)
        ->getJson(route('admin.user-form-data', ['userId' => $barangay->id, 'table' => 'casualties']))
        ->assertForbidden();
});

it('returns not found when no disaster is active', function () {
    $this->actingAs(userWithRole('admin'))
        ->getJson(route('admin.user-form-data', ['userId' => userWithRole('user')->id, 'table' => 'casualties']))
        ->assertNotFound();
});
