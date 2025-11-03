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
        // Optimized: Reduced limits and lazy load for better initial page performance
        // Data will be paginated or loaded on-demand in the frontend
        return Inertia::render('Admin/Dashboard', [
            'weatherReports' => fn() => WeatherReport::latest('updated_at')
                ->limit(50)
                ->get(),
            
            'waterLevels' => fn() => WaterLevel::latest('updated_at')
                ->limit(30)
                ->get(),
            
            'preEmptiveReports' => fn() => PreEmptiveReport::latest('updated_at')
                ->limit(50)
                ->get(),
            
            'casualties' => fn() => Casualty::latest('updated_at')
                ->limit(50)
                ->get(),
                
            'injured' => fn() => Injured::latest('updated_at')
                ->limit(50)
                ->get(),
                
            'missing' => fn() => Missing::latest('updated_at')
                ->limit(50)
                ->get(),
        ]);
    }
}
