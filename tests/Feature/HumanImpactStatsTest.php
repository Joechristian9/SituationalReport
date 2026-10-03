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

it('counts reports per hour over the last 24 hours', function () {
    $this->travelTo('2026-09-20 12:30:00');

    $office = User::factory()->create();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $office->id]);

    insertPeople((new \App\Models\Injured)->getTable(), $office->id, $disaster->id, '2026-09-20 12:05:00', 1); // current hour
    insertPeople('casualties', $office->id, $disaster->id, '2026-09-20 10:15:00', 2);
    insertPeople('casualties', $office->id, $disaster->id, '2026-09-19 13:00:00', 1); // first hour of the window
    insertPeople('missing', $office->id, $disaster->id, '2026-09-19 12:59:00', 1); // just outside: ignored

    $hourly = HumanImpactStats::forDisaster($disaster)['hourly'];

    expect($hourly)->toHaveCount(24)
        ->and($hourly[0]['hour'])->toStartWith('2026-09-19T13:00')
        ->and($hourly[0]['dead'])->toBe(1)
        ->and($hourly[21])->toMatchArray(['dead' => 2, 'injured' => 0, 'missing' => 0])
        ->and($hourly[23])->toMatchArray(['dead' => 0, 'injured' => 1, 'missing' => 0])
        ->and(array_sum(array_column($hourly, 'missing')))->toBe(0);
});

it('ranks every barangay over the last 24 hours with its own hourly line', function () {
    $this->travelTo('2026-09-20 12:30:00');

    $accounts = collect(['Alibagu' => 4, 'Bigao' => 3, 'Fugu' => 2, 'Rugao' => 1])
        ->map(fn ($count, $name) => [User::factory()->create(['name' => $name, 'email' => strtolower($name).'@barangay.local']), $count]);
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $accounts['Alibagu'][0]->id]);

    foreach ($accounts as [$user, $count]) {
        insertPeople((new \App\Models\Injured)->getTable(), $user->id, $disaster->id, '2026-09-20 11:10:00', $count);
    }
    insertPeople('casualties', $accounts['Rugao'][0]->id, $disaster->id, '2026-09-18 08:00:00', 9); // older than 24h: ignored

    $places = HumanImpactStats::forDisaster($disaster)['barangays24h'];

    expect(array_column($places['ranking'], 'name'))->toBe(['Alibagu', 'Bigao', 'Fugu', 'Rugao'])
        ->and($places['ranking'][0])->toMatchArray(['injured' => 4, 'dead' => 0, 'total' => 4])
        ->and($places['hourly'])->toHaveCount(24)
        ->and($places['hourly'][22])->toMatchArray([
            $places['ranking'][0]['key'] => 4,
            $places['ranking'][2]['key'] => 2,
            $places['ranking'][3]['key'] => 1,
        ])
        ->and($places['hourly'][0][$places['ranking'][3]['key']])->toBe(0); // zeros kept so lines stay continuous
});

it('returns empty data when there is no disaster', function () {
    $stats = HumanImpactStats::forDisaster(null);

    expect($stats['totals']['total'])->toBe(0)
        ->and($stats['byBarangay'])->toBe([])
        ->and($stats['trend'])->toBe([])
        ->and(HumanImpactStats::recent(null))->toBe([]);
});

it('lists the newest reports across all three types for the live feed', function () {
    $alibagu = User::factory()->create(['name' => 'Alibagu', 'email' => 'alibagu@barangay.local']);
    $office = User::factory()->create(['name' => 'Cdrrmo', 'email' => 'cdrrmo@example.com']);
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $office->id]);
    $older = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $office->id]);

    insertPeople('casualties', $office->id, $disaster->id, '2026-09-20 08:00:00', 1);
    insertPeople((new \App\Models\Injured)->getTable(), $alibagu->id, $disaster->id, '2026-09-20 10:00:00', 2);
    insertPeople('missing', $alibagu->id, $disaster->id, '2026-09-20 09:00:00', 1);
    insertPeople('casualties', $alibagu->id, $older->id, '2026-09-20 11:00:00', 3); // other disaster: ignored

    // Limit applies per type, so each type keeps its own newest reports.
    $feed = HumanImpactStats::recent($disaster, 1);

    expect(array_column($feed, 'type'))->toBe(['injured', 'missing', 'dead'])
        ->and($feed[0]['reporter'])->toBe('Alibagu')
        ->and($feed[0]['office'])->toBeFalse()
        ->and($feed[0]['key'])->toStartWith('injured-')
        ->and($feed[0])->not->toHaveKeys(['sex', 'age']);

    expect(HumanImpactStats::recent($disaster))->toHaveCount(4)
        ->and(collect(HumanImpactStats::recent($disaster))->firstWhere('type', 'dead'))
        ->toMatchArray(['reporter' => 'Cdrrmo', 'office' => true]);
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
            ->has('casualties', 2)
            ->has('recentImpact', 2)
            ->where('recentImpact.0.type', 'dead'));
});
