<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WeatherReport;

class WeatherReportSeeder extends Seeder
{
    public function run(): void
    {
        WeatherReport::unsetEventDispatcher();

        WeatherReport::factory()->count(50)->create();

        // Re-enable events (optional)
        WeatherReport::setEventDispatcher(app('events'));
    }
}
