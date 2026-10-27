<?php

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Database\QueryException;
use Spatie\Permission\Models\Role;

// Deleting an account or a disaster can't be undone, so the admin must re-enter their password.

it('deletes a user only with the admin password', function () {
    $admin = userWithRole('admin');
    $account = User::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $account), ['password' => 'wrong-password'])
        ->assertSessionHasErrors('password');
    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $account))
        ->assertSessionHasErrors('password');
    expect($account->fresh())->not->toBeNull();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $account), ['password' => 'password'])
        ->assertRedirect(route('admin.users.index'));
    expect($account->fresh()->trashed())->toBeTrue();
});

it('keeps what a deleted user filed, still under their name', function () {
    $admin = userWithRole('admin');
    $account = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Kristine', 'status' => 'active', 'created_by' => $account->id]);

    $this->actingAs($admin)->delete(route('admin.users.destroy', $account), ['password' => 'password'])->assertRedirect();

    expect($disaster->fresh()?->creator?->name)->toBe($account->name);
    $this->post(route('logout'));
    $this->post(route('login'), ['email' => $account->email, 'password' => 'password']);
    $this->assertGuest();
    // A real delete must fail rather than take the disaster and its reports with it.
    expect(fn () => $account->forceDelete())->toThrow(QueryException::class);
    // Admins still see what the deleted account filed.
    expect($admin->getAccessibleUserIds())->toContain($account->id);
});

it('restores a deleted account when an admin creates one with its email again', function () {
    $admin = userWithRole('admin');
    $account = userWithRole('admin');
    Role::findOrCreate('user');
    $disaster = Typhoon::create(['name' => 'Kristine', 'status' => 'active', 'created_by' => $account->id]);
    $account->setRememberToken('old-phone-token');
    $account->save();
    $this->actingAs($admin)->delete(route('admin.users.destroy', $account), ['password' => 'password']);

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'Brgy. Alibagu', 'email' => $account->email, 'password' => 'new-password-123', 'role' => 'user',
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.users.index'));

    $restored = User::where('email', $account->email)->sole();
    expect($restored->id)->toBe($account->id)
        ->and($restored->name)->toBe('Brgy. Alibagu')
        ->and($restored->getRoleNames()->all())->toBe(['user'])
        ->and($disaster->fresh()->created_by)->toBe($account->id)
        // The old device's "remember me" cookie no longer matches.
        ->and($restored->getRememberToken())->not->toBe('old-phone-token');
    // A live account's email is still taken.
    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'Copy', 'email' => $admin->email, 'password' => 'new-password-123', 'role' => 'user',
    ])->assertSessionHasErrors('email');
});

it('deletes a disaster only with the admin password', function () {
    $admin = userWithRole('admin');
    $disaster = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $admin->id]);

    $this->actingAs($admin)
        ->deleteJson(route('disasters.destroy', $disaster), ['password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');
    $this->actingAs($admin)
        ->deleteJson(route('disasters.destroy', $disaster))
        ->assertJsonValidationErrors('password');
    expect($disaster->fresh())->not->toBeNull();

    $this->actingAs($admin)
        ->deleteJson(route('disasters.destroy', $disaster), ['password' => 'password'])
        ->assertOk();
    expect($disaster->fresh())->toBeNull();
});

it('keeps both deletes admin-only, even with a valid password', function () {
    $user = userWithRole('user');
    $account = User::factory()->create();
    $disaster = Typhoon::create(['name' => 'Old Storm', 'status' => 'ended', 'created_by' => $account->id]);

    $this->actingAs($user)->delete(route('admin.users.destroy', $account), ['password' => 'password'])->assertForbidden();
    $this->actingAs($user)->deleteJson(route('disasters.destroy', $disaster), ['password' => 'password'])->assertForbidden();
    expect($account->fresh())->not->toBeNull()->and($disaster->fresh())->not->toBeNull();
});
