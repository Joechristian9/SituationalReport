<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class BarangayAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Barangay Accounts Seeder...');
        
        // Get or create the user role
        $userRole = Role::firstOrCreate(['name' => 'user']);

        // All 92 barangays in Ilagan City
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

        // Barangay-specific permissions (only 6 forms)
        $barangayPermissions = [
            'access-weather-form',
            'access-communication-form',
            'access-road-form',
            'access-bridge-form',
            'access-pre-emptive-form',
            'access-incident-form',
        ];

        $created = 0;
        $updated = 0;

        // Create or update user for each barangay
        foreach ($barangays as $barangay) {
            // Generate email from barangay name
            $email = $this->generateEmail($barangay);
            
            // Check if user already exists with this name OR email
            $existingUser = User::where('name', $barangay)
                ->orWhere('email', $email)
                ->first();
            
            if ($existingUser) {
                // Update the existing user
                $existingUser->update([
                    'name' => $barangay,
                    'email' => $email,
                    'password' => Hash::make('wardead123'),
                ]);
                
                // Ensure role and permissions are correct
                if (!$existingUser->hasRole($userRole)) {
                    $existingUser->assignRole($userRole);
                }
                $existingUser->syncPermissions($barangayPermissions);
                
                $this->command->info("Updated: {$barangay} ({$email})");
                $updated++;
            } else {
                // Create new user
                $user = User::create([
                    'name' => $barangay,
                    'email' => $email,
                    'password' => Hash::make('wardead123'),
                ]);
                
                $user->assignRole($userRole);
                $user->givePermissionTo($barangayPermissions);
                
                $this->command->info("Created: {$barangay} ({$email})");
                $created++;
            }
        }

        $this->command->info("\n=== Summary ===");
        $this->command->info("Created: {$created} accounts");
        $this->command->info("Updated: {$updated} accounts");
        $this->command->info("Total: " . ($created + $updated) . " barangay accounts");
    }

    /**
     * Generate email from barangay name
     * Rules:
     * 1. Convert to lowercase
     * 2. Remove content in parentheses
     * 3. Remove special characters (except spaces and numbers)
     * 4. Replace spaces with dots (.)
     * 5. Add @barangay.local domain
     */
    private function generateEmail(string $barangayName): string
    {
        // Convert to lowercase
        $email = strtolower($barangayName);
        
        // Remove content in parentheses
        $email = preg_replace('/\s*\([^)]*\)/', '', $email);
        
        // Remove special characters except spaces and numbers
        $email = preg_replace('/[^a-z0-9\s]/', '', $email);
        
        // Replace spaces with dots
        $email = str_replace(' ', '.', $email);
        
        // Trim any extra dots
        $email = trim($email, '.');
        
        // Add domain
        return $email . '@barangay.local';
    }
}
