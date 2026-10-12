<?php

use App\Models\Casualty;
use App\Models\Injured;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;

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
