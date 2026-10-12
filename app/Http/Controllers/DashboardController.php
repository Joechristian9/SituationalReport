<?php

namespace App\Http\Controllers;

use App\Models\Casualty;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\ReportView;
use App\Models\Typhoon;
use App\Models\WaterLevel;
use App\Models\WeatherReport;
use App\Services\DisasterHistory;
use App\Services\HumanImpactStats;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Only admins have a dashboard; everyone else works from their report forms.
     * `dashboard` stays as the generic landing route (auth redirects, links), so it
     * shows the dashboard to admins and forwards everyone else to their home page,
     * keeping any flash message for that page.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            $request->session()->reflash();

            return redirect()->route($request->user()->homeRoute());
        }

        return $this->adminDashboard($request);
    }

    /** Data for both active and paused disasters, so the graphs keep showing history. */
    private function adminDashboard(Request $request): Response
    {
        // latest() matches the shared `typhoon.active` prop, so the header and the data agree.
        $activeTyphoon = Typhoon::whereIn('status', ['active', 'paused'])->latest()->first();

        if (! $activeTyphoon) {
            // No disaster at all - return empty data
            return Inertia::render('Admin/Dashboard', [
                'weatherReports' => [],
                'waterLevels' => [],
                'preEmptiveReports' => [],
                'casualties' => [],
                'injured' => [],
                'missing' => [],
                'impactSummary' => HumanImpactStats::forDisaster(null),
                'recentImpact' => [],
                'newReportCounts' => ReportView::newCountsFor(null),
                // Nothing to monitor: show the history of past disasters instead.
                'history' => fn () => DisasterHistory::for($request->only(['type', 'barangay', 'metric'])),
            ]);
        }

        $weatherReports = WeatherReport::where('disaster_id', $activeTyphoon->id)
            ->with('user:id,name')
            ->latest()
            ->limit(50)
            ->get();

        $waterLevels = WaterLevel::where('disaster_id', $activeTyphoon->id)
            ->with('user:id,name')
            ->latest()
            ->limit(50)
            ->get();

        $preEmptiveReports = PreEmptiveReport::where('disaster_id', $activeTyphoon->id)
            ->with('user:id,name')
            ->latest()
            ->limit(100)
            ->get();

        // All records (no limit) but only the columns the graphs use, so totals stay correct.
        $casualties = Casualty::where('disaster_id', $activeTyphoon->id)
            ->latest()
            ->get(['id', 'sex', 'age', 'cause_of_death', 'created_at']);

        $injured = Injured::where('disaster_id', $activeTyphoon->id)
            ->latest()
            ->get(['id', 'sex', 'age', 'diagnosis', 'created_at']);

        $missing = Missing::where('disaster_id', $activeTyphoon->id)
            ->latest()
            ->get(['id', 'sex', 'age', 'cause', 'created_at']);

        return Inertia::render('Admin/Dashboard', [
            'weatherReports' => $weatherReports,
            'waterLevels' => $waterLevels,
            'preEmptiveReports' => $preEmptiveReports,
            'casualties' => $casualties,
            'injured' => $injured,
            'missing' => $missing,
            'impactSummary' => HumanImpactStats::forDisaster($activeTyphoon),
            'recentImpact' => HumanImpactStats::recent($activeTyphoon, 50),
            'newReportCounts' => ReportView::newCountsFor($activeTyphoon->id),
        ]);
    }
}
