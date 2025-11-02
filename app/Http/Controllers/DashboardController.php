<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\PreEmptiveReport;
use App\Models\Casualty;
use Inertia\Inertia;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\WaterLevel;

class DashboardController extends Controller
{
    public function index()
    {
        // Optimize: Only load recent records for performance
        return Inertia::render('Admin/Dashboard', [
            'weatherReports' => WeatherReport::latest('updated_at')
                ->limit(100)
                ->get(),
            
            'waterLevels' => WaterLevel::latest('updated_at')
                ->limit(50)
                ->get(),
            
            'preEmptiveReports' => PreEmptiveReport::latest('updated_at')
                ->limit(100)
                ->get(),
            
            'casualties' => Casualty::latest('updated_at')
                ->limit(200)
                ->get(),
                
            'injured' => Injured::latest('updated_at')
                ->limit(200)
                ->get(),
                
            'missing' => Missing::latest('updated_at')
                ->limit(200)
                ->get(),
        ]);
    }
}
