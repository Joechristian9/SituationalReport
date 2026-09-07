<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Year;
use App\Models\Typhoon;
use Illuminate\Support\Facades\DB;

class YearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Extract unique years from existing disasters
        $disasterYears = Typhoon::whereNotNull('started_at')
            ->get()
            ->map(function ($typhoon) {
                return $typhoon->started_at->format('Y');
            })
            ->unique()
            ->values()
            ->toArray();

        // Add common years
        $currentYear = now()->year;
        $commonYears = range($currentYear - 2, $currentYear + 2); // Last 2 years to next 2 years

        // Merge and deduplicate
        $allYears = array_unique(array_merge($disasterYears, $commonYears));
        sort($allYears);

        // Insert years
        foreach ($allYears as $year) {
            Year::firstOrCreate(['year' => $year]);
        }

        // Associate existing disasters with their respective years
        $disasters = Typhoon::whereNotNull('started_at')->get();
        
        foreach ($disasters as $disaster) {
            $year = Year::where('year', $disaster->started_at->format('Y'))->first();
            if ($year) {
                $disaster->update(['year_id' => $year->id]);
            }
        }

        $this->command->info('Years seeded and existing disasters associated successfully!');
    }
}
