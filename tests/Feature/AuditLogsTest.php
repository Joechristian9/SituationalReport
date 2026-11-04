<?php

use App\Models\AuditLog;
use App\Models\Typhoon;
use Inertia\Testing\AssertableInertia as Assert;

function auditRow(string $action, string $at, ?int $userId = null, ?string $description = null): AuditLog
{
    $log = AuditLog::create(['action' => $action, 'user_id' => $userId, 'description' => $description]);
    $log->forceFill(['created_at' => $at, 'updated_at' => $at])->save();

    return $log;
}

it('sums up today in one go, ignoring other days', function () {
    $admin = userWithRole('admin');
    $other = userWithRole('user');
    AuditLog::query()->delete(); // creating the accounts above is itself audited
    auditRow('created', now()->toDateTimeString(), $admin->id);
    auditRow('updated', now()->toDateTimeString(), $other->id);
    auditRow('failed_login', now()->toDateTimeString());
    auditRow('created', now()->subDay()->toDateTimeString(), $admin->id); // yesterday

    $this->actingAs($admin)
        ->get(route('admin.audit-logs'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary', ['events' => 3, 'changes' => 2, 'active_users' => 2, 'failed_logins' => 1]));
});

it('filters by an inclusive date range and by search', function () {
    $admin = userWithRole('admin');
    AuditLog::query()->delete();
    auditRow('login', '2026-10-01 23:59:00', null, 'first');
    auditRow('login', '2026-10-02 08:00:00', null, '100% done');

    $descriptions = fn (array $query) => array_column(
        $this->actingAs($admin)->get(route('admin.audit-logs', $query))->viewData('page')['props']['logs']['data'],
        'description',
    );

    // (Literal % in search relies on MySQL's backslash LIKE escape; SQLite has none, so it isn't checked here.)
    expect($descriptions(['start_date' => '2026-10-01', 'end_date' => '2026-10-01']))->toBe(['first'])
        ->and($descriptions(['start_date' => '2026-10-02']))->toBe(['100% done'])
        ->and($descriptions(['search' => 'done']))->toBe(['100% done']);
});

it('leaves the dropdown choices out of filter reloads', function () {
    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.audit-logs'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('filterOptions.actions')
            ->reloadOnly('logs,summary,filters', fn (Assert $reload) => $reload->missing('filterOptions')));
});

it('opens one entry with its changes', function () {
    $admin = userWithRole('admin');
    $log = AuditLog::create(['action' => 'updated', 'user_id' => $admin->id, 'auditable_type' => 'App\\Models\\Road', 'auditable_id' => 999, 'old_values' => ['status' => 'Open'], 'new_values' => ['status' => 'Closed']]);

    $this->actingAs($admin)
        ->getJson(route('admin.audit-logs.show', $log->id))
        ->assertOk()
        ->assertJsonPath('changes.0.old_value', 'Open')
        ->assertJsonPath('changes.0.new_value', 'Closed');
});

it('exports every row once, newest first, even when many share one timestamp', function () {
    $admin = userWithRole('admin');
    AuditLog::query()->delete();
    $at = '2026-10-01 08:00:00';
    foreach (array_chunk(range(1, 1203), 200) as $chunk) {
        AuditLog::insert(array_map(fn (int $number) => ['action' => 'created', 'description' => "row-{$number}", 'created_at' => $at, 'updated_at' => $at], $chunk));
    }

    $csv = $this->actingAs($admin)->get(route('admin.audit-logs.export', ['search' => 'row-']))->assertOk()->streamedContent();
    preg_match_all('/row-(\d+)/', $csv, $found);

    expect($found[1])->toHaveCount(1203)
        ->and(array_unique($found[1]))->toHaveCount(1203)
        ->and($found[1][0])->toBe('1203')
        ->and(end($found[1]))->toBe('1');
});

it('exports the same columns as before, with the account and disaster names', function () {
    $admin = userWithRole('admin');
    AuditLog::query()->delete();
    $disaster = Typhoon::create(['name' => 'Storm', 'status' => 'active', 'created_by' => $admin->id]);
    AuditLog::insert(['user_id' => $admin->id, 'disaster_id' => $disaster->id, 'action' => 'created', 'auditable_type' => 'App\\Models\\Road', 'auditable_id' => 42, 'ip_address' => '10.0.0.1', 'description' => 'filed', 'created_at' => '2026-10-01 08:00:00', 'updated_at' => '2026-10-01 08:00:00']);

    $csv = $this->actingAs($admin)->get(route('admin.audit-logs.export', ['search' => 'filed']))->assertOk()->streamedContent();

    expect($csv)->toContain('2026-10-01 08:00:00')
        ->toContain($admin->name)
        ->toContain($admin->email)
        ->toContain('Storm')
        ->toContain('10.0.0.1')
        ->toContain('42')
        ->toContain('filed');
});
