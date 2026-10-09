<?php

use App\Models\Injured;
use App\Models\Modification;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WeatherReport;
use App\Providers\AppServiceProvider;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

afterEach(fn () => TrustProxies::flushState());

function editOf(User $user, string $type, int $id): Modification
{
    return Modification::create([
        'user_id' => $user->id, 'model_type' => $type, 'model_id' => $id, 'action' => 'updated',
        'changed_fields' => ['name' => ['old' => 'Before', 'new' => 'After', 'user' => ['id' => $user->id, 'name' => $user->name]]],
    ]);
}

/* ---------------- Edit history only covers the active disaster ---------------- */

it('returns edit history for the active disaster only', function () {
    $user = userWithPermissions('access-injured-form');
    $old = Typhoon::create(['name' => 'Old', 'status' => 'ended', 'created_by' => $user->id]);
    $active = Typhoon::create(['name' => 'Now', 'status' => 'active', 'created_by' => $user->id]);
    $past = Injured::factory()->create(['user_id' => $user->id, 'disaster_id' => $old->id]);
    $current = Injured::factory()->create(['user_id' => $user->id, 'disaster_id' => $active->id]);
    editOf($user, 'Injured', $past->id);
    editOf($user, 'Injured', $current->id);

    $history = $this->actingAs($user)->getJson(route('modifications.injured'))->assertOk()->json('history');

    expect(array_keys($history))->toBe(["{$current->id}_name"]);
});

it('keeps the situation overview history to the active disaster too', function () {
    $user = userWithPermissions('access-weather-form');
    $old = Typhoon::create(['name' => 'Old', 'status' => 'ended', 'created_by' => $user->id]);
    $active = Typhoon::create(['name' => 'Now', 'status' => 'active', 'created_by' => $user->id]);
    $past = WeatherReport::create(['municipality' => 'A', 'user_id' => $user->id, 'disaster_id' => $old->id]);
    $current = WeatherReport::create(['municipality' => 'B', 'user_id' => $user->id, 'disaster_id' => $active->id]);
    Modification::query()->delete(); // drop the "created" entries the model logged
    editOf($user, 'WeatherReport', $past->id);
    editOf($user, 'WeatherReport', $current->id);

    $history = $this->actingAs($user)->getJson(route('modifications.weather'))->assertOk()->json('history');

    expect(array_keys($history))->toBe(["{$current->id}_name"]);
});

it('returns no edit history when no disaster is active', function () {
    $admin = userWithRole('admin');
    $old = Typhoon::create(['name' => 'Old', 'status' => 'ended', 'created_by' => $admin->id]);
    editOf($admin, 'Injured', Injured::factory()->create(['disaster_id' => $old->id])->id);

    $this->actingAs($admin)->getJson(route('modifications.injured'))->assertOk()->assertExactJson(['history' => []]);
});

/* ---------------- Health check ---------------- */

it('reports healthy while the database answers', function () {
    $this->get('/up')->assertOk();
});

it('reports unhealthy when the database cannot be reached', function () {
    $default = config('database.default');
    config(['database.default' => 'unreachable']);

    try {
        $this->get('/up')->assertStatus(500);
    } finally {
        config(['database.default' => $default]);
    }
});

/* ---------------- Trusted proxies ---------------- */

it('uses the connecting address when no proxy is configured', function () {
    Route::get('/_test/ip', fn (Request $request) => $request->ip());

    $this->get('/_test/ip', ['X-Forwarded-For' => '203.0.113.9'])->assertSee('127.0.0.1');
});

it('uses the visitor address forwarded by a configured CDN', function () {
    config(['app.trusted_proxies' => '127.0.0.1/32, 10.0.0.0/8']);
    $this->app->getProvider(AppServiceProvider::class)->boot();
    Route::get('/_test/ip', fn (Request $request) => $request->ip());

    $this->get('/_test/ip', ['X-Forwarded-For' => '203.0.113.9'])->assertSee('203.0.113.9');
});
