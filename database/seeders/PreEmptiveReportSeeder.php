<?php

namespace Database\Seeders;

use App\Models\PreEmptiveReport;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PreEmptiveReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Recommended: Clear the table before seeding to start fresh.
        PreEmptiveReport::truncate();

        // Use the factory to create 50 pre-emptive report records.
        // The factory handles all the complex data generation logic.
        PreEmptiveReport::factory()->count(50)->create();
    }
}
