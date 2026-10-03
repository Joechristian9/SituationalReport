<?php

use App\Models\Typhoon;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

it('shows a barangay its records saved before the disaster was paused and resumed', function () {
    Role::findOrCreate('user');
    $barangay = User::factory()->create(['name' => 'Rugao', 'email' => 'rugao@barangay.local']);
    $barangay->assignRole('user');
    $other = User::factory()->create();

    $disaster = Typhoon::create([
        'name' => 'Test Storm',
        'status' => 'active',
        'created_by' => $other->id,
        'paused_at' => now()->subMinutes(10),
        'resumed_at' => now()->subMinutes(5),
    ]);

    $before = now()->subHour()->toDateTimeString();
    DB::table('casualties')->insert(['name' => 'Saved before resume', 'user_id' => $barangay->id, 'disaster_id' => $disaster->id, 'created_at' => $before, 'updated_at' => $before]);
    DB::table('casualties')->insert(['name' => 'Saved after resume', 'user_id' => $barangay->id, 'disaster_id' => $disaster->id, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('casualties')->insert(['name' => 'Another barangay', 'user_id' => $other->id, 'disaster_id' => $disaster->id, 'created_at' => now(), 'updated_at' => now()]);

    $this->actingAs($barangay)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SituationReports/Index')
            ->has('casualties', 2)
            ->where('casualties', fn ($rows) => collect($rows)->pluck('name')->sort()->values()->all() === ['Saved after resume', 'Saved before resume']));
});
