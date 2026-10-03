<?php

use App\Models\Typhoon;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

// The useLiveRefresh hook re-fetches only these props, so each page must keep
// returning them eagerly and under the same names.
dataset('live pages', [
    'dashboard' => ['admin.dashboard', 'Admin/Dashboard', ['casualties', 'injured', 'missing', 'impactSummary', 'recentImpact', 'newReportCounts'], 'weatherReports'],
    'casualty submissions' => ['admin.casualties.submissions', 'Admin/CasualtySubmissions', ['casualties', 'stats', 'disaster'], 'users'],
    'injured submissions' => ['admin.injured.submissions', 'Admin/InjuredSubmissions', ['injured', 'stats', 'disaster'], 'users'],
    'missing submissions' => ['admin.missing.submissions', 'Admin/MissingSubmissions', ['missing', 'stats', 'disaster'], 'users'],
    'audit logs' => ['admin.audit-logs', 'Admin/AuditLogs', ['logs', 'summary'], 'filterOptions'],
    'form submission status' => ['admin.form-submission-status', 'Admin/FormSubmissionStatus', ['users', 'activeTyphoon'], null],
]);

function liveAdmin(): User
{
    Role::findOrCreate('admin');
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $admin->id]);

    return $admin;
}

it('refreshes only the live props on a partial reload', function (string $route, string $component, array $only, ?string $skipped) {
    $this->actingAs(liveAdmin())
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            // The helper's array form is broken (explode on an array), so pass a comma list.
            ->reloadOnly(implode(',', $only), function (Assert $reload) use ($skipped) {
                if ($skipped) {
                    $reload->missing($skipped);
                }
            }));
})->with('live pages');

it('keeps live pages admin-only', function (string $route) {
    Role::findOrCreate('user');
    $user = User::factory()->create();
    $user->assignRole('user');

    $this->actingAs($user)->get(route($route))->assertForbidden();
})->with([
    'casualty submissions' => ['admin.casualties.submissions'],
    'audit logs' => ['admin.audit-logs'],
    'form submission status' => ['admin.form-submission-status'],
    'dashboard' => ['admin.dashboard'],
]);
