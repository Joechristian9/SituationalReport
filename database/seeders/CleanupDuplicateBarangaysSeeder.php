<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CleanupDuplicateBarangaysSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder removes old barangay accounts that were created by BarangaySeeder.php
     * (the ones with dots in emails like bagong.silang@barangay.local)
     * and keeps only the new format (bagongsilang@barangay.local)
     */
    public function run(): void
    {
        $this->command->info('Starting cleanup of duplicate barangay accounts...');

        // Old barangay accounts to delete (from BarangaySeeder.php with dots in email)
        $oldBarangaysToDelete = [
            'Aggassian',
            'Allinguigan 1st',
            'Allinguigan 2nd',
            'Allinguigan 3rd',
            'Baculod',
            'Balmadrid',
            'Barangay I (Poblacion)',
            'Barangay II (Poblacion)',
            'Barangay III (Poblacion)',
            'Barangay IV (Poblacion)',
            'Bintawan',
            'Buenavista',
            'Buyasan',
            'Centro San Antonio',
            'Cinaratan',
            'Dalibubon',
            'Defensor',
            'Dibuluan',
            'District I (Poblacion)',
            'District II (Poblacion)',
            'District III (Poblacion)',
            'District IV (Poblacion)',
            'Mabasa',
            'Mabuno',
            'Magsaysay',
            'Maksulop',
            'Manasse',
            'Minallo',
            'Ngarag',
            'Palacian',
            'Pisang',
            'Quezon',
            'Rang-ayan',
            'Rizal',
            'Raniag',
            'Salvador',
            'San Agustin',
            'San Antonio (Tangcul)',
            'Santa Isabel (Sab-it)',
            'Santa Monica',
            'Santa Rosa',
            'Tangcul (San Antonio)',
            'Villa Alicia',
            'Villa Marcos',
            'Villa Rey',
            'Villafuerte',
            'Villaluz',
            'Villanueva',
            'Union',
            'Catabayungan',
            'Annafunan East',
        ];

        $deleted = 0;

        foreach ($oldBarangaysToDelete as $barangayName) {
            // Find users with this exact name that have email format with dots
            $users = User::where('name', $barangayName)
                ->where('email', 'LIKE', '%.%@barangay.local')
                ->get();

            foreach ($users as $user) {
                $this->command->warn("Deleting: {$user->name} ({$user->email})");
                $user->delete();
                $deleted++;
            }
        }

        // Also delete any remaining duplicates where same barangay name exists multiple times
        $this->command->info("\nChecking for remaining duplicates...");
        
        $duplicates = User::selectRaw('name, COUNT(*) as count')
            ->where('email', 'LIKE', '%@barangay.local')
            ->groupBy('name')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            $this->command->info("Found duplicate: {$duplicate->name} ({$duplicate->count} entries)");
            
            // Keep the one without dots in email, delete the one with dots
            $users = User::where('name', $duplicate->name)
                ->orderByRaw("CASE WHEN email LIKE '%.%@barangay.local' THEN 0 ELSE 1 END DESC")
                ->get();

            // Delete all but the last one (the one without dots)
            for ($i = 0; $i < $users->count() - 1; $i++) {
                $this->command->warn("Deleting duplicate: {$users[$i]->name} ({$users[$i]->email})");
                $users[$i]->delete();
                $deleted++;
            }
        }

        $this->command->info("\n=== Cleanup Summary ===");
        $this->command->info("Deleted: {$deleted} duplicate accounts");
        
        $remainingCount = User::where('email', 'LIKE', '%@barangay.local')->count();
        $this->command->info("Remaining barangay accounts: {$remainingCount}");
    }
}
