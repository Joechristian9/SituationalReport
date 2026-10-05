<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

function dashboardUser(string $role): User
{
    Role::findOrCreate($role);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('sends regular users to their reports page instead of a dashboard', function () {
    $this->actingAs(dashboardUser('user'))
        ->get(route('dashboard'))
        ->assertRedirect(route('situation-reports.index'));
});

it('sends admins to the admin dashboard', function () {
    $this->actingAs(dashboardUser('admin'))
        ->get(route('dashboard'))
        ->assertRedirect(route('admin.dashboard'));
});

it('keeps regular users out of the admin dashboard', function () {
    $this->actingAs(dashboardUser('user'))
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

it('requires login', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

it('sends users to their reports page with the message when no disaster is active', function () {
    $this->actingAs(dashboardUser('user'))
        ->get(route('communication-services.index'))
        ->assertRedirect(route('situation-reports.index'))
        ->assertSessionHas('error');
});

it('keeps a flash message through the dashboard redirect', function () {
    $this->actingAs(dashboardUser('user'))
        // As if the previous request flashed it: without reflash it expires on this hop.
        ->withSession(['_flash' => ['old' => ['success'], 'new' => []], 'success' => 'Saved'])
        ->get(route('dashboard'))
        ->assertRedirect(route('situation-reports.index'))
        ->assertSessionHas('success', 'Saved');
});
