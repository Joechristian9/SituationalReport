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
use Illuminate\Support\Arr;
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

        $disasterId = $activeTyphoon->id;

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
            // Environment tab only: sent when that tab asks for them, not on every visit,
            // and only the columns its graphs read.
            'weatherReports' => Inertia::optional(fn () => WeatherReport::where('disaster_id', $disasterId)
                ->latest()
                ->limit(50)
                ->get(['id', 'municipality', 'sky_condition', 'wind', 'precipitation', 'sea_condition', 'updated_at'])),
            'waterLevels' => Inertia::optional(fn () => WaterLevel::where('disaster_id', $disasterId)
                ->latest()
                ->limit(50)
                ->get(['id', 'gauging_station', 'current_level', 'alarm_level', 'critical_level', 'updated_at'])),
            // Totals per barangay, summed in SQL: a row limit here would silently cut the totals
            // once a disaster has more evacuation-center rows than the limit.
            'preEmptiveReports' => Inertia::optional(fn () => PreEmptiveReport::where('disaster_id', $disasterId)
                ->whereNotNull('barangay')
                ->groupBy('barangay')
                ->selectRaw('barangay, SUM(families) as inside_families, SUM(persons) as inside_persons, SUM(outside_families) as outside_families, SUM(outside_persons) as outside_persons, SUM(total_families) as total_families, SUM(total_persons) as total_persons')
                ->toBase()
                ->get()
                // MySQL returns SUM() as a string (null when every value is null).
                ->map(fn ($row) => ['barangay' => $row->barangay, ...array_map('intval', Arr::except((array) $row, 'barangay'))])),
            'casualties' => $casualties,
            'injured' => $injured,
            'missing' => $missing,
            'impactSummary' => HumanImpactStats::forDisaster($activeTyphoon),
            'recentImpact' => HumanImpactStats::recent($activeTyphoon, 50),
            'newReportCounts' => ReportView::newCountsFor($activeTyphoon->id),
        ]);
    }
}
