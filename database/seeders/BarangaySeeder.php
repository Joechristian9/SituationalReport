<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create the user role
        $userRole = Role::firstOrCreate(['name' => 'user']);

        // All 91 barangays in Ilagan City
        $barangays = [
            'Aggassian',
            'Alibagu',
            'Allinguigan 1st',
            'Allinguigan 2nd',
            'Allinguigan 3rd',
            'Arusip',
            'Baculod',
            'Bagong Silang',
            'Bagumbayan',
            'Balmadrid',
            'Barangay I (Poblacion)',
            'Barangay II (Poblacion)',
            'Barangay III (Poblacion)',
            'Barangay IV (Poblacion)',
            'Batong-Labang',
            'Bigao',
            'Bintawan',
            'Buenavista',
            'Buyasan',
            'Cadu',
            'Calamagui 1st',
            'Calamagui 2nd',
            'Camunatan',
            'Capellan',
            'Capo',
            'Carikkikan Norte',
            'Carikkikan Sur',
            'Centro San Antonio',
            'Cinaratan',
            'Dalibubon',
            'Defensor',
            'Dibuluan',
            'District I (Poblacion)',
            'District II (Poblacion)',
            'District III (Poblacion)',
            'District IV (Poblacion)',
            'Fugu',
            'Guinatan',
            'Lullutan',
            'Mabasa',
            'Mabuno',
            'Magsaysay',
            'Maksulop',
            'Malalam',
            'Manasse',
            'Minabang',
            'Minallo',
            'Namnama',
            'Nanaguan',
            'Ngarag',
            'Osmeña',
            'Palacian',
            'Pilar',
            'Pisang',
            'Quezon',
            'Rang-ayan',
            'Rizal',
            'Raniag',
            'Rugao',
            'Salindingan',
            'Salvador',
            'San Agustin',
            'San Felipe',
            'San Isidro',
            'San Juan',
            'San Pablo',
            'San Vicente',
            'Santa Barbara',
            'Santa Catalina',
            'Santa Isabel (Sab-it)',
            'Santa Monica',
            'Santa Rosa',
            'Santa Victoria',
            'Santo Tomas',
            'Siffu',
            'Sindon Bayabo',
            'Sindon Maride',
            'Sipay',
            'San Antonio (Tangcul)',
            'Tangcul (San Antonio)',
            'Tupax',
            'Villa Alicia',
            'Villa Imelda (Maplas)',
            'Villa Marcos',
            'Villa Rey',
            'Villafuerte',
            'Villaluz',
            'Villanueva',
            'Union',
            'Catabayungan',
            'Baligatan',
            'Annafunan East'
        ];

        // Barangay-specific permissions (excluding electricity, water service, water level, and pre-positioning)
        $barangayPermissions = [
            'access-weather-form',
            // 'access-water-level-form', // EXCLUDED for barangays
            // 'access-electricity-form', // EXCLUDED for barangays
            // 'access-water-service-form', // EXCLUDED for barangays
            'access-communication-form',
            'access-road-form',
            'access-bridge-form',
            'access-pre-emptive-form',
            'access-declaration-form',
            // 'access-pre-positioning-form', // EXCLUDED for barangays
            'access-incident-form',
            'access-casualty-form',
            'access-injured-form',
            'access-missing-form',
            'access-tourist-form',
            'access-damaged-houses-form',
            'access-response-operations',
            'access-assistance-extended',
        ];

        // Create user for each barangay
        foreach ($barangays as $barangay) {
            // Generate email from barangay name
            $email = $this->generateEmail($barangay);
            
            $user = User::factory()->create([
                'name' => $barangay,
                'email' => $email,
                'password' => bcrypt('wardead123'),
            ]);
            
            $user->assignRole($userRole);
            // Give barangay users specific permissions (excluding electricity and water service)
            $user->givePermissionTo($barangayPermissions);
        }
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
