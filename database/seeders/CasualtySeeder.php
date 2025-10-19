<?php

namespace Database\Seeders;

use App\Models\Casualty;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class CasualtySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Optional: Clear the table before seeding to avoid duplicate data
        // Recommended for development environments.
        Casualty::truncate();

        // Use the factory to create 25 casualty records.
        // The factory handles all the logic for generating the fake data.
        Casualty::factory()->count(50)->create();
    }
}
