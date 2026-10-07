<?php

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function pastDisaster(string $name, string $type, string $endedOn): Typhoon
{
    return Typhoon::create([
        'name' => $name, 'disaster_type' => $type, 'status' => 'ended',
        'started_at' => date('Y-m-d', strtotime("{$endedOn} -2 days")), 'ended_at' => $endedOn,
        'created_by' => userWithRole('admin')->id,
    ]);
}

function barangayAccount(string $name): User
{
    $user = userWithRole('user');
    $user->update(['name' => $name, 'email' => strtolower(str_replace(' ', '', $name)).'@barangay.local']);

    return $user;
}

function officeAccount(): User
{
    $user = userWithRole('user');
    $user->update(['name' => 'CDRRMO', 'email' => 'cdrrmo@tuguegarao.gov.ph']);

    return $user;
}

function deaths(User $user, Typhoon $event, int $count): void
{
    foreach (range(1, $count) as $i) {
        DB::table('casualties')->insert(['user_id' => $user->id, 'disaster_id' => $event->id, 'created_at' => now(), 'updated_at' => now()]);
    }
}

function housesDamaged(User $user, Typhoon $event, int $total): void
{
    DB::table('damaged_house_reports')->insert(['user_id' => $user->id, 'disaster_id' => $event->id, 'total' => $total, 'created_at' => now(), 'updated_at' => now()]);
}

function historyFor($test, array $query = []): array
{
    return $test->actingAs(userWithRole('admin'))
        ->get(route('admin.dashboard', $query))
        ->assertOk()
        ->inertiaProps('history');
}

it('totals every report citywide but ranks only barangays, all of them', function () {
    $rugao = barangayAccount('Rugao');
    $ugac = barangayAccount('Ugac');
    barangayAccount('Caritan');
    $office = officeAccount();
    $flood = pastDisaster('Flood', 'Flood', '2026-01-10');
    deaths($rugao, $flood, 2);
    deaths($ugac, $flood, 5);
    deaths($office, $flood, 1);

    $history = historyFor($this);

    expect($history['summary'])->toMatchArray(['events' => 1, 'affected' => 8])
        ->and(collect($history['ranking'])->pluck('name')->all())->toBe(['Ugac', 'Rugao', 'Caritan'])
        ->and(collect($history['ranking'])->pluck('value')->all())->toBe([5, 2, 0])
        ->and($history['series'][0])->toMatchArray(['name' => 'Flood', 'value' => 8, 'average' => null]);
});

it('narrows the totals and line to one barangay and adds the average barangay', function () {
    $rugao = barangayAccount('Rugao');
    $ugac = barangayAccount('Ugac');
    $first = pastDisaster('First', 'Flood', '2026-01-10');
    $second = pastDisaster('Second', 'Flood', '2026-02-10');
    deaths($rugao, $first, 3);
    deaths($ugac, $first, 1);
    deaths($ugac, $second, 4);

    $history = historyFor($this, ['barangay' => $rugao->id]);

    expect($history['filters']['barangay'])->toBe($rugao->id)
        ->and($history['summary']['affected'])->toBe(3)
        ->and(collect($history['series'])->pluck('value')->all())->toBe([3, 0])
        // Average barangay: (3 + 1) / 2 and (0 + 4) / 2.
        ->and(collect($history['series'])->pluck('average')->all())->toEqual([2, 2]);
});

it('ranks barangays by the chosen measure', function () {
    $rugao = barangayAccount('Rugao');
    $ugac = barangayAccount('Ugac');
    $flood = pastDisaster('Flood', 'Flood', '2026-01-10');
    deaths($rugao, $flood, 9);
    housesDamaged($ugac, $flood, 12);

    $history = historyFor($this, ['metric' => 'housesDamaged']);

    expect($history['filters']['metric'])->toBe('housesDamaged')
        ->and($history['ranking'][0])->toMatchArray(['name' => 'Ugac', 'value' => 12, 'eventsAffected' => 1])
        ->and($history['summary']['housesDamaged'])->toBe(12);
});

it('limits everything to the chosen disaster type', function () {
    $rugao = barangayAccount('Rugao');
    deaths($rugao, pastDisaster('Flood', 'Flood', '2026-01-10'), 6);
    pastDisaster('Quake', 'Earthquake', '2026-02-10');

    $history = historyFor($this, ['type' => 'Earthquake']);

    expect($history['summary'])->toMatchArray(['events' => 1, 'affected' => 0])
        ->and(collect($history['series'])->pluck('name')->all())->toBe(['Quake'])
        ->and($history['options']['types'])->toEqualCanonicalizing(['Flood', 'Earthquake']);
});

it('ignores filters it does not recognise', function () {
    pastDisaster('Flood', 'Flood', '2026-01-10');
    $office = officeAccount();

    $history = historyFor($this, ['type' => 'Nope', 'barangay' => $office->id, 'metric' => 'password']);

    expect($history['filters'])->toBe(['type' => null, 'barangay' => null, 'metric' => 'affected']);
});

it('puts the latest disaster in context against earlier ones of the same type', function () {
    $rugao = barangayAccount('Rugao');
    deaths($rugao, pastDisaster('Storm A', 'Tropical Storm', '2026-01-10'), 2);
    deaths($rugao, pastDisaster('Storm B', 'Tropical Storm', '2026-02-10'), 4);
    deaths($rugao, pastDisaster('Huge Flood', 'Flood', '2026-03-10'), 50);
    $latest = pastDisaster('Storm C', 'Tropical Storm', '2026-04-10');
    deaths($rugao, $latest, 9);
    housesDamaged($rugao, $latest, 0);

    $latest = historyFor($this)['latest'];
    $affected = collect($latest['insights'])->firstWhere('key', 'affected');

    expect($latest['name'])->toBe('Storm C')
        ->and($latest['group'])->toBe(['type' => 'Tropical Storm', 'count' => 3])
        ->and($affected)->toMatchArray(['value' => 9, 'rank' => 1, 'of' => 3, 'comparison' => 'above']);
});

it('compares the latest with all earlier disasters when its type has too few', function () {
    $rugao = barangayAccount('Rugao');
    deaths($rugao, pastDisaster('Flood A', 'Flood', '2026-01-10'), 4);
    deaths($rugao, pastDisaster('Flood B', 'Flood', '2026-02-10'), 4);
    deaths($rugao, pastDisaster('Quake', 'Earthquake', '2026-03-10'), 4);

    $latest = historyFor($this)['latest'];

    expect($latest['group'])->toBe(['type' => null, 'count' => 3])
        ->and(collect($latest['insights'])->firstWhere('key', 'affected')['comparison'])->toBe('about');
});

it('handles having no past disasters yet', function () {
    $history = historyFor($this);

    expect($history['summary']['events'])->toBe(0)
        ->and($history['series'])->toBe([])
        ->and($history['latest'])->toBeNull();
});

it('is not sent while a disaster is active', function () {
    pastDisaster('Past', 'Flood', '2026-01-10');
    Typhoon::create(['name' => 'Now', 'status' => 'active', 'created_by' => userWithRole('admin')->id]);

    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page->component('Admin/Dashboard')->missing('history'));
});

it('is admin only', function () {
    $this->actingAs(userWithRole('user'))->get(route('admin.dashboard'))->assertForbidden();
});
