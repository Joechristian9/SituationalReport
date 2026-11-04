<?php

use App\Events\UserTyping;
use App\Models\Casualty;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Models\User;
use App\Models\WeatherReport;
use Illuminate\Contracts\Broadcasting\Broadcaster;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Permission;

function readAccessDisaster(): Typhoon
{
    return Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => User::factory()->create()->id]);
}

/** A row written as $owner, so its edit history is logged. */
function personRowWithHistory(string $model, User $owner, Typhoon $disaster): void
{
    test()->actingAs($owner);
    $model::create(['disaster_id' => $disaster->id, 'user_id' => $owner->id, 'name' => 'Secret Victim']);
}

dataset('person forms', [
    'casualties' => ['modifications.casualties', 'access-casualty-form', Casualty::class],
    'injured' => ['modifications.injured', 'access-injured-form', Injured::class],
    'missing' => ['modifications.missing', 'access-missing-form', Missing::class],
]);

it('gives an account the edit history of the rows it may read, not of other accounts', function (string $route, string $permission, string $model) {
    $disaster = readAccessDisaster();
    $owner = userWithPermissions($permission);
    $stranger = userWithPermissions($permission);
    $reader = userWithPermissions($permission);
    $writer = userWithPermissions($permission);
    foreach (['read' => $reader, 'write' => $writer] as $type => $grantee) {
        DB::table('user_data_sharing')->insert(['user_id' => $owner->id, 'shared_with_user_id' => $grantee->id, 'permission_type' => $type, 'created_at' => now(), 'updated_at' => now()]);
    }
    personRowWithHistory($model, $owner, $disaster);
    $history = fn (User $user) => $this->actingAs($user)->getJson(route($route))->assertOk();

    $history($stranger)->assertExactJson(['history' => []]);
    $history($stranger)->assertDontSee('Secret Victim');
    $history($owner)->assertSee('Secret Victim');
    $history($reader)->assertSee('Secret Victim');
    $history($writer)->assertSee('Secret Victim');
    $history(userWithRole('admin'))->assertSee('Secret Victim');
})->with('person forms');

it('refuses the edit history of a person form to an account without that form', function (string $route, string $permission) {
    readAccessDisaster();
    Permission::findOrCreate($permission);

    $this->actingAs(userWithPermissions('access-road-form'))->getJson(route($route))->assertForbidden();
})->with('person forms');

it('shows weather edit history and the weather list only to the weather form or an admin', function (string $route) {
    $disaster = readAccessDisaster();
    Permission::findOrCreate('access-weather-form');
    WeatherReport::create(['disaster_id' => $disaster->id, 'municipality' => 'City of Ilagan']);

    $this->actingAs(userWithPermissions('access-weather-form'))->getJson(route($route))->assertOk();
    $this->actingAs(userWithRole('admin'))->getJson(route($route))->assertOk();
    $this->actingAs(userWithPermissions('access-road-form'))->getJson(route($route))->assertForbidden();
})->with(['modifications.weather', 'api.weather-reports']);

it('answers 403, not a server error, when the weather permission was never created', function (string $route) {
    readAccessDisaster();

    $this->actingAs(userWithRole('user'))->getJson(route($route))->assertForbidden();
    $this->actingAs(userWithRole('admin'))->getJson(route($route))->assertOk();
})->with(['modifications.weather', 'api.weather-reports']);

it('shows pre-emptive edit history only to the pre-emptive form or an admin', function () {
    $disaster = readAccessDisaster();
    $barangay = userWithPermissions('access-pre-emptive-form');
    $barangay->update(['name' => 'Rugao', 'email' => 'rugao@barangay.local']);
    $office = userWithPermissions('access-pre-emptive-form');
    $this->actingAs($barangay);
    $row = PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => $barangay->id, 'barangay' => 'Rugao', 'families' => 1]);
    $row->update(['families' => 2]);

    $this->actingAs($barangay)->getJson(route('modifications.pre-emptive'))->assertOk()->assertJsonStructure(['history' => ["{$row->id}_families"]]);
    $this->actingAs($office)->getJson(route('modifications.pre-emptive'))->assertOk()->assertJsonStructure(['history' => ["{$row->id}_families"]]);
    $this->actingAs(userWithRole('admin'))->getJson(route('modifications.pre-emptive'))->assertOk();
    $this->actingAs(userWithPermissions('access-road-form'))->getJson(route('modifications.pre-emptive'))->assertForbidden();
});

it('announces typing under the signed-in account, ignoring the names an old client still sends', function () {
    readAccessDisaster();
    $user = userWithRole('user');
    $victim = userWithRole('user');
    Event::fake([UserTyping::class]);

    $this->actingAs($user)->postJson(route('broadcast.typing'), [
        'userId' => $victim->id, 'userName' => 'Somebody Else', 'fieldKey' => '1_wind', 'isTyping' => true, 'channel' => 'weather-form-typing',
    ])->assertOk();

    Event::assertDispatched(UserTyping::class, fn (UserTyping $event) => $event->userId === $user->id
        && $event->userName === $user->name
        && $event->fieldKey === '1_wind'
        && $event->isTyping === true
        && $event->channelName === 'weather-form-typing');
});

it('accepts a typing announcement without the old name fields', function () {
    readAccessDisaster();
    Event::fake([UserTyping::class]);

    $this->actingAs(userWithRole('user'))->postJson(route('broadcast.typing'), [
        'fieldKey' => '1_wind', 'isTyping' => false, 'channel' => 'road-form-typing',
    ])->assertOk();

    Event::assertDispatched(UserTyping::class);
});

it('refuses typing announcements on a channel that does not exist', function (string $channel) {
    readAccessDisaster();
    Event::fake([UserTyping::class]);

    $this->actingAs(userWithRole('user'))->postJson(route('broadcast.typing'), [
        'fieldKey' => '1_wind', 'isTyping' => true, 'channel' => $channel,
    ])->assertStatus(422);

    Event::assertNotDispatched(UserTyping::class);
})->with(['private-user.1', 'admin-channel', 'communication-form-typing']);

it('lets every allowed typing channel be subscribed to', function () {
    $registered = array_keys(app(Broadcaster::class)->getChannels()->all());

    expect($registered)->toEqualCanonicalizing(UserTyping::CHANNELS);
});
