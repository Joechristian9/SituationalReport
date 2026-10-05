<?php

use App\Models\User;
use App\Services\PagasaAlerts;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

function pagasaUser(string $role): User
{
    Role::findOrCreate($role);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function capEntry(string $title, string $href): string
{
    return "<entry><title>{$title}</title><link type=\"application/cap+xml\" href=\"{$href}\"/></entry>";
}

function capAlert(string $id, string $event, string $region, string $area, string $expires, string $severity = 'Moderate'): string
{
    return <<<XML
    <?xml version="1.0"?>
    <alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
      <identifier>{$id}</identifier><sent>2026-10-05T08:00:00+08:00</sent><status>Actual</status><msgType>Alert</msgType>
      <info>
        <event>{$event}</event><severity>{$severity}</severity><urgency>Expected</urgency><certainty>Likely</certainty>
        <expires>{$expires}</expires><headline>{$event}</headline>
        <description>Rivers in **{$area}** may overflow.</description><instruction>Stay alert.</instruction>
        <parameter><valueName>layer:Google:Region:0.1</valueName><value>{$region}</value></parameter>
        <area><areaDesc>{$area}</areaDesc></area>
      </info>
    </alert>
    XML;
}

/** @param  bool  $thenDown  the feed works once, then PAGASA returns 503 */
function fakePagasa(bool $thenDown = false): void
{
    $future = now()->addHours(6)->toIso8601String();
    $past = now()->subHour()->toIso8601String();
    $feed = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">'
        .capEntry('GFA #1 - Region 2 (Cagayan Valley)', 'https://121.58.193.10/output/gfa/isabela.cap')
        .capEntry('GFA #1 - Region 11 (Davao Region)', 'https://publicalert.pagasa.dost.gov.ph/output/gfa/davao.cap')
        .capEntry('Tropical Cyclone Alert : Typhoon Old', 'https://publicalert.pagasa.dost.gov.ph/output/tca/old.cap')
        .'</feed>';

    Http::fake([
        PagasaAlerts::FEED_URL => $thenDown
            ? Http::sequence()->push($feed)->push('', 503)
            : Http::response($feed),
        // The IP link is rewritten to PAGASA's domain, so this URL must be the one requested.
        'publicalert.pagasa.dost.gov.ph/output/gfa/isabela.cap' => Http::response(capAlert('isabela', 'General Flood Advisory', 'Region 2 (Cagayan Valley)', 'Isabela', $future)),
        'publicalert.pagasa.dost.gov.ph/output/gfa/davao.cap' => Http::response(capAlert('davao', 'General Flood Advisory', 'Region 11 (Davao Region)', 'Davao Del Norte', $future)),
        'publicalert.pagasa.dost.gov.ph/output/tca/old.cap' => Http::response(capAlert('old', 'Tropical Cyclone Alert', 'Philippine Area of Responsibility', 'Philippine Area of Responsibility', $past)),
    ]);
}

beforeEach(fn () => Cache::flush());

it('shows admins the active PAGASA alerts that concern Isabela', function () {
    fakePagasa();

    $response = $this->actingAs(pagasaUser('admin'))->getJson(route('admin.pagasa-alerts'))->assertOk();

    expect($response->json('stale'))->toBeFalse()
        ->and(collect($response->json('alerts'))->pluck('id')->all())->toBe(['isabela'])
        ->and($response->json('alerts.0.mentionsIsabela'))->toBeTrue()
        ->and($response->json('alerts.0.description'))->toBe('Rivers in Isabela may overflow.');
    Http::assertNotSent(fn ($request) => str_contains($request->url(), 'davao.cap'));
});

it('keeps regular users out', function () {
    $this->actingAs(pagasaUser('user'))->getJson(route('admin.pagasa-alerts'))->assertForbidden();
});

it('requires login', function () {
    $this->getJson(route('admin.pagasa-alerts'))->assertUnauthorized();
});

it('works when no disaster is active, since it only reads PAGASA data', function () {
    fakePagasa();

    $this->actingAs(pagasaUser('admin'))->getJson(route('admin.pagasa-alerts'))->assertOk();
});

it('serves the last good copy, marked stale, when PAGASA is down', function () {
    fakePagasa(thenDown: true);
    $admin = pagasaUser('admin');
    $this->actingAs($admin)->getJson(route('admin.pagasa-alerts'))->assertOk();

    Cache::forget('pagasa.alerts'); // the 10-minute copy ran out

    $response = $this->actingAs($admin)->getJson(route('admin.pagasa-alerts'))->assertOk();
    expect($response->json('stale'))->toBeTrue()
        ->and(collect($response->json('alerts'))->pluck('id')->all())->toBe(['isabela']);
});

it('caches the feed instead of calling PAGASA on every request', function () {
    fakePagasa();
    $admin = pagasaUser('admin');

    $this->actingAs($admin)->getJson(route('admin.pagasa-alerts'));
    $this->actingAs($admin)->getJson(route('admin.pagasa-alerts'));

    Http::assertSentCount(3); // the feed + two relevant alerts, once
});
