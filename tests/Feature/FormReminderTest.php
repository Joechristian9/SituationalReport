<?php

use App\Models\AuditLog;
use App\Models\PreEmptiveReport;
use App\Models\Typhoon;
use App\Models\WeatherReport;
use App\Notifications\FormReminder;
use Illuminate\Testing\TestResponse;

function remindableDisaster(string $status = 'active'): Typhoon
{
    return Typhoon::create(['name' => 'Test Storm', 'status' => $status, 'created_by' => userWithRole('admin')->id]);
}

function remind(array $payload = []): TestResponse
{
    return test()->actingAs(userWithRole('admin'))->postJson(route('admin.form-reminders.store'), $payload);
}

it('reminds every account that still has forms to file', function () {
    $disaster = remindableDisaster();
    $pending = userWithPermissions('access-weather-form', 'access-road-form');
    $filed = userWithPermissions('access-weather-form');
    $nothingToFile = userWithRole('user');
    WeatherReport::create(['disaster_id' => $disaster->id, 'user_id' => $filed->id, 'municipality' => 'City of Ilagan']);

    remind(['note' => 'Please file before noon.'])
        ->assertOk()
        ->assertJson(['notified' => 1, 'skipped_recent' => 0]);

    expect($pending->notifications)->toHaveCount(1)
        ->and($pending->notifications->first()->data)->toMatchArray([
            'disaster_id' => $disaster->id,
            'tables' => ['weather_reports', 'roads'],
            'note' => 'Please file before noon.',
        ])
        ->and($filed->notifications)->toHaveCount(0)
        ->and($nothingToFile->notifications)->toHaveCount(0);
    expect(AuditLog::where('action', 'reminded')->count())->toBe(1);
});

it('does not ask for weather or water levels during an earthquake', function () {
    remindableDisaster()->update(['disaster_type' => 'Earthquake']);
    $both = userWithPermissions('access-weather-form', 'access-water-level-form', 'access-road-form');
    $weatherOnly = userWithPermissions('access-weather-form');

    remind()->assertOk()->assertJson(['notified' => 1]);

    expect($both->notifications->first()->data['tables'])->toBe(['roads'])
        ->and($weatherOnly->notifications)->toHaveCount(0);
});

it('asks for affected tourists but not for water levels, which no page shows', function () {
    remindableDisaster();
    $account = userWithPermissions('access-tourist-form', 'access-water-level-form');

    remind()->assertOk()->assertJson(['notified' => 1]);

    expect($account->notifications->first()->data['tables'])->toBe(['affected_tourists']);
});

it('counts a pre-emptive row an office filed for a barangay as that barangay\'s', function () {
    $disaster = remindableDisaster();
    $alibagu = userWithPermissions('access-pre-emptive-form');
    $alibagu->update(['name' => 'Alibagu', 'email' => 'alibagu@barangay.local']);
    $rugao = userWithPermissions('access-pre-emptive-form');
    $rugao->update(['name' => 'Rugao', 'email' => 'rugao@barangay.local']);
    remind();

    PreEmptiveReport::create(['disaster_id' => $disaster->id, 'user_id' => userWithPermissions('access-pre-emptive-form')->id, 'barangay' => 'Alibagu', 'families' => 3]);

    // The bell drops Alibagu's reminder, and the admin's next reminder skips Alibagu.
    $this->actingAs($alibagu)->getJson(route('notifications.index'))->assertJsonPath('unread', 0);
    $this->travel(2)->hours();
    remind()->assertOk()->assertJson(['notified' => 1]);
    expect($alibagu->notifications)->toHaveCount(1)->and($rugao->notifications)->toHaveCount(2);
});

it('reminds only the accounts the admin picked', function () {
    remindableDisaster();
    $picked = userWithPermissions('access-weather-form');
    $other = userWithPermissions('access-weather-form');

    remind(['user_ids' => [$picked->id]])->assertOk()->assertJson(['notified' => 1]);

    expect($picked->notifications)->toHaveCount(1)->and($other->notifications)->toHaveCount(0);
});

it('does not remind the same account twice within the hour', function () {
    remindableDisaster();
    $account = userWithPermissions('access-weather-form');

    remind()->assertJson(['notified' => 1]);
    remind()->assertJson(['notified' => 0, 'skipped_recent' => 1]);
    $this->travel(FormReminder::COOLDOWN_MINUTES + 1)->minutes();
    remind()->assertJson(['notified' => 1]);

    expect($account->notifications()->count())->toBe(2);
});

it('refuses a reminder when no disaster is active or the disaster is paused', function (?string $status) {
    if ($status) {
        remindableDisaster($status);
    }
    $account = userWithPermissions('access-weather-form');

    remind()->assertUnprocessable();

    expect($account->notifications)->toHaveCount(0);
})->with(['no disaster' => [null], 'paused' => ['paused']]);

it('lets only admins send reminders', function () {
    remindableDisaster();
    $account = userWithPermissions('access-weather-form');

    $this->actingAs($account)->postJson(route('admin.form-reminders.store'))->assertForbidden();
});

