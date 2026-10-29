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

test('a phone signing in by itself after an offline session can tell a refused password apart', function () {
    $user = User::factory()->create(['password' => 'correct-horse-battery']);

    // lib/offline/offlineSession.js treats 422 as "password changed or account removed".
    $this->postJson('/login', ['email' => $user->email, 'password' => 'old-horse-battery', 'remember' => true])->assertStatus(422);
    $this->assertGuest();

    $this->postJson('/login', ['email' => $user->email, 'password' => 'correct-horse-battery', 'remember' => true])->assertRedirect();
    $this->assertAuthenticatedAs($user);
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
