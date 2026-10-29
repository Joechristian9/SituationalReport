<?php

use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Models\User;
use Spatie\Permission\Models\Permission;

function preEmptiveAccount(): User
{
    Permission::findOrCreate('access-pre-emptive-form');
    $user = userWithRole('user');
    $user->givePermissionTo('access-pre-emptive-form');

    return $user;
}

it('computes the totals on the server, ignoring totals sent by the browser', function () {
    $user = preEmptiveAccount();
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    userWithRole('user')->update(['name' => 'Rugao', 'email' => 'rugao@barangay.local']); // the barangay picked below

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [[
            'id' => null, 'barangay' => 'Rugao', 'families' => 3, 'persons' => 12,
            'outside_families' => 2, 'outside_persons' => 7, 'total_families' => 999, 'total_persons' => 999,
        ]],
    ])->assertOk();

    expect(PreEmptiveReport::sole())->total_families->toBe(5)->total_persons->toBe(19);
});

it('keeps the totals right when a saved row is edited', function () {
    $user = preEmptiveAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $report = PreEmptiveReport::create([
        'disaster_id' => $disaster->id, 'user_id' => $user->id, 'barangay' => 'Rugao',
        'families' => 3, 'persons' => 12, 'total_families' => 3, 'total_persons' => 12,
    ]);

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [['id' => $report->id, 'barangay' => 'Rugao', 'families' => 4, 'persons' => 12, 'outside_persons' => 1]],
    ])->assertOk();

    expect($report->fresh())->total_families->toBe(4)->total_persons->toBe(13);
});

it('does not let an account without the pre-emptive permission save', function () {
    Permission::findOrCreate('access-pre-emptive-form');
    $user = userWithRole('user');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);

    $this->actingAs($user)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [['id' => null, 'barangay' => 'Rugao', 'families' => 1]],
    ])->assertForbidden();

    expect(PreEmptiveReport::count())->toBe(0);
});

function preEmptiveBarangay(string $name): User
{
    $user = preEmptiveAccount();
    $user->update(['name' => $name, 'email' => strtolower($name).'@barangay.local']);

    return $user;
}

it('shows a barangay only its own pre-emptive rows, and an office every barangay', function () {
    $rugao = preEmptiveBarangay('Rugao');
    $alibagu = preEmptiveBarangay('Alibagu');
    $cdrrmo = preEmptiveAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $cdrrmo->id]);
    $this->actingAs($cdrrmo);
    $rows = [];
    foreach ([$rugao, $alibagu] as $account) {
        $rows[] = $row = PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => $account->id, 'barangay' => $account->name, 'families' => 1]);
        $row->update(['families' => 2]); // leaves an edit in the field history
    }
    $editedFields = fn () => array_keys($this->getJson(route('modifications.pre-emptive'))->json('history'));

    $this->actingAs($rugao)->get(route('situation-reports.index'))
        ->assertInertia(fn ($page) => $page->has('preEmptiveReports', 1)->where('preEmptiveReports.0.barangay', 'Rugao'));
    expect($this->getJson(route('api.pre-emptive-history'))->json('data.0.reports'))->toHaveCount(1)
        ->and($editedFields())->toContain("{$rows[0]->id}_families")->not->toContain("{$rows[1]->id}_families");

    $this->actingAs($cdrrmo)->get(route('situation-reports.index'))
        ->assertInertia(fn ($page) => $page->has('preEmptiveReports', 2));
    expect($this->getJson(route('api.pre-emptive-history'))->json('data.0.reports'))->toHaveCount(2)
        ->and($editedFields())->toContain("{$rows[0]->id}_families", "{$rows[1]->id}_families");
});

it('lets a barangay edit only its own rows, and an office correct any barangay', function () {
    $rugao = preEmptiveBarangay('Rugao');
    preEmptiveBarangay('Alibagu');
    $cdrrmo = preEmptiveAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $cdrrmo->id]);
    $cdrrmoRow = PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => $cdrrmo->id, 'barangay' => 'Alibagu', 'families' => 1]);

    // A row left without a barangay is Rugao's own; a row with only its barangay is not saved;
    // a row that isn't Rugao's is not changed.
    $response = $this->actingAs($rugao)->postJson(route('pre-emptive-reports.store'), ['reports' => [
        ['id' => null, 'barangay' => null, 'families' => 2],
        ['id' => null, 'barangay' => 'Rugao'],
        ['id' => $cdrrmoRow->id, 'barangay' => 'Alibagu', 'families' => 9],
    ]])->assertOk();
    $rugaoRow = PreEmptiveReport::where('user_id', $rugao->id)->sole();
    expect($rugaoRow->barangay)->toBe('Rugao')
        ->and($cdrrmoRow->fresh()->families)->toEqual(1)
        ->and($response->json('reports'))->toHaveCount(1);

    $response = $this->actingAs($cdrrmo)->postJson(route('pre-emptive-reports.store'), [
        'reports' => [['id' => $rugaoRow->id, 'barangay' => 'Rugao', 'families' => 5]],
    ])->assertOk();
    expect($rugaoRow->fresh()->families)->toEqual(5)
        // After saving, the office still sees every barangay's rows.
        ->and($response->json('reports'))->toHaveCount(2);
});

it('lets a barangay see and correct the rows an office entered for it, and files its own rows under its name', function () {
    $rugao = preEmptiveBarangay('Rugao');
    preEmptiveBarangay('Alibagu');
    $cdrrmo = preEmptiveAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $cdrrmo->id]);
    $officeRow = PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => $cdrrmo->id, 'barangay' => 'Rugao', 'evacuation_center' => 'Rugao Gym']);
    PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => $cdrrmo->id, 'barangay' => 'Alibagu', 'families' => 1]);

    $this->actingAs($rugao)->get(route('situation-reports.index'))
        ->assertInertia(fn ($page) => $page->has('preEmptiveReports', 1)->where('preEmptiveReports.0.id', $officeRow->id));
    // The history page shows the same rows as the form.
    $this->actingAs($rugao)->getJson(route('api.pre-emptive-history'))
        ->assertJsonCount(1, 'data.0.reports')->assertJsonPath('data.0.reports.0.id', $officeRow->id);

    // Clearing a saved row still saves it (there is no delete); a new row naming another barangay is Rugao's.
    $this->actingAs($rugao)->postJson(route('pre-emptive-reports.store'), ['reports' => [
        ['id' => $officeRow->id, 'barangay' => 'Rugao', 'evacuation_center' => null],
        ['id' => null, 'barangay' => 'Alibagu', 'families' => 3],
    ]])->assertOk()->assertJsonCount(2, 'reports');

    expect($officeRow->fresh()->evacuation_center)->toBeNull()
        ->and(PreEmptiveReport::where('user_id', $rugao->id)->sole()->barangay)->toBe('Rugao');
});
