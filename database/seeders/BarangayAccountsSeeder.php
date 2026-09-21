<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class BarangayAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barangays = [
            'Aggasian',
            'Alibagu',
            'Alinguigan 1st',
            'Alinguigan 2nd',
            'Alinguigan 3rd',
            'Arusip',
            'Baculud',
            'Bagong Silang',
            'Bagumbayan',
            'Baligatan',
            'Ballacong',
            'Bangag',
            'Batong-Labang',
            'Bigao',
            'Cabannungan 1st',
            'Cabannungan 2nd',
            'Cabeseria 2 (Dappat)',
            'Cabeseria 3 (San Fernando)',
            'Cabeseria 4 (San Manuel)',
            'Cabeseria 5 (Baribad)',
            'Cabeseria 6 and 24 (Villa Marcos)',
            'Cabeseria 7 (Nangalisan)',
            'Cabeseria 9 and 11 (Capogotan)',
            'Cabeseria 10 (Lupigui)',
            'Cabeseria 14 and 16 (Casilagan)',
            'Cabeseria 17 and 21 (San Rafael)',
            'Cabeseria 19 (Villa Suerte)',
            'Cabeseria 22 (Sablang)',
            'Cabeseria 23 (San Francisco)',
            'Cabeseria 25 (Santa Lucia)',
            'Cabeseria 27 (Abuan)',
            'Cadu',
            'Calamagui 1st',
            'Calamagui 2nd',
            'Camunatan',
            'Capellan',
            'Capo',
            'Carikkikan Norte',
            'Carikkikan Sur',
            'Centro – San Antonio',
            'Centro Poblacion',
            'Fugu',
            'Fuyo',
            'Gayong-Gayong Norte',
            'Gayong-Gayong Sur',
            'Guinatan',
            'Imelda Bliss Village',
            'Lullutan',
            'Malalam',
            'Malasin (Angeles)',
            'Manaring',
            'Mangcuram',
            'Marana I',
            'Marana II',
            'Marana III',
            'Minabang',
            'Morado',
            'Naguilian Norte',
            'Naguilian Sur',
            'Namnama',
            'Nanaguan',
            'Osmeña (Sinippil)',
            'Paliueg',
            'Pasa',
            'Pilar',
            'Quimalabasa',
            'Rang-ayan (Bintacan)',
            'Rugao',
            'Salindingan',
            'San Andres (Angarilla)',
            'San Felipe',
            'San Ignacio (Canapi)',
            'San Isidro',
            'San Juan',
            'San Lorenzo',
            'San Pablo',
            'San Rodrigo',
            'San Vicente (Poblacion)',
            'Santa Barbara (Poblacion)',
            'Santa Catalina',
            'Santa Isabel Norte',
            'Santa Isabel Sur',
            'Santa Maria (Cabeseria 8)',
            'Santa Victoria',
            'Santo Tomas',
            'Siffu',
            'Sindon Bayabo',
            'Sindon Maride',
            'Sipay',
            'Tangcul',
            'Villa Imelda (Maplas)',
        ];

        // Get the 'user' role
        $userRole = Role::where('name', 'user')->first();

        // Barangay-specific permissions (only 6 forms)
        $barangayPermissions = [
            'access-weather-form',
            'access-communication-form',
            'access-road-form',
            'access-bridge-form',
            'access-pre-emptive-form',
            'access-incident-form',
        ];

        $createdCount = 0;
        $updatedCount = 0;

        foreach ($barangays as $barangay) {
            // Create email from barangay name
            // Remove special characters and spaces, convert to lowercase
            $emailName = strtolower(str_replace([' ', '–', '-', '(', ')', 'and'], '', $barangay));
            $email = $emailName . '@barangay.local';

            // Check if user already exists
            $user = User::where('email', $email)->first();

            if ($user) {
                // Update existing user
                $user->update([
                    'name' => $barangay,
                    'password' => Hash::make('wardead123'),
                ]);
                $updatedCount++;
                $this->command->info("Updated: {$barangay} ({$email})");
            } else {
                // Create new user
                $user = User::create([
                    'name' => $barangay,
                    'email' => $email,
                    'password' => Hash::make('wardead123'),
                    'email_verified_at' => now(),
                ]);
                $createdCount++;
                $this->command->info("Created: {$barangay} ({$email})");
            }

            // Assign role
            if (!$user->hasRole('user')) {
                $user->assignRole($userRole);
            }

            // Sync permissions
            $user->syncPermissions($barangayPermissions);
        }

        $this->command->info("\n=== Barangay Accounts Summary ===");
        $this->command->info("Total Barangays: " . count($barangays));
        $this->command->info("Created: {$createdCount}");
        $this->command->info("Updated: {$updatedCount}");
        $this->command->info("\nAll accounts use password: wardead123");
    }
}
