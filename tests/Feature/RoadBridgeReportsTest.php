<?php

use App\Models\Road;
use App\Models\Typhoon;
use Spatie\Permission\Models\Permission;

it('reloads saved road and bridge rows on the situation reports page', function () {
    collect(['access-road-form', 'access-bridge-form'])->each(fn ($p) => Permission::findOrCreate($p));
    $barangay = userWithRole('user');
    $barangay->givePermissionTo(['access-road-form', 'access-bridge-form']);
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $barangay->id]);

    // An unsaved row carries no id; a fully blank row must not be stored.
    $blank = ['id' => null, 'road_classification' => '', 'status' => '', 'remarks' => ''];

    $this->actingAs($barangay)->postJson(route('road-reports.store'), [
        'roads' => [['id' => null, 'name_of_road' => 'Maharlika Highway', 'status' => 'Passable'], $blank],
    ])->assertOk()->assertJsonCount(1, 'roads');

    $this->actingAs($barangay)->postJson(route('bridge-reports.store'), [
        'bridges' => [['id' => null, 'name_of_bridge' => 'Buntun Bridge', 'status' => 'Not passable'], $blank],
    ])->assertOk()->assertJsonCount(1, 'bridges');

    $this->actingAs($barangay)
        ->get(route('situation-reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('roads', 1)
            ->where('roads.0.name_of_road', 'Maharlika Highway')
            ->has('bridges', 1)
            ->where('bridges.0.name_of_bridge', 'Buntun Bridge'));
});

it('does not save roads when no disaster is active', function () {
    collect(['access-road-form', 'access-bridge-form'])->each(fn ($p) => Permission::findOrCreate($p));
    $barangay = userWithRole('user');
    $barangay->givePermissionTo(['access-road-form', 'access-bridge-form']);

    $this->actingAs($barangay)->postJson(route('road-reports.store'), [
        'roads' => [['id' => null, 'name_of_road' => 'Maharlika Highway']],
    ])->assertStatus(403);

    expect(Road::count())->toBe(0);
});

it('does not let an account without the road permission save roads', function () {
    Permission::findOrCreate('access-road-form');
    $other = userWithRole('user');
    Typhoon::create(['name' => 'Test Storm', 'status' => 'active', 'created_by' => $other->id]);

    $this->actingAs($other)->postJson(route('road-reports.store'), [
        'roads' => [['id' => null, 'name_of_road' => 'Maharlika Highway']],
    ])->assertForbidden();

    expect(Road::count())->toBe(0);
});
