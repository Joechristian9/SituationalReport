<?php

namespace Database\Seeders;

use App\Models\Missing;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MissingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate the table to start fresh on each seed
        Missing::truncate();

        // Create 50 new records for missing persons using the factory
        Missing::factory(50)->create();
    }
}
