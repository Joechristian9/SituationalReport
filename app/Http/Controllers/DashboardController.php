<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use App\Models\PreEmptiveReport;
use App\Models\Casualty;
use Inertia\Inertia;
use App\Models\Injured;

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
            'casualties' => Casualty::all(),
            'injured' => Injured::all(),
        ]);
    }
}
