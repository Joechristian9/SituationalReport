<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * One login per barangay of Ilagan City (email: barangay name, lowercase, no spaces,
 * ending in @barangay.local). Existing accounts are left untouched, so re-running it
 * only adds missing barangays and never resets a password.
 */
class BarangaySeeder extends Seeder
{
    private const BARANGAYS = [
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

    // Barangays submit only these forms (no electricity or water service).
    private const PERMISSIONS = [
        'access-weather-form',
        'access-communication-form',
        'access-road-form',
        'access-bridge-form',
        'access-pre-emptive-form',
        'access-incident-form',
    ];

    public function run(): void
    {
        $role = Role::firstOrCreate(['name' => 'user']);
        $created = 0;

        foreach (self::BARANGAYS as $barangay) {
            $user = User::firstOrNew(['email' => $this->email($barangay)]);
            if ($user->exists) {
                continue;
            }

            $user->forceFill([
                'name' => $barangay,
                'password' => Hash::make('wardead123'),
                'email_verified_at' => now(),
            ])->save();
            $user->assignRole($role);
            $user->givePermissionTo(self::PERMISSIONS);
            $created++;
        }

        $this->command->info("Barangay accounts: {$created} created, ".(count(self::BARANGAYS) - $created).' already existed.');
    }

    /** "Cabeseria 2 (Dappat)" → "cabeseria2@barangay.local" */
    private function email(string $barangay): string
    {
        $email = strtolower($barangay);
        $email = preg_replace('/\s*\([^)]*\)/', '', $email);
        $email = preg_replace('/[^a-z0-9]/', '', $email);

        return $email.'@barangay.local';
    }
}
