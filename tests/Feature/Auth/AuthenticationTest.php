<?php

use App\Models\User;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('situation-reports.index', absolute: false));
});

test('admins land on the admin dashboard after login', function () {
    $user = userWithRole('admin');

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('logging out on one device keeps the account remembered on its other devices', function () {
    $user = User::factory()->create();
    $this->post('/login', ['email' => $user->email, 'password' => 'password', 'remember' => true]);
    $token = $user->fresh()->remember_token;

    $this->post('/logout');

    $this->assertGuest();
    expect($token)->not->toBeEmpty()
        ->and($user->fresh()->remember_token)->toBe($token);
});

// The app logs in and out in the background (resources/js/lib/offline/auth.js). A redirect
// there looks the same as success, so those requests get plain answers.

it('answers a background login with the account and its home page', function () {
    $user = userWithRole('user');

    $this->postJson('/login', ['email' => $user->email, 'password' => 'password', 'remember' => true])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.offline_stamp', $user->offlineStamp())
        ->assertJsonPath('home', route('situation-reports.index', [], false));

    $this->assertAuthenticatedAs($user);
});

it('refuses a wrong password on a background login with 422', function () {
    $user = userWithRole('user');

    $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password'])
        ->assertStatus(422)->assertJsonValidationErrors('email');
});

it('answers too many background logins with 429, not a redirect', function () {
    foreach (range(1, 30) as $i) {
        $this->postJson('/login', ['email' => "nobody{$i}@example.test", 'password' => 'x']);
    }

    $this->postJson('/login', ['email' => 'nobody31@example.test', 'password' => 'x'])
        ->assertStatus(429)->assertJsonStructure(['message']);
});

it('answers a locked-out background login with 429, not as a wrong password', function () {
    // The app forgets an account when the server refuses a password the phone still accepts
    // (422). A lockout after wrong tries must not look like that, or a correct password
    // typed during the lockout would wipe the phone's offline login.
    $user = userWithRole('user');
    foreach (range(1, 5) as $try) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password'])->assertStatus(422);
    }

    $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertStatus(429)->assertJsonStructure(['message']);
    $this->assertGuest();
});

it('answers a background logout with no content', function () {
    $this->actingAs(userWithRole('user'))->postJson('/logout')->assertNoContent();
    $this->assertGuest();
});

it('changes the account stamp when the password changes', function () {
    $user = userWithRole('user');
    $before = $user->offlineStamp();

    $user->update(['password' => 'a-new-long-password']);

    expect($before)->toMatch('/^[0-9a-f]{64}$/')
        ->and($user->fresh()->offlineStamp())->not->toBe($before)
        ->and(userWithRole('user')->offlineStamp())->not->toBe($before);
});
