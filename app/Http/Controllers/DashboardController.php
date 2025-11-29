<?php

namespace App\Http\Controllers;

use App\Models\ElectricityService;
use App\Models\WaterService;
use App\Models\Typhoon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $activeTyphoon = Typhoon::getActiveTyphoon();
        
        $electricityReport = null;
        $waterReport = null;

        // Only fetch reports if there's an active typhoon and user is not admin
        if ($activeTyphoon && $user && !$user->isAdmin()) {
            // Fetch latest electricity report for ISELCO users
            if ($user->can('access-electricity-form')) {
                $electricityReport = ElectricityService::where('typhoon_id', $activeTyphoon->id)
                    ->where('user_id', $user->id)
                    ->latest('updated_at')
                    ->first();
            }

            // Fetch latest water service report for IWD users
            if ($user->can('access-water-service-form')) {
                $waterReport = WaterService::where('typhoon_id', $activeTyphoon->id)
                    ->where('user_id', $user->id)
                    ->latest('updated_at')
                    ->first();
            }
        }

        return Inertia::render('Dashboard', [
            'electricityReport' => $electricityReport,
            'waterReport' => $waterReport,
        ]);
    }
}
