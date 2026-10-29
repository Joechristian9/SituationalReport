<?php

use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

it('lists accounts with role and form names only, and the choices on a full visit', function () {
    $admin = userWithRole('admin');
    $account = userWithPermissions('access-weather-form');

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('users', 2)
            ->where('users', fn ($users) => collect($users)->firstWhere('id', $account->id)['permissions'] === ['access-weather-form'])
            ->has('roles')
            ->has('permissions')
            ->reloadOnly('users,flash', fn (Assert $reload) => $reload->missing('roles')->missing('permissions')));
});

it('saves a user and only reloads the user list', function () {
    $admin = userWithRole('admin');
    $account = userWithPermissions('access-weather-form');
    Permission::findOrCreate('access-road-form');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $account), [
            'name' => 'Renamed',
            'email' => $account->email,
            'role' => 'user',
            'permissions' => ['access-road-form'],
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($account->fresh()->name)->toBe('Renamed')
        ->and($account->fresh()->getPermissionNames()->all())->toBe(['access-road-form']);
});

it('signs an account out on all its devices when an admin changes its password', function () {
    $admin = userWithRole('admin');
    $account = userWithPermissions('access-road-form');
    signedInElsewhere($account, 'phone-1');
    signedInElsewhere($account, 'phone-2');
    $update = ['name' => $account->name, 'email' => $account->email, 'role' => 'user', 'permissions' => ['access-road-form']];

    // Saving without a new password leaves its phones signed in.
    $this->actingAs($admin)->patch(route('admin.users.update', $account), $update);
    expect(DB::table('sessions')->where('user_id', $account->id)->count())->toBe(2);

    $this->actingAs($admin)->patch(route('admin.users.update', $account), [...$update, 'password' => 'New-password-123']);
    expect(DB::table('sessions')->where('user_id', $account->id)->count())->toBe(0);
});
