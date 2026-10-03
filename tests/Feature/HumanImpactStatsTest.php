<?php

use App\Models\Typhoon;
use App\Models\User;
use App\Services\HumanImpactStats;
use Illuminate\Support\Facades\DB;

function insertPeople(string $table, int $userId, int $disasterId, string $createdAt, int $count): void
{
    for ($i = 0; $i < $count; $i++) {
        DB::table($table)->insert([
            'name' => "Person {$i}",
            'user_id' => $userId,
            'disaster_id' => $disasterId,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }
}

it('aggregates dead, injured and missing for one disaster from the database', function () {
    $this->travelTo('2026-09-20 12:00:00');

    $alibagu = User::factory()->create(['name' => 'Alibagu', 'email' => 'alibagu@barangay.local']);
    $office = User::factory()->create(['name' => 'Cdrrmo', 'email' => 'cdrrmo@example.com']);
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $office->id]);
    $older = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $office->id]);

    insertPeople('casualties', $alibagu->id, $disaster->id, '2026-09-18 08:00:00', 2);
    insertPeople('casualties', $office->id, $disaster->id, '2026-09-20 09:00:00', 1);
    insertPeople((new \App\Models\Injured)->getTable(), $alibagu->id, $disaster->id, '2026-09-20 10:00:00', 3);
    insertPeople('missing', $office->id, $disaster->id, '2026-09-18 11:00:00', 1);
    insertPeople('casualties', $alibagu->id, $older->id, '2026-09-19 08:00:00', 5); // other disaster: ignored

    $stats = HumanImpactStats::forDisaster($disaster);

    expect($stats['totals'])->toBe(['dead' => 3, 'injured' => 3, 'missing' => 1, 'total' => 7])
        ->and($stats['last24h'])->toBe(['dead' => 1, 'injured' => 3, 'missing' => 0]);

    expect($stats['byBarangay'])->toBe([
        ['name' => 'Alibagu', 'office' => false, 'dead' => 2, 'injured' => 3, 'missing' => 0, 'total' => 5],
        ['name' => 'Cdrrmo', 'office' => true, 'dead' => 1, 'injured' => 0, 'missing' => 1, 'total' => 2],
    ]);

    // Continuous days from first to last report, gaps filled with zero.
    expect($stats['trend'])->toBe([
        ['date' => '2026-09-18', 'dead' => 2, 'injured' => 0, 'missing' => 1],
        ['date' => '2026-09-19', 'dead' => 0, 'injured' => 0, 'missing' => 0],
        ['date' => '2026-09-20', 'dead' => 1, 'injured' => 3, 'missing' => 0],
    ]);
});

it('returns empty data when there is no disaster', function () {
    $stats = HumanImpactStats::forDisaster(null);

    expect($stats['totals']['total'])->toBe(0)
        ->and($stats['byBarangay'])->toBe([])
        ->and($stats['trend'])->toBe([]);
});

it('sends the summary to the admin dashboard', function () {
    $admin = User::factory()->create();
    \Spatie\Permission\Models\Role::findOrCreate('admin');
    $admin->assignRole('admin');
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $admin->id]);
    insertPeople('casualties', $admin->id, $disaster->id, now()->toDateTimeString(), 2);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('impactSummary.totals.dead', 2)
            ->has('casualties', 2));
});
