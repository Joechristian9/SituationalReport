<?php

use App\Models\IncidentMonitored;
use App\Models\Typhoon;
use App\Models\User;

$historyRoutes = [
    'api.disaster.active', 'api.electricity-history', 'api.water-service-history', 'api.weather-history',
    'api.communication-history', 'api.pre-emptive-history', 'api.incident-history', 'api.road-history',
    'api.bridge-history',
];

it('refuses report data to an account without a role', function (string $route) {
    $this->actingAs(User::factory()->create())->getJson(route($route))->assertForbidden();
})->with($historyRoutes);

it('serves report history to barangay users', function (string $route) {
    $this->actingAs(userWithRole('user'))->getJson(route($route))->assertOk();
})->with($historyRoutes);

it('exposes only the reporter\'s id and name in incident history', function () {
    $reporter = userWithRole('user');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $reporter->id]);
    IncidentMonitored::create(['user_id' => $reporter->id, 'disaster_id' => $disaster->id]);

    $user = $this->actingAs($reporter)
        ->getJson(route('api.incident-history'))
        ->assertOk()
        ->json('0.reports.0.user');

    expect(array_keys($user))->toEqualCanonicalizing(['id', 'name']);
});

it('does not show incident history to accounts that cannot read the reporter\'s data', function () {
    $reporter = userWithRole('user');
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $reporter->id]);
    IncidentMonitored::create(['user_id' => $reporter->id, 'disaster_id' => $disaster->id]);

    $this->actingAs(userWithRole('user'))
        ->getJson(route('api.incident-history'))
        ->assertOk()
        ->assertExactJson([]);
});

it('sends baseline security headers', function () {
    $this->get('/login')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});
