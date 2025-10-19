<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\PreEmptiveReport;
use App\Models\Casualty; // Assuming this is your model name
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
            'weatherReports' => WeatherReport::select(
                'municipality',
                'wind',
                'precipitation',
                'updated_at'
            )->get(),
            'preEmptiveReports' => PreEmptiveReport::all(),
            'casualties' => Casualty::all(), // Add this line to pass casualty data
        ]);
    }
}
