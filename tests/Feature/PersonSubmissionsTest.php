<?php

use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

dataset('person pages', [
    'casualties' => ['admin.casualties.submissions', 'casualties', 'casualties', 'cause_of_death'],
    'injured' => ['admin.injured.submissions', 'injureds', 'injured', 'diagnosis'],
    'missing' => ['admin.missing.submissions', 'missing', 'missing', 'cause'],
]);

function personRow(string $table, int $disasterId, int $userId, string $name, string $createdAt, array $extra = []): void
{
    DB::table($table)->insert(['name' => $name, 'disaster_id' => $disasterId, 'user_id' => $userId, 'created_at' => $createdAt, 'updated_at' => $createdAt] + $extra);
}

it('lists only the current disaster, even while it is paused', function (string $route, string $table, string $prop) {
    $admin = userWithRole('admin');
    $reporter = userWithRole('user');
    $old = Typhoon::create(['name' => 'Old', 'status' => 'ended', 'created_by' => $admin->id]);
    $current = Typhoon::create(['name' => 'Current', 'status' => 'paused', 'created_by' => $admin->id]);
    personRow($table, $old->id, $reporter->id, 'From the old disaster', '2026-09-01 08:00:00');
    personRow($table, $current->id, $reporter->id, 'From the current one', '2026-10-01 08:00:00');

    $this->actingAs($admin)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has("{$prop}.data", 1)
            ->where("{$prop}.data.0.name", 'From the current one')
            ->where('stats.total', 1)
            ->where('disaster.status', 'paused'));
})->with('person pages');

it('filters by search, account and an inclusive date range', function (string $route, string $table, string $prop, string $detail) {
    $admin = userWithRole('admin');
    $one = userWithRole('user');
    $two = userWithRole('user');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    personRow($table, $disaster->id, $one->id, 'Juan', '2026-10-01 23:30:00', [$detail => 'Flood']);
    personRow($table, $disaster->id, $one->id, 'Maria', '2026-10-02 08:00:00', [$detail => 'Landslide']);
    personRow($table, $disaster->id, $two->id, 'Pedro', '2026-10-03 08:00:00', [$detail => 'Flood']);

    $names = fn (array $query) => array_column($this->actingAs($admin)->get(route($route, $query))->viewData('page')['props'][$prop]['data'], 'name');

    expect($names(['search' => 'flood']))->toEqualCanonicalizing(['Juan', 'Pedro'])
        ->and($names(['user_id' => $one->id]))->toEqualCanonicalizing(['Juan', 'Maria'])
        ->and($names(['date_from' => '2026-10-01', 'date_to' => '2026-10-01']))->toBe(['Juan'])
        ->and($names(['search' => '100%']))->toBe([]);
})->with('person pages');

it('offers only the accounts that submitted for the filter', function (string $route, string $table) {
    $admin = userWithRole('admin');
    $reporter = userWithRole('user');
    userWithRole('user'); // never submitted
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    personRow($table, $disaster->id, $reporter->id, 'Juan', '2026-10-01 08:00:00');

    $this->actingAs($admin)
        ->get(route($route))
        ->assertInertia(fn (Assert $page) => $page
            ->has('users', 1)
            ->where('users.0.id', $reporter->id));
})->with('person pages');

it('keeps the submissions pages for admins', function (string $route) {
    $this->actingAs(userWithRole('user'))->get(route($route))->assertForbidden();
})->with('person pages');
