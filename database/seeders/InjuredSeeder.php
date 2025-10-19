<?php

namespace Database\Seeders;

use App\Models\Injured;
use Illuminate\Database\Seeder;

class InjuredSeeder extends Seeder
{
    public function run(): void
    {
        Injured::truncate();
        Injured::factory()->count(50)->create(); // Create 40 injured person records
    }
}
