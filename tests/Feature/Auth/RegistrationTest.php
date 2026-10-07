<?php

use App\Models\User;

test('there is no public registration screen', function () {
    $this->get('/register')->assertNotFound();
});

test('nobody can self-register', function () {
    $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertGuest();
    expect(User::where('email', 'test@example.com')->exists())->toBeFalse();
});
