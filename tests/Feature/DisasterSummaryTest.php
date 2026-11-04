<?php

use App\Models\Casualty;
use App\Models\Injured;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Services\DisasterSummary;
use Illuminate\Support\Facades\DB;

function summaryDisaster(string $name = 'Typhoon Kristine'): Typhoon
{
    return Typhoon::create([
        'name' => $name, 'disaster_type' => 'Typhoon', 'status' => 'ended',
        'started_at' => now()->subDays(3), 'ended_at' => now(), 'created_by' => userWithRole('admin')->id,
    ]);
}

it('gives an admin the impact, evacuation and reporting totals of one disaster', function () {
    $disaster = summaryDisaster();
    $other = summaryDisaster('Flood Event');
    $office = userWithRole('user');

    Casualty::factory()->count(2)->create(['disaster_id' => $disaster->id, 'user_id' => $office->id]);
    Injured::factory()->create(['disaster_id' => $disaster->id, 'user_id' => $office->id]);
    PreEmptiveReport::factory()->create([
        'disaster_id' => $disaster->id, 'user_id' => $office->id, 'total_families' => 10, 'total_persons' => 40,
    ]);
    // Another disaster's reports must not be counted.
    Casualty::factory()->create(['disaster_id' => $other->id, 'user_id' => $office->id]);

    $this->actingAs(userWithRole('admin'))
        ->getJson(route('disasters.summary', $disaster))
        ->assertOk()
        ->assertExactJson([
            'impact' => ['dead' => 2, 'injured' => 1, 'missing' => 0, 'housesDamaged' => 0],
            'evacuation' => ['families' => 10, 'persons' => 40],
            'reports' => ['total' => 4, 'accounts' => 1],
        ]);
});

it('returns zeros for a disaster nobody reported on', function () {
    $this->actingAs(userWithRole('admin'))
        ->getJson(route('disasters.summary', summaryDisaster()))
        ->assertOk()
        ->assertJsonPath('impact.dead', 0)
        ->assertJsonPath('reports.total', 0)
        ->assertJsonPath('reports.accounts', 0);
});

it('does not give field users the disaster summary', function () {
    $this->actingAs(userWithRole('user'))
        ->getJson(route('disasters.summary', summaryDisaster()))
        ->assertForbidden();
});

it('requires a signed-in user', function () {
    $this->getJson(route('disasters.summary', summaryDisaster()))->assertUnauthorized();
});

it('returns 404 for an unknown disaster', function () {
    $this->actingAs(userWithRole('admin'))
        ->getJson(route('disasters.summary', 999999))
        ->assertNotFound();
});

it('adds up every report table in a few queries, counting rows without an account but not as accounts', function () {
    $disaster = summaryDisaster();
    $first = userWithRole('user');
    $second = userWithRole('user');
    $row = fn (string $table, ?int $userId, array $values = []) => DB::table($table)->insert($values + ['disaster_id' => $disaster->id, 'user_id' => $userId, 'created_at' => now(), 'updated_at' => now()]);

    $row('casualties', $first->id);
    $row('casualties', $second->id);
    $row('injureds', $first->id);
    $row('injureds', $first->id);
    $row('missing', $second->id);
    $row('suspension_of_works', null);
    $row('damaged_house_reports', $first->id, ['total' => 7]);
    $row('pre_emptive_reports', $first->id, ['total_families' => 2, 'total_persons' => 9]);
    DB::table('agriculture_reports')->insert(['disaster_id' => $disaster->id, 'crops_affected' => 'Rice', 'created_at' => now(), 'updated_at' => now()]);

    DB::flushQueryLog();
    DB::enableQueryLog();
    $summary = DisasterSummary::for($disaster);
    $queries = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($summary)->toBe([
        'impact' => ['dead' => 2, 'injured' => 2, 'missing' => 1, 'housesDamaged' => 7],
        'evacuation' => ['families' => 2, 'persons' => 9],
        'reports' => ['total' => 9, 'accounts' => 2],
    ])->and($queries)->toBeLessThanOrEqual(3);
});
