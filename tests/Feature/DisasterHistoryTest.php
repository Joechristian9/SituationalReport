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

/** Deaths filed by $user; a barangay account files them under itself, an office under no barangay. */
function deaths(User $user, Typhoon $event, int $count): void
{
    $barangay = str_ends_with($user->email, '@barangay.local') ? $user->name : null;
    foreach (range(1, $count) as $i) {
        DB::table('casualties')->insert(['user_id' => $user->id, 'disaster_id' => $event->id, 'barangay' => $barangay, 'created_at' => now(), 'updated_at' => now()]);
    }
}

/** A damaged-house row, by default from the barangay itself and naming it. */
function housesDamaged(User $user, Typhoon $event, int $total, ?string $barangay = null): void
{
    DB::table('damaged_house_reports')->insert(['user_id' => $user->id, 'disaster_id' => $event->id, 'barangay' => $barangay ?? $user->name, 'total' => $total, 'created_at' => now(), 'updated_at' => now()]);
}

function historyFor($test, array $query = []): array
{
    return $test->actingAs(userWithRole('admin'))
        ->get(route('dashboard', $query))
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

    $history = historyFor($this, ['metric' => 'affected']);

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

    $history = historyFor($this, ['barangay' => $rugao->id, 'metric' => 'affected']);

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

    $history = historyFor($this, ['type' => 'Nope', 'barangay' => $office->id, 'metric' => 'password', 'event' => 999]);

    expect($history['filters'])->toBe(['type' => null, 'barangay' => null, 'metric' => 'evacuatedPersons', 'event' => null]);
});

it('puts the latest disaster in context against earlier ones of the same type', function () {
    $rugao = barangayAccount('Rugao');
    deaths($rugao, pastDisaster('Storm A', 'Tropical Storm', '2026-01-10'), 2);
    deaths($rugao, pastDisaster('Storm B', 'Tropical Storm', '2026-02-10'), 4);
    deaths($rugao, pastDisaster('Huge Flood', 'Flood', '2026-03-10'), 50);
    $latest = pastDisaster('Storm C', 'Tropical Storm', '2026-04-10');
    deaths($rugao, $latest, 9);
    housesDamaged($rugao, $latest, 0);

    $latest = historyFor($this)['focus'];
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

    $latest = historyFor($this)['focus'];

    expect($latest['group'])->toBe(['type' => null, 'count' => 3])
        ->and(collect($latest['insights'])->firstWhere('key', 'affected')['comparison'])->toBe('about');
});

it('compares a chosen disaster with the others of its type, later ones included', function () {
    $rugao = barangayAccount('Rugao');
    $first = pastDisaster('Storm A', 'Tropical Storm', '2026-01-10');
    housesDamaged($rugao, $first, 30);
    housesDamaged($rugao, pastDisaster('Storm B', 'Tropical Storm', '2026-02-10'), 10);
    housesDamaged($rugao, pastDisaster('Storm C', 'Tropical Storm', '2026-03-10'), 10);

    $history = historyFor($this, ['event' => $first->id]);
    $houses = collect($history['focus']['insights'])->firstWhere('key', 'housesDamaged');

    expect($history['filters']['event'])->toBe($first->id)
        ->and($history['focus'])->toMatchArray(['id' => $first->id, 'name' => 'Storm A', 'isLatest' => false])
        ->and($history['focus']['group'])->toBe(['type' => 'Tropical Storm', 'count' => 3])
        // 30 against the others' average of 10: three times as many, so +200%.
        ->and($houses)->toMatchArray(['value' => 30, 'rank' => 1, 'of' => 3, 'average' => 10, 'comparison' => 'above', 'change' => 200]);
});

it('falls back to the latest disaster when the chosen one is outside the type filter', function () {
    $flood = pastDisaster('Flood', 'Flood', '2026-01-10');
    pastDisaster('Quake', 'Earthquake', '2026-02-10');

    $history = historyFor($this, ['type' => 'Earthquake', 'event' => $flood->id]);

    expect($history['filters']['event'])->toBeNull()
        ->and($history['focus'])->toMatchArray(['name' => 'Quake', 'isLatest' => true]);
});

it('averages the chosen measure per disaster type, whatever type is filtered', function () {
    $rugao = barangayAccount('Rugao');
    housesDamaged($rugao, pastDisaster('Flood A', 'Flood', '2026-01-10'), 10);
    housesDamaged($rugao, pastDisaster('Flood B', 'Flood', '2026-02-10'), 30);
    housesDamaged($rugao, pastDisaster('Quake', 'Earthquake', '2026-03-10'), 5);

    $byType = historyFor($this, ['metric' => 'housesDamaged', 'type' => 'Earthquake'])['byType'];

    expect($byType)->toEqual([
        ['type' => 'Flood', 'events' => 2, 'average' => 20, 'total' => 40],
        ['type' => 'Earthquake', 'events' => 1, 'average' => 5, 'total' => 5],
    ]);
});

it('credits damaged houses to the barangay named on the report, not the office that entered it', function () {
    $alibagu = barangayAccount('Alibagu');
    barangayAccount('Ugac');
    $office = officeAccount();
    $flood = pastDisaster('Flood', 'Flood', '2026-01-10');
    housesDamaged($office, $flood, 18, 'Alibagu');
    housesDamaged($office, $flood, 2, '  alibagu ');
    housesDamaged($office, $flood, 7, 'Marana');
    housesDamaged($office, $flood, 3, '');

    $history = historyFor($this, ['metric' => 'housesDamaged']);

    expect($history['summary']['housesDamaged'])->toBe(30)
        ->and($history['ranking'][0])->toMatchArray(['id' => $alibagu->id, 'value' => 20])
        ->and($history['unassigned'])->toBe(['total' => 10, 'names' => ['Marana'], 'withoutName' => true])
        ->and(historyFor($this, ['metric' => 'housesDamaged', 'barangay' => $alibagu->id])['summary']['housesDamaged'])->toBe(20);
});

it('counts casualties filed under no barangay as not placed in one', function () {
    $rugao = barangayAccount('Rugao');
    $flood = pastDisaster('Flood', 'Flood', '2026-01-10');
    deaths($rugao, $flood, 2);
    deaths(officeAccount(), $flood, 3);

    expect(historyFor($this, ['metric' => 'dead'])['unassigned'])->toBe(['total' => 3, 'names' => [], 'withoutName' => true]);
});

it('handles having no past disasters yet', function () {
    $history = historyFor($this);

    expect($history['summary']['events'])->toBe(0)
        ->and($history['series'])->toBe([])
        ->and($history['focus'])->toBeNull()
        ->and($history['byType'])->toBe([]);
});

it('is not sent while a disaster is active', function () {
    pastDisaster('Past', 'Flood', '2026-01-10');
    Typhoon::create(['name' => 'Now', 'status' => 'active', 'created_by' => userWithRole('admin')->id]);

    $this->actingAs(userWithRole('admin'))
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->component('Admin/Dashboard')->missing('history'));
});

it('is admin only', function () {
    $this->actingAs(userWithRole('user'))
        ->get(route('dashboard'))
        ->assertRedirect(route('situation-reports.index'));
});
