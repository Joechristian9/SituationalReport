<?php

use App\Models\Typhoon;

function runningDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create([
        'name' => 'Tropical Storm Aghon', 'disaster_type' => 'Tropical Storm', 'status' => $status,
        'started_at' => now()->subDay(), 'created_by' => userWithRole('admin')->id,
    ]);
}

it('ends the disaster right away without building the PDF', function () {
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
        ->and($disaster->pdf_path)->toBeNull();
});

it('builds the final PDF on the first download and reuses it after', function () {
    $disaster = runningDisaster();
    $admin = userWithRole('admin');
    $this->actingAs($admin)->postJson(route('disasters.end', $disaster))->assertOk();

    $this->actingAs($admin)->get(route('disasters.download', $disaster))->assertOk()->assertDownload();
    $pdfPath = $disaster->fresh()->pdf_path;
    expect($pdfPath)->not->toBeNull()
        ->and(storage_path('app/public/'.$pdfPath))->toBeFile();

    $this->actingAs($admin)->get(route('disasters.download', $disaster))->assertOk();
    expect($disaster->fresh()->pdf_path)->toBe($pdfPath);

    unlink(storage_path('app/public/'.$pdfPath));
});

it('has no final PDF to download while the disaster is still running', function () {
    $this->actingAs(userWithRole('admin'))
        ->getJson(route('disasters.download', runningDisaster()))
        ->assertNotFound();
});

it('ends a paused disaster', function () {
    $disaster = runningDisaster('paused');

    $this->actingAs(userWithRole('admin'))
        ->postJson(route('disasters.end', $disaster))
        ->assertOk();

    expect($disaster->fresh()->status)->toBe('ended');
});

it('refuses to end a disaster twice', function () {
    $disaster = runningDisaster('ended');

    $this->actingAs(userWithRole('admin'))
        ->postJson(route('disasters.end', $disaster))
        ->assertStatus(422);
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
