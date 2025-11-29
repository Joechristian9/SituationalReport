<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        // namoka joe

        // Create user role first
        $role = Role::create(['name' => 'user']);

        // Create form-specific permissions
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
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        /* $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('wardead123'),
        ]);
        $user->assignRole($role); */

        /* $user2 = User::factory()->create([
            'name' => 'Joe',
            'email' => 'joe@example.com',
            'password' => bcrypt('wardead123'),
        ]);
        $user2->assignRole($role);

        $user3 = User::factory()->create([
            'name' => 'Kevin',
            'email' => 'kev@example.com',
            'password' => bcrypt('wardead123'),
        ]);
        $user3->assignRole($role);
 */ 

        // IWD - Only Water Service form
        $iwd = User::factory()->create([
            'name' => 'Ilagan Water District',
            'email' => 'iwd@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $iwd->assignRole($role);
        $iwd->givePermissionTo('access-water-service-form');

        // Iselco II - Only Electricity form
        $iselco2 = User::factory()->create([
            'name' => 'Iselco II',
            'email' => 'iselco2@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $iselco2->assignRole($role);
        $iselco2->givePermissionTo('access-electricity-form');

        // BDRRMC - Access to specific forms
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

        // CEO - Access to communication and infrastructure
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

        // PNP - Access to incident and casualty forms
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

        // CSWDO - Access to social welfare related forms
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

        // CDRRMO - Full access to all forms (coordinator role)
        $cdrrmo = User::factory()->create([
            'name' => 'Cdrrmo',
            'email' => 'cdrrmo@gmail.com',
            'password' => bcrypt('wardead123'),
        ]);
        $cdrrmo->assignRole($role);
        $cdrrmo->givePermissionTo(Permission::all());

        // Create admin role and admin user with all permissions
        $adminRole = Role::create(['name' => 'admin']);
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('admin123'),
        ]);
        $admin->assignRole($adminRole);
        $admin->givePermissionTo(Permission::all());

        // Seed barangay accounts
        $this->call(BarangaySeeder::class);
    }
}
