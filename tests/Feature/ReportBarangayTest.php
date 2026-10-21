<?php

use App\Models\Casualty;
use App\Models\DamagedHouseReport;
use App\Models\Injured;
use App\Models\Typhoon;
use App\Models\User;
use App\Services\Barangays;
use Illuminate\Support\Facades\DB;

function activeStorm(): Typhoon
{
    return Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => userWithRole('admin')->id]);
}

/** A barangay's own account (named after it, @barangay.local) holding the given form permissions. */
function barangayWithPermissions(string $name, string ...$permissions): User
{
    $user = userWithPermissions(...$permissions);
    $user->update(['name' => $name, 'email' => strtolower(str_replace(' ', '', $name)).'@barangay.local']);

    return $user;
}

it('files a casualty under the reporting barangay when none is chosen', function () {
    activeStorm();
    $alibagu = barangayWithPermissions('Alibagu', 'access-casualty-form');

    $this->actingAs($alibagu)->postJson(route('casualties.store'), ['casualties' => [['name' => 'Juan', 'cause_of_death' => 'Drowning']]])->assertOk();

    expect(Casualty::sole()->barangay)->toBe('Alibagu');
});

it('stores the chosen barangay as its account spells it, even from a city office', function () {
    activeStorm();
    barangayWithPermissions('Alinguigan 1st');
    $office = userWithPermissions('access-injured-form');

    $this->actingAs($office)->postJson(route('injured.store'), ['injured' => [['name' => 'Ana', 'barangay' => '  alinguigan   1ST ']]])->assertOk();

    expect(Injured::sole()->barangay)->toBe('Alinguigan 1st');
});

it('refuses a barangay that is not on the list and saves nothing', function () {
    activeStorm();
    barangayWithPermissions('Alibagu');

    $this->actingAs(userWithPermissions('access-casualty-form'))
        ->postJson(route('casualties.store'), ['casualties' => [['name' => 'Juan', 'barangay' => 'Atlantis']]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['casualties.0.barangay' => 'Choose a barangay from the list.']);

    expect(Casualty::count())->toBe(0);
});

it('keeps an old damaged-house row typed before the list, but refuses that name on a new row', function () {
    $storm = activeStorm();
    barangayWithPermissions('Alibagu');
    $office = userWithPermissions('access-damaged-houses-form');
    $old = DamagedHouseReport::create(['barangay' => 'Centro', 'partially' => 1, 'totally' => 0, 'total' => 1, 'user_id' => $office->id, 'disaster_id' => $storm->id]);

    $this->actingAs($office)
        ->postJson(route('damaged-houses-reports.store'), ['damaged_houses' => [['id' => $old->id, 'barangay' => 'Centro', 'partially' => 2, 'totally' => 0]]])
        ->assertOk();
    expect($old->fresh())->barangay->toBe('Centro')->partially->toBe(2);

    $this->actingAs($office)
        ->postJson(route('damaged-houses-reports.store'), ['damaged_houses' => [['barangay' => 'Centro', 'partially' => 1, 'totally' => 0]]])
        ->assertUnprocessable();
    $this->actingAs($office)
        ->postJson(route('damaged-houses-reports.store'), ['damaged_houses' => [['barangay' => 'alibagu', 'partially' => 1, 'totally' => 0]]])
        ->assertOk();
    expect(DamagedHouseReport::latest('id')->first()->barangay)->toBe('Alibagu');
});

it('fills the barangay of existing records from the address, else the reporting barangay', function () {
    $storm = activeStorm();
    $aggasian = barangayWithPermissions('Aggasian');
    barangayWithPermissions('Baculud');
    $office = userWithRole('user');
    $add = fn (User $user, ?string $address) => DB::table('casualties')->insertGetId(['user_id' => $user->id, 'disaster_id' => $storm->id, 'address' => $address, 'created_at' => now(), 'updated_at' => now()]);

    $fromAddress = $add($aggasian, 'Purok 4, Brgy. Baculud, Ilagan City, Isabela');
    $fromAccount = $add($aggasian, 'Somewhere');
    $plainName = $add($office, 'Purok 2, aggasian, Ilagan City');
    $unknown = $add($office, 'Purok 1, Brgy. Atlantis');

    (require database_path('migrations/2026_10_21_000000_add_barangay_to_person_tables.php'))->backfill();

    expect(DB::table('casualties')->orderBy('id')->pluck('barangay', 'id')->all())->toBe([
        $fromAddress => 'Baculud',
        $fromAccount => 'Aggasian',
        $plainName => 'Aggasian',
        $unknown => null,
    ]);
});

it('prints the barangay with the home address without repeating it', function (?string $address, ?string $barangay, string $printed) {
    expect(Barangays::withAddress($address, $barangay))->toBe($printed);
})->with([
    'typed separately' => ['Purok 4', 'Aggasian', 'Purok 4, Brgy. Aggasian'],
    'already in the address' => ['Purok 4, brgy.  aggasian, Ilagan City', 'Aggasian', 'Purok 4, brgy.  aggasian, Ilagan City'],
    'no address' => [null, 'Aggasian', 'Brgy. Aggasian'],
    'no barangay' => ['Purok 1', null, 'Purok 1'],
]);

it('answers a malformed barangay with a validation error, not a crash', function () {
    activeStorm();

    $this->actingAs(userWithPermissions('access-casualty-form'))
        ->postJson(route('casualties.store'), ['casualties' => [['name' => 'Juan', 'barangay' => ['Alibagu']]]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('casualties.0.barangay');

    expect(Casualty::count())->toBe(0);
});

it('sends the barangay list to the pages with report forms only', function () {
    barangayWithPermissions('Alibagu');
    $admin = userWithRole('admin');

    foreach (['situation-reports.index', 'incident-monitored.index'] as $page) {
        $this->actingAs($admin)->get(route($page))->assertInertia(fn ($inertia) => $inertia->where('barangays', ['Alibagu']));
    }
    $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn ($inertia) => $inertia->where('barangays', []));
});
