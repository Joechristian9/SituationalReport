<?php

namespace Database\Seeders;

use App\Models\WaterLevel;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WaterLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        WaterLevel::unsetEventDispatcher();

        WaterLevel::factory()->count(50)->create();

        // Re-enable events (optional)
        WaterLevel::setEventDispatcher(app('events'));
    }
}
