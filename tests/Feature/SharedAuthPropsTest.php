<?php

use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

// Inertia prints shared props into every page's HTML, so the user object must stay minimal.
it('shares only what the UI reads about the signed-in user', function () {
    $user = userWithRole('user');
    $user->givePermissionTo(Permission::findOrCreate('access-weather-form'));

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $user->id)
            ->where('auth.user.name', $user->name)
            ->where('auth.user.email', $user->email)
            ->where('auth.user.roles', [['name' => 'user']])
            ->where('auth.user.permissions', [['name' => 'access-weather-form']])
            ->missing('auth.user.roles.0.pivot')
            ->missing('auth.user.permissions.0.pivot')
            ->missing('auth.user.created_at')
            ->missing('auth.user.password')
            ->missing('auth.user.remember_token'));
});

it('shares no user for guests', function () {
    $this->get(route('login'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.user', null));
});
