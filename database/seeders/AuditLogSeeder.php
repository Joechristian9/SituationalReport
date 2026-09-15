<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\WeatherReport;
use App\Models\Typhoon;
use Carbon\Carbon;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users and disaster for testing
        $admin = User::where('email', 'admin@admin.com')->first();
        $users = User::limit(3)->get();
        $disaster = Typhoon::first();

        if (!$admin || $users->count() === 0) {
            $this->command->warn('No users found. Please seed users first.');
            return;
        }

        $this->command->info('Seeding audit logs...');

        // 1. Login scenarios
        $this->command->info('Creating login logs...');
        foreach ($users as $index => $user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'auditable_type' => null,
                'auditable_id' => null,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => '192.168.1.' . (100 + $index),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => null,
                'description' => "User {$user->name} logged in successfully",
                'created_at' => Carbon::now()->subHours(rand(1, 24)),
            ]);
        }

        // 2. Failed login attempts
        $this->command->info('Creating failed login logs...');
        AuditLog::create([
            'user_id' => null,
            'action' => 'failed_login',
            'auditable_type' => null,
            'auditable_id' => null,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => '203.0.113.45',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'disaster_id' => null,
            'description' => 'Failed login attempt for: hacker@test.com from IP: 203.0.113.45',
            'created_at' => Carbon::now()->subHours(12),
        ]);

        // 3. Create scenario - Weather Report
        if ($disaster) {
            $this->command->info('Creating weather report creation logs...');
            $weatherReport = WeatherReport::first();
            
            if ($weatherReport) {
                AuditLog::create([
                    'user_id' => $users->first()->id,
                    'action' => 'created',
                    'auditable_type' => 'App\Models\WeatherReport',
                    'auditable_id' => $weatherReport->id,
                    'old_values' => null,
                    'new_values' => [
                        'municipality' => 'Ilagan City',
                        'sky_condition' => 'Cloudy',
                        'wind' => 'Moderate',
                        'precipitation' => '5mm',
                        'sea_condition' => 'Moderate',
                    ],
                    'ip_address' => '192.168.1.100',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'disaster_id' => $disaster->id,
                    'description' => 'Created new weather report for Ilagan City',
                    'created_at' => Carbon::now()->subHours(10),
                ]);
            }
        }

        // 4. Update scenario - Weather Report (field changes)
        $this->command->info('Creating weather report update logs...');
        if ($disaster && $weatherReport) {
            AuditLog::create([
                'user_id' => $users->first()->id,
                'action' => 'updated',
                'auditable_type' => 'App\Models\WeatherReport',
                'auditable_id' => $weatherReport->id,
                'old_values' => [
                    'sky_condition' => 'Cloudy',
                    'wind' => 'Moderate',
                    'precipitation' => '5mm',
                ],
                'new_values' => [
                    'sky_condition' => 'Partly Cloudy',
                    'wind' => 'Strong',
                    'precipitation' => '12mm',
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => $disaster->id,
                'description' => 'Updated weather conditions for Ilagan City',
                'created_at' => Carbon::now()->subHours(8),
            ]);
        }

        // 5. User management - User created
        $this->command->info('Creating user management logs...');
        if ($users->count() > 1) {
            $newUser = $users->skip(1)->first();
            AuditLog::create([
                'user_id' => $admin->id ?? $users->first()->id,
                'action' => 'created',
                'auditable_type' => 'App\Models\User',
                'auditable_id' => $newUser->id,
                'old_values' => null,
                'new_values' => [
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'created_at' => $newUser->created_at->format('Y-m-d H:i:s'),
                ],
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => null,
                'description' => "Created new user: {$newUser->name}",
                'created_at' => Carbon::now()->subHours(20),
            ]);
        }

        // 6. User management - Permission changed
        $this->command->info('Creating permission change logs...');
        if ($users->count() > 1) {
            $targetUser = $users->skip(1)->first();
            AuditLog::create([
                'user_id' => $admin->id ?? $users->first()->id,
                'action' => 'permission_changed',
                'auditable_type' => 'App\Models\User',
                'auditable_id' => $targetUser->id,
                'old_values' => [
                    'roles' => ['user'],
                    'permissions' => ['access-weather-form'],
                ],
                'new_values' => [
                    'roles' => ['user'],
                    'permissions' => ['access-weather-form', 'access-electricity-form', 'access-water-service-form'],
                ],
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => null,
                'description' => "Permissions/roles updated for user: {$targetUser->name}",
                'created_at' => Carbon::now()->subHours(18),
            ]);
        }

        // 7. Password change
        $this->command->info('Creating password change logs...');
        if ($users->count() > 1) {
            $targetUser = $users->skip(1)->first();
            AuditLog::create([
                'user_id' => $targetUser->id,
                'action' => 'password_changed',
                'auditable_type' => null,
                'auditable_id' => null,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => '192.168.1.105',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => null,
                'description' => "Password changed for user: {$targetUser->name} ({$targetUser->email})",
                'created_at' => Carbon::now()->subHours(15),
            ]);
        }

        // 8. Delete scenario
        $this->command->info('Creating deletion logs...');
        AuditLog::create([
            'user_id' => $admin->id ?? $users->first()->id,
            'action' => 'deleted',
            'auditable_type' => 'App\Models\WeatherReport',
            'auditable_id' => 9999,
            'old_values' => [
                'municipality' => 'Sample Municipality',
                'sky_condition' => 'Sunny',
                'wind' => 'Light',
                'precipitation' => '0mm',
                'sea_condition' => 'Calm',
            ],
            'new_values' => null,
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'disaster_id' => $disaster?->id,
            'description' => 'Deleted weather report #9999',
            'created_at' => Carbon::now()->subHours(6),
        ]);

        // 9. Export action
        $this->command->info('Creating export logs...');
        AuditLog::create([
            'user_id' => $admin->id ?? $users->first()->id,
            'action' => 'exported',
            'auditable_type' => null,
            'auditable_id' => null,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'disaster_id' => $disaster?->id,
            'description' => 'Exported Weather Report data',
            'created_at' => Carbon::now()->subHours(4),
        ]);

        // 10. Logout
        $this->command->info('Creating logout logs...');
        foreach ($users as $index => $user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'auditable_type' => null,
                'auditable_id' => null,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => '192.168.1.' . (100 + $index),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => null,
                'description' => "User {$user->name} logged out",
                'created_at' => Carbon::now()->subHours(rand(1, 3)),
            ]);
        }

        // 11. Multiple field update (complex scenario)
        $this->command->info('Creating complex multi-field update logs...');
        if ($disaster && $weatherReport) {
            AuditLog::create([
                'user_id' => $users->first()->id,
                'action' => 'updated',
                'auditable_type' => 'App\Models\WeatherReport',
                'auditable_id' => $weatherReport->id,
                'old_values' => [
                    'sky_condition' => 'Partly Cloudy',
                    'wind' => 'Strong',
                    'precipitation' => '12mm',
                    'sea_condition' => 'Moderate',
                ],
                'new_values' => [
                    'sky_condition' => 'Overcast',
                    'wind' => 'Very Strong',
                    'precipitation' => '25mm',
                    'sea_condition' => 'Rough',
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'disaster_id' => $disaster->id,
                'description' => 'Updated multiple weather fields - conditions worsening',
                'created_at' => Carbon::now()->subHours(2),
            ]);
        }

        $this->command->info('✅ Audit log seeding completed successfully!');
        $this->command->info('Created logs for:');
        $this->command->info('- User login/logout');
        $this->command->info('- Failed login attempts');
        $this->command->info('- Create/Update/Delete operations');
        $this->command->info('- User management (creation, permission changes, password changes)');
        $this->command->info('- Data exports');
    }
}
