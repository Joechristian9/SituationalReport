<?php

namespace App\Http\Controllers;

use App\Models\AffectedTourist;
use App\Models\AgricultureReport;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\Communication;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\SuspensionOfWork;
use App\Models\Typhoon;
use App\Models\UscDeclaration;
// Import your other models
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\WeatherReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Fetch all necessary report data from the database based on a given year or disaster_id.
     * Optimized: Different limits for web view vs PDF, selective columns
     *
     * @param  int|null  $year  Filter by year
     * @param  bool  $forPdf  Use smaller limits for PDF generation
     * @param  int|null  $typhoonId  Filter by specific typhoon instead of year
     */
    public function getReportData(?int $year = null, bool $forPdf = false, ?int $typhoonId = null)
    {
        // When generating PDF for a specific typhoon, include ALL history (no limit)
        // Otherwise use limits for performance
        $useLimit = ! $typhoonId;
        $limit = $forPdf ? 100 : 500;

        // Build query condition - prioritize disaster_id over year
        $queryCondition = function ($query) use ($year, $typhoonId) {
            if ($typhoonId) {
                // Filter by specific typhoon - includes ALL reports for this typhoon (history)
                return $query->where('disaster_id', $typhoonId);
            } elseif ($year) {
                return $query->whereYear('created_at', $year);
            }

            return $query;
        };

        // Sections cut off by the limit => how much of them is shown.
        $cutOffNotes = [];
        $latest = function (string $model, ?string $section = null, array $with = []) use ($queryCondition, $useLimit, $limit, &$cutOffNotes) {
            $query = $queryCondition($model::query());
            if (! $useLimit) {
                return (clone $query)->with($with)->latest()->get();
            }

            $rows = (clone $query)->with($with)->latest()->limit($limit)->get();
            if ($section && $rows->count() === $limit && ($total = $query->count()) > $limit) {
                $cutOffNotes[$section] = "latest {$limit} of {$total}";
            }

            return $rows;
        };

        // Totals come from SQL over every row, never from the capped lists: page and PDF both print these.
        $preEmptiveTotals = $queryCondition(PreEmptiveReport::query())->toBase()
            ->selectRaw('COALESCE(SUM(families), 0) as families, COALESCE(SUM(persons), 0) as persons, COALESCE(SUM(outside_families), 0) as outside_families, COALESCE(SUM(outside_persons), 0) as outside_persons, COALESCE(SUM(total_families), 0) as total_families, COALESCE(SUM(total_persons), 0) as total_persons')
            ->first();
        $houseTotals = $queryCondition(DamagedHouseReport::query())->toBase()
            ->selectRaw('COALESCE(SUM(partially), 0) as partially, COALESCE(SUM(totally), 0) as totally, COALESCE(SUM(total), 0) as total')
            ->first();

        $preEmptiveReports = $latest(PreEmptiveReport::class, 'Pre-emptive evacuation');
        $damagedHouses = $latest(DamagedHouseReport::class, 'Damaged houses');
        $communications = $latest(Communication::class, 'Communications', ['serviceValues.service:id,name,order']);

        return [
            'weatherReports' => $latest(WeatherReport::class, 'Weather'),
            'waterLevelReports' => $latest(WaterLevel::class),
            'electricityReports' => $latest(ElectricityService::class, 'Electricity'),
            'waterServiceReports' => $latest(WaterService::class, 'Water services'),
            'communicationReports' => $communications,
            // The services added to the form that these rows have a status for, as extra columns.
            'communicationServices' => $communications->flatMap->serviceValues
                ->filter(fn ($value) => $value->service && filled($value->status))
                ->pluck('service')
                ->unique('id')
                ->sortBy('order')
                ->values(),
            'roadReports' => $latest(Road::class, 'Roads'),
            'bridgeReports' => $latest(Bridge::class, 'Bridges'),
            'agricultureReports' => $latest(AgricultureReport::class, 'Agriculture'),
            'preEmptiveReports' => $preEmptiveReports,
            'uscDeclarations' => $latest(UscDeclaration::class, 'Declarations'),
            'incidentReports' => $latest(IncidentMonitored::class, 'Incidents'),
            'prePositioningReports' => $latest(PrePositioning::class, 'Pre-positioning'),
            'deadCasualties' => $latest(Casualty::class, 'Dead'),
            'injuredCasualties' => $latest(Injured::class, 'Injured'),
            'missingCasualties' => $latest(Missing::class, 'Missing'),
            'affectedTourists' => $latest(AffectedTourist::class, 'Affected tourists'),
            'damagedHouses' => $damagedHouses,
            'suspensionOfClasses' => $latest(SuspensionOfClass::class, 'Suspension of classes'),
            'suspensionOfWork' => $latest(SuspensionOfWork::class, 'Suspension of work'),
            'preEmptiveTotals' => array_map('intval', (array) $preEmptiveTotals),
            'grandTotalPartially' => (int) $houseTotals->partially,
            'grandTotalTotally' => (int) $houseTotals->totally,
            'grandTotal' => (int) $houseTotals->total,
            'cutOffNotes' => $cutOffNotes, // last: filled in by the $latest() calls above
        ];
    }

    /**
     * Display the consolidated report webpage for a selected year.
     */
    public function view(Request $request)
    {
        // Get the year from the request, or default to the current year.
        $selectedYear = $request->input('year', Carbon::now()->year);

        // Fetch the data for the selected year.
        $data = $this->getReportData($selectedYear);

        // Render the Blade view, passing the data and selected year.
        return view('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'reportSubject' => $this->yearSubject($selectedYear),
        ]));
    }

    /** Every disaster running at some point in the year, e.g. TYPHOON "KRISTINE", EARTHQUAKE "MAGNITUDE 6.5 ILAGAN"; just the year when there were none. */
    private function yearSubject(int|string $year): string
    {
        // Overlap, not start year: the report body goes by filing date, so a disaster crossing New Year has records in both years.
        $subject = Typhoon::whereYear('started_at', '<=', $year)
            ->where(fn ($query) => $query->whereNull('ended_at')->orWhereYear('ended_at', '>=', $year))
            ->orderBy('started_at')
            ->get(['name', 'disaster_type'])
            ->map(fn (Typhoon $disaster) => $disaster->reportSubject())
            ->implode(', ');

        return $subject !== '' ? $subject : "CY {$year}";
    }

    /**
     * Generate and download the consolidated report as a PDF for a specific year.
     * Optimized: Reduced data limits, improved DomPDF settings, disabled remote fonts
     */
    public function download(Request $request)
    {
        // Increase execution time and memory for PDF generation
        set_time_limit(120); // 2 minutes max
        ini_set('memory_limit', '256M');

        // Get the year from the request, or default to the current year.
        $selectedYear = $request->input('year', Carbon::now()->year);

        // Fetch the data for that year (with reduced limits for PDF)
        $data = $this->getReportData($selectedYear, true);

        // Load the same Blade view, but pass an 'isDownloading' flag.
        $pdf = Pdf::loadView('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'reportSubject' => $this->yearSubject($selectedYear),
            'isDownloading' => true, // This flag hides the download button in the PDF
        ]));

        // Optimize PDF settings for faster generation
        $pdf->setPaper('a4', 'portrait')
            ->setOption('enable_remote', false) // Disable remote resources
            ->setOption('enable_php', false)     // Disable PHP execution
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false)
            ->setOption('chroot', public_path()) // Restrict file access
            ->setOption('dpi', 96);              // Lower DPI for faster rendering

        return $pdf->download("situational-report-{$selectedYear}.pdf");
    }
}
