<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        // namoka joe

        $role = Role::create(['name' => 'user']);
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('wardead123'),
        ]);
        $user->assignRole($role);

        $user2 = User::factory()->create([
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

        $adminRole = Role::create(['name' => 'admin']);
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('admin123'),
        ]);
        $admin->assignRole($adminRole);
    }
}
