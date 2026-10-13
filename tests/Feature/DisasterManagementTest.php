<?php

use App\Models\Typhoon;
use Inertia\Testing\AssertableInertia as Assert;

it('sends the disaster list newest first with only the reporters\' names', function () {
    $admin = userWithRole('admin');
    Typhoon::create(['name' => 'Old Storm', 'disaster_type' => 'Typhoon', 'status' => 'ended', 'started_at' => '2026-08-01', 'created_by' => $admin->id, 'ended_by' => $admin->id]);
    Typhoon::create(['name' => 'Current Flood', 'disaster_type' => 'Flood', 'status' => 'paused', 'started_at' => '2026-10-01', 'created_by' => $admin->id]);

    $this->actingAs($admin)
        ->get(route('disasters.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/DisasterManagement')
            ->has('typhoons', 2)
            ->where('typhoons.0.name', 'Current Flood')
            ->where('typhoons.1.ender.name', $admin->name)
            ->missing('typhoons.0.creator.email')
            ->missing('activeTyphoon')
            ->missing('statusCounts'));
});

it('reports the current disaster, paused or active, from one lookup', function (?string $status, bool $has, bool $paused) {
    $admin = userWithRole('admin');
    if ($status) {
        Typhoon::create(['name' => 'Storm', 'status' => $status, 'created_by' => $admin->id]);
    }

    $this->actingAs(userWithRole('user'))
        ->getJson(route('api.disaster.active'))
        ->assertOk()
        ->assertJsonPath('hasActiveTyphoon', $has)
        ->assertJsonPath('isPaused', $paused)
        ->assertJsonPath('currentTyphoon.name', $has ? 'Storm' : null);
})->with([
    'active' => ['active', true, false],
    'paused' => ['paused', true, true],
    'ended' => ['ended', false, false],
    'none' => [null, false, false],
]);