it('refuses a reminder from a visitor who is not signed in', function () {
    $this->postJson(route('admin.form-reminders.store'))->assertUnauthorized();
});

it('rejects a note that is too long', function () {
    remindableDisaster();

    remind(['note' => str_repeat('a', 201)])->assertJsonValidationErrors('note');
});

it('shows an account its own reminders with the forms still missing', function () {
    $disaster = remindableDisaster();
    $account = userWithPermissions('access-weather-form', 'access-road-form');
    $stranger = userWithPermissions('access-weather-form');
    remind(['note' => 'Hurry']);

    $response = $this->actingAs($account)->getJson(route('notifications.index'))->assertOk();

    expect($response->json('unread'))->toBe(1)
        ->and($response->json('items.0.forms'))->toBe(['Weather Report', 'Roads'])
        ->and($response->json('items.0.note'))->toBe('Hurry')
        ->and($response->json('items.0.disaster'))->toBe($disaster->name);

    // Filing a form drops it from the reminder; filing them all drops the reminder.
    WeatherReport::create(['disaster_id' => $disaster->id, 'user_id' => $account->id, 'municipality' => 'City of Ilagan']);
    $this->actingAs($account)->getJson(route('notifications.index'))->assertJsonPath('items.0.forms', ['Roads']);
    DB::table('roads')->insert(['disaster_id' => $disaster->id, 'user_id' => $account->id, 'created_at' => now(), 'updated_at' => now()]);
    $this->actingAs($account)->getJson(route('notifications.index'))->assertJsonPath('unread', 0)->assertJsonCount(0, 'items');

    expect($stranger->notifications)->toHaveCount(1);
});

it('hides a reminder once its disaster has ended', function () {
    $disaster = remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    remind();

    $disaster->update(['status' => 'ended']);

    $this->actingAs($account)->getJson(route('notifications.index'))->assertJsonCount(0, 'items');
});

it('never shows one account another account\'s reminder', function () {
    remindableDisaster();
    $picked = userWithPermissions('access-weather-form');
    $other = userWithPermissions('access-weather-form');
    remind(['user_ids' => [$picked->id]]);

    $this->actingAs($other)->getJson(route('notifications.index'))->assertJsonPath('unread', 0)->assertJsonCount(0, 'items');
});

it('marks the reminders read when the bell is opened', function () {
    remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    remind();

    $this->actingAs($account)->postJson(route('notifications.read'))->assertOk();

    $this->actingAs($account)->getJson(route('notifications.index'))->assertJsonPath('unread', 0)->assertJsonCount(1, 'items');
});

it('tells the admin which accounts still have forms to file and when they were reminded', function () {
    $disaster = remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    $account->notify(new FormReminder($disaster, ['weather_reports'], 'Admin'));

    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.form-submission-status'))
        ->assertInertia(fn ($page) => $page
            ->where('users.0.id', $account->id)
            ->where('users.0.pending_forms', ['Weather Report'])
            ->whereNot('users.0.reminded_at', null));
});

it('puts the disaster notice in the bell while forms are closed', function (?string $status, ?string $kind) {
    if ($status) {
        remindableDisaster($status);
    }

    $notice = $this->actingAs(userWithPermissions('access-weather-form'))->getJson(route('notifications.index'))->assertOk()->json('notice');

    expect($notice['kind'] ?? null)->toBe($kind);
})->with([
    'no disaster' => [null, 'none'],
    'paused' => ['paused', 'paused'],
    'active' => ['active', null],
]);

it('does not give admins a bell', function () {
    remindableDisaster('paused');
    $admin = userWithRole('admin');

    $this->actingAs($admin)->getJson(route('notifications.index'))->assertForbidden();
    $this->actingAs($admin)->postJson(route('notifications.read'))->assertForbidden();
});

it('shows the paused notice and the reminders together in the one bell', function () {
    $disaster = remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    remind(['note' => 'Before noon please']);

    $disaster->update(['status' => 'paused']);

    $this->actingAs($account)
        ->getJson(route('notifications.index'))
        ->assertOk()
        ->assertJsonPath('notice.kind', 'paused')
        ->assertJsonPath('unread', 1)
        ->assertJsonPath('items.0.forms', ['Weather Report'])
        ->assertJsonPath('items.0.note', 'Before noon please');
});

it('keeps the notice in the bell after the reminders are marked read', function () {
    $disaster = remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    remind();
    $disaster->update(['status' => 'paused']);

    $this->actingAs($account)->postJson(route('notifications.read'))->assertOk();

    $this->actingAs($account)
        ->getJson(route('notifications.index'))
        ->assertJsonPath('notice.kind', 'paused')
        ->assertJsonPath('unread', 0)
        ->assertJsonCount(1, 'items');
});

it('only lists reminders about the current disaster', function () {
    $old = remindableDisaster();
    $account = userWithPermissions('access-weather-form');
    remind();
    $old->update(['status' => 'ended']);
    remindableDisaster();

    $this->actingAs($account)
        ->getJson(route('notifications.index'))
        ->assertJsonPath('unread', 0)
        ->assertJsonCount(0, 'items');
});
