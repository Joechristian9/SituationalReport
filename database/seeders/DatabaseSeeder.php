<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::create(['name' => 'user']);

        $permissions = [
            'access-weather-form',
            'access-water-level-form',
            'access-electricity-form',
            'access-water-service-form',
            'access-communication-form',
            'access-road-form',
            'access-bridge-form',
            'access-pre-emptive-form',
            'access-declaration-form',
            'access-pre-positioning-form',
            'access-incident-form',
            'access-casualty-form',
            'access-injured-form',
            'access-missing-form',
            'access-tourist-form',
            'access-damaged-houses-form',
            'access-response-operations',
            'access-assistance-extended',
            'access-agriculture-form',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        $iwd = User::factory()->create([
            'name' => 'Ilagan Water District',
            'email' => 'iwd@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $iwd->assignRole($role);
        $iwd->givePermissionTo('access-water-service-form');

        $iselco2 = User::factory()->create([
            'name' => 'Iselco II',
            'email' => 'iselco2@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $iselco2->assignRole($role);
        $iselco2->givePermissionTo('access-electricity-form');

        $bdrrmc = User::factory()->create([
            'name' => 'Bdrrmc',
            'email' => 'bdrrmo@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $bdrrmc->assignRole($role);
        $bdrrmc->givePermissionTo([
            'access-pre-emptive-form',
            'access-incident-form',
            'access-casualty-form',
            'access-injured-form',
            'access-missing-form',
            'access-response-operations',
            'access-assistance-extended',
        ]);

        $ceo = User::factory()->create([
            'name' => 'Ceo',
            'email' => 'ceo@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $ceo->assignRole($role);
        $ceo->givePermissionTo([
            'access-communication-form',
            'access-road-form',
            'access-bridge-form',
        ]);

        $pnp = User::factory()->create([
            'name' => 'Philippine National Police',
            'email' => 'pnp@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $pnp->assignRole($role);
        $pnp->givePermissionTo([
            'access-incident-form',
            'access-casualty-form',
            'access-injured-form',
            'access-missing-form',
            'access-tourist-form',
        ]);

        $cswdo = User::factory()->create([
            'name' => 'Cswdo',
            'email' => 'cswdo@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $cswdo->assignRole($role);
        $cswdo->givePermissionTo([
            'access-pre-emptive-form',
            'access-damaged-houses-form',
            'access-pre-positioning-form',
            'access-assistance-extended',
        ]);

        $cdrrmo = User::factory()->create([
            'name' => 'Cdrrmo',
            'email' => 'cdrrmo@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $cdrrmo->assignRole($role);
        $cdrrmo->givePermissionTo([
            'access-weather-form',
            'access-communication-form',
            'access-pre-emptive-form',
            'access-pre-positioning-form',
            'access-incident-form',
        ]);

        $cao = User::factory()->create([
            'name' => 'Chief Administrative Officer',
            'email' => 'cao@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $cao->assignRole($role);
        $cao->givePermissionTo('access-agriculture-form');

        $adminRole = Role::create(['name' => 'admin']);
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('admin123'),
        ]);
        $admin->assignRole($adminRole);
        $admin->givePermissionTo(Permission::all());

        $this->call(BarangaySeeder::class);
    }
}
