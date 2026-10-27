<?php

use App\Models\Casualty;
use App\Models\Typhoon;
use App\Models\UscDeclaration;
use App\Models\User;

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

it('rebuilds the final PDF when a record changed after it was built', function (Closure $change) {
    $disaster = runningDisaster();
    $admin = userWithRole('admin');
    $this->actingAs($admin)->postJson(route('disasters.end', $disaster))->assertOk();
    $this->actingAs($admin)->get(route('disasters.download', $disaster))->assertOk();
    $firstPath = $disaster->fresh()->pdf_path;

    // An admin corrects the data after the end (audited with the disaster's id).
    $this->travel(1)->minutes();
    $change($disaster, $admin);

    $this->actingAs($admin)->get(route('disasters.download', $disaster))->assertOk()->assertDownload();
    $newPath = $disaster->fresh()->pdf_path;
    expect($newPath)->not->toBe($firstPath)
        ->and(storage_path('app/public/'.$firstPath))->not->toBeFile()
        ->and(storage_path('app/public/'.$newPath))->toBeFile();

    unlink(storage_path('app/public/'.$newPath));
})->with([
    // Pest hands a closure to a `Closure` parameter as is, without calling it.
    'a casualty' => fn (Typhoon $disaster, User $admin) => Casualty::factory()->create(['disaster_id' => $disaster->id, 'user_id' => $admin->id]),
    'a state of calamity declaration' => fn (Typhoon $disaster, User $admin) => UscDeclaration::create([
        'declared_by' => 'Sangguniang Panlungsod', 'resolution_number' => '2026-101', 'date_approved' => now()->toDateString(),
        'disaster_id' => $disaster->id, 'user_id' => $admin->id,
    ]),
]);

it('names the final PDF after the disaster type without repeating it', function (string $name, string $type, string $prefix) {
    $disaster = runningDisaster();
    $disaster->update(['name' => $name, 'disaster_type' => $type]);
    $admin = userWithRole('admin');
    $this->actingAs($admin)->postJson(route('disasters.end', $disaster))->assertOk();

    $this->actingAs($admin)->get(route('disasters.download', $disaster))->assertOk()->assertDownload();
    $pdfPath = $disaster->fresh()->pdf_path;
    expect($pdfPath)->toStartWith("reports/{$prefix}_Report_");

    unlink(storage_path('app/public/'.$pdfPath));
})->with([
    'an earthquake' => ['Magnitude 6.5 Ilagan', 'Earthquake', 'Earthquake_Magnitude_6.5_Ilagan'],
    'a name that already says the type' => ['Tropical Storm Aghon', 'Tropical Storm', 'Tropical_Storm_Aghon'],
    'type Other' => ['Gas Leak Baligatan', 'Other', 'Gas_Leak_Baligatan'],
]);

it('names every disaster of the year in the yearly report subject', function () {
    $admin = userWithRole('admin');
    Typhoon::create(['name' => 'Kristine', 'disaster_type' => 'Typhoon', 'status' => 'ended', 'started_at' => '2026-07-01', 'created_by' => $admin->id]);
    Typhoon::create(['name' => 'Magnitude 6.5 Ilagan', 'disaster_type' => 'Earthquake', 'status' => 'active', 'started_at' => '2026-09-15', 'created_by' => $admin->id]);
    Typhoon::create(['name' => 'Aghon', 'disaster_type' => 'Typhoon', 'status' => 'ended', 'started_at' => '2025-05-20', 'ended_at' => '2025-05-25', 'created_by' => $admin->id]);
    Typhoon::create(['name' => 'Odette', 'disaster_type' => 'Typhoon', 'status' => 'ended', 'started_at' => '2025-12-28', 'ended_at' => '2026-01-03', 'created_by' => $admin->id]);

    $this->actingAs($admin)->get(route('reports.view', ['year' => 2026]))
        ->assertOk()
        ->assertSee('TERMINAL REPORT re: TYPHOON "ODETTE", TYPHOON "KRISTINE", EARTHQUAKE "MAGNITUDE 6.5 ILAGAN"')
        ->assertDontSee('AGHON');
    $this->actingAs($admin)->get(route('reports.view', ['year' => 2024]))->assertSee('TERMINAL REPORT re: CY 2024');
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
