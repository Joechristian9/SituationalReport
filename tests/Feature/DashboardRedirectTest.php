<?php

it('sends regular users to their reports page instead of a dashboard', function () {
    $this->actingAs(userWithRole('user'))
        ->get(route('dashboard'))
        ->assertRedirect(route('situation-reports.index'));
});

it('shows admins the dashboard at the same URL', function () {
    $this->actingAs(userWithRole('admin'))
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Dashboard'));
});

it('serves the dashboard without an admin prefix in the URL', function () {
    expect(route('dashboard', absolute: false))->toBe('/dashboard');
});

it('requires login', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

it('sends users to their reports page with the message when no disaster is active', function () {
    $this->actingAs(userWithRole('user'))
        ->get(route('communication-services.index'))
        ->assertRedirect(route('situation-reports.index'))
        ->assertSessionHas('error');
});

it('keeps a flash message through the dashboard redirect', function () {
    $this->actingAs(userWithRole('user'))
        // As if the previous request flashed it: without reflash it expires on this hop.
        ->withSession(['_flash' => ['old' => ['success'], 'new' => []], 'success' => 'Saved'])
        ->get(route('dashboard'))
        ->assertRedirect(route('situation-reports.index'))
        ->assertSessionHas('success', 'Saved');
});
