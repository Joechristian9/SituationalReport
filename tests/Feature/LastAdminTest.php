<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(fn () => Role::findOrCreate('user'));

function roleUpdate(User $user, string $role, ?string $name = null): array
{
    return ['name' => $name ?? $user->name, 'email' => $user->email, 'role' => $role, 'permissions' => []];
}

it('refuses to delete the account of the last admin', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error')
        ->assertSessionHasErrors('password');

    $this->assertAuthenticatedAs($admin);
    expect($admin->fresh()->trashed())->toBeFalse();
});

it('lets an admin delete their account when another admin remains', function () {
    $admin = userWithRole('admin');
    userWithRole('admin');

    $this->actingAs($admin)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertSoftDeleted($admin);
});

it('does not count a deleted admin as a remaining one', function () {
    $admin = userWithRole('admin');
    userWithRole('admin')->delete();

    $this->actingAs($admin)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHas('error');

    expect($admin->fresh()->trashed())->toBeFalse();
});

it('still asks for the password before anything else', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->delete(route('profile.destroy'), ['password' => 'wrong'])
        ->assertSessionHasErrors('password')
        ->assertSessionMissing('error');
});

it('refuses to demote the last admin, and changes nothing else on that save', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $admin), roleUpdate($admin, 'user', 'Renamed'))
        ->assertRedirect(route('admin.users.index'))
        ->assertSessionHas('error');

    expect($admin->fresh()->isAdmin())->toBeTrue()
        ->and($admin->fresh()->name)->not->toBe('Renamed');
});

it('still lets the last admin save their own account as an admin', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $admin), roleUpdate($admin, 'admin', 'Renamed'))
        ->assertSessionHas('success');

    expect($admin->fresh()->name)->toBe('Renamed');
});

it('lets an admin step down when another admin remains', function () {
    $admin = userWithRole('admin');
    userWithRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $admin), roleUpdate($admin, 'user'))
        ->assertSessionHas('success');

    expect($admin->fresh()->isAdmin())->toBeFalse();
});

it('lets an admin demote another admin, then stops the one left from stepping down', function () {
    $first = userWithRole('admin');
    $second = userWithRole('admin');

    $this->actingAs($first)
        ->patch(route('admin.users.update', $second), roleUpdate($second, 'user'))
        ->assertSessionHas('success');
    expect($second->fresh()->isAdmin())->toBeFalse();

    // Fresh instance: the signed-in one holds no stale roles from before the change.
    $this->actingAs(User::find($first->id))
        ->patch(route('admin.users.update', $first), roleUpdate($first, 'user'))
        ->assertSessionHas('error');
    expect($first->fresh()->isAdmin())->toBeTrue();
});
