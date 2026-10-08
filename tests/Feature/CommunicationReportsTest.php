<?php

use App\Models\Communication;
use App\Models\CommunicationService;
use App\Models\CommunicationServiceValue;
use App\Models\Typhoon;
use App\Models\User;
use Spatie\Permission\Models\Permission;

function communicationAccount(): User
{
    Permission::findOrCreate('access-communication-form');
    $user = userWithRole('user');
    $user->givePermissionTo('access-communication-form');

    return $user;
}

it('loads the extra service statuses with the communication report', function () {
    $user = communicationAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $dito = CommunicationService::create(['name' => 'DITO', 'category' => 'cellphone', 'order' => 1, 'is_active' => true]);
    $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Serviceable']);
    CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $dito->id, 'status' => 'Intermittent']);

    $this->actingAs($user)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('communications.0.service_values.0.service_id', $dito->id)
            ->where('communications.0.service_values.0.status', 'Intermittent'));
});

it('clears an extra service status when it is saved empty', function () {
    $user = communicationAccount();
    $disaster = Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $user->id]);
    $dito = CommunicationService::create(['name' => 'DITO', 'category' => 'cellphone', 'order' => 1, 'is_active' => true]);
    $report = Communication::create(['disaster_id' => $disaster->id, 'user_id' => $user->id, 'globe' => 'Serviceable']);
    CommunicationServiceValue::create(['communication_id' => $report->id, 'service_id' => $dito->id, 'status' => 'Intermittent']);

    $this->actingAs($user)->postJson(route('communication-reports.store'), [
        'communications' => [['id' => $report->id, 'globe' => 'Serviceable', 'service_values' => [['service_id' => $dito->id, 'status' => '']]]],
    ])->assertOk();

    expect(CommunicationServiceValue::sole()->status)->toBeNull();
});
