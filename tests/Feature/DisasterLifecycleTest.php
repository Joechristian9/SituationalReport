<?php

use App\Models\Typhoon;
use Illuminate\Support\Defer\DeferredCallbackCollection;

function runningDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create([
        'name' => 'Tropical Storm Aghon', 'disaster_type' => 'Tropical Storm', 'status' => $status,
        'started_at' => now()->subDay(), 'created_by' => userWithRole('admin')->id,
    ]);
}

/** Holds deferred callbacks instead of running them, so the PDF build is not rendered in tests. */
function holdDeferredCallbacks(): DeferredCallbackCollection
{
    $deferred = new class extends DeferredCallbackCollection
    {
        public function invokeWhen(?Closure $when = null): void {}
    };
    app()->instance(DeferredCallbackCollection::class, $deferred);

    return $deferred;
}

it('ends the disaster right away and builds the PDF after the response', function () {
    $deferred = holdDeferredCallbacks();
    $disaster = runningDisaster();
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->postJson(route('disasters.end', $disaster))
        ->assertOk()
        ->assertJsonPath('typhoon.status', 'ended');

    $disaster->refresh();
    expect($disaster->status)->toBe('ended')
        ->and($disaster->ended_by)->toBe($admin->id)
        ->and($disaster->ended_at)->not->toBeNull()
        ->and($disaster->pdf_path)->toBeNull()
        ->and($deferred)->toHaveCount(1);
});

it('stores the final PDF once the deferred build runs', function () {
    $deferred = holdDeferredCallbacks();
    $disaster = runningDisaster();

    $this->actingAs(userWithRole('admin'))->postJson(route('disasters.end', $disaster))->assertOk();
    $deferred->first()();

    $pdfPath = $disaster->fresh()->pdf_path;
    expect($pdfPath)->not->toBeNull()
        ->and(storage_path('app/public/'.$pdfPath))->toBeFile();

    unlink(storage_path('app/public/'.$pdfPath));
});

it('ends a paused disaster', function () {
    holdDeferredCallbacks();
    $disaster = runningDisaster('paused');

    $this->actingAs(userWithRole('admin'))
        ->postJson(route('disasters.end', $disaster))
        ->assertOk();

    expect($disaster->fresh()->status)->toBe('ended');
});

it('refuses to end a disaster twice', function () {
    $deferred = holdDeferredCallbacks();
    $disaster = runningDisaster('ended');

    $this->actingAs(userWithRole('admin'))
        ->postJson(route('disasters.end', $disaster))
        ->assertStatus(422);

    expect($deferred)->toHaveCount(0);
});

it('does not let non-admins end, pause or resume a disaster', function (string $action, string $status) {
    $disaster = runningDisaster($status);

    $this->actingAs(userWithRole('user'))
        ->postJson(route("disasters.{$action}", $disaster))
        ->assertForbidden();

    expect($disaster->fresh()->status)->toBe($status);
})->with([
    'end' => ['end', 'active'],
    'pause' => ['pause', 'active'],
    'resume' => ['resume', 'paused'],
]);

it('pauses and resumes a disaster', function () {
    $disaster = runningDisaster();
    $admin = userWithRole('admin');

    $this->actingAs($admin)->postJson(route('disasters.pause', $disaster))->assertOk();
    expect($disaster->fresh())->status->toBe('paused')->paused_by->toBe($admin->id);

    $this->actingAs($admin)->postJson(route('disasters.resume', $disaster))->assertOk();
    expect($disaster->fresh())->status->toBe('active')->resumed_by->toBe($admin->id);
});
