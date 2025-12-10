<?php

namespace App\Http\Controllers;

use App\Models\AffectedTourist;
use App\Models\Bridge;
use App\Models\Casualty;
use App\Models\DamagedHouseReport;
use App\Models\ElectricityService;
use App\Models\IncidentMonitored;
use App\Models\Injured;
use App\Models\Missing;
use App\Models\PreEmptiveReport;
use App\Models\PrePositioning;
use App\Models\Road;
use App\Models\SuspensionOfClass;
use App\Models\UscDeclaration;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

// Import your other models
use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\SuspensionOfWork;
use App\Models\Communication;

class ReportController extends Controller
{
    /**
     * Fetch all necessary report data from the database based on a given year or typhoon_id.
     * Optimized: Different limits for web view vs PDF, selective columns
     * @param int|null $year Filter by year
     * @param bool $forPdf Use smaller limits for PDF generation
     * @param int|null $typhoonId Filter by specific typhoon instead of year
     */
    public function getReportData(?int $year = null, bool $forPdf = false, ?int $typhoonId = null)
    {
        // When generating PDF for a specific typhoon, include ALL history (no limit)
        // Otherwise use limits for performance
        $useLimit = !$typhoonId;
        $limit = $forPdf ? 100 : 500;
        
        // Build query condition - prioritize typhoon_id over year
        $queryCondition = function ($query) use ($year, $typhoonId) {
            if ($typhoonId) {
                // Filter by specific typhoon - includes ALL reports for this typhoon (history)
                return $query->where('typhoon_id', $typhoonId);
            } elseif ($year) {
                return $query->whereYear('created_at', $year);
            }
            return $query;
        };
        
        // Helper to apply limit conditionally
        $applyLimit = function ($query) use ($useLimit, $limit) {
            return $useLimit ? $query->limit($limit) : $query;
        };
        
        // Optimize with select and limit for performance
        $preEmptiveReports = $applyLimit($queryCondition(PreEmptiveReport::query())
            ->latest())
            ->get();
        $damagedHouses = $applyLimit($queryCondition(DamagedHouseReport::query())
            ->latest())
            ->get();

        return [
            'weatherReports'      => $applyLimit($queryCondition(WeatherReport::query())->latest())->get(),
            'waterLevelReports'   => $applyLimit($queryCondition(WaterLevel::query())->latest())->get(),
            'electricityReports'  => $applyLimit($queryCondition(ElectricityService::query())->latest())->get(),
            'waterServiceReports' => $applyLimit($queryCondition(WaterService::query())->latest())->get(),
            'communicationReports' => $applyLimit($queryCondition(Communication::query())->latest())->get(),
            'roadReports'         => $applyLimit($queryCondition(Road::query())->latest())->get(),
            'bridgeReports'       => $applyLimit($queryCondition(Bridge::query())->latest())->get(),
            'preEmptiveReports'   => $preEmptiveReports,
            'uscDeclarations'     => $applyLimit($queryCondition(UscDeclaration::query())->latest())->get(),
            'incidentReports'     => $applyLimit($queryCondition(IncidentMonitored::query())->latest())->get(),
            'prePositioningReports' => $applyLimit($queryCondition(PrePositioning::query())->latest())->get(),
            'deadCasualties'      => $applyLimit($queryCondition(Casualty::query())->latest())->get(),
            'injuredCasualties'   => $applyLimit($queryCondition(Injured::query())->latest())->get(),
            'missingCasualties'   => $applyLimit($queryCondition(Missing::query())->latest())->get(),
            'affectedTourists'    => $applyLimit($queryCondition(AffectedTourist::query())->latest())->get(),
            'damagedHouses'       => $damagedHouses,
            'suspensionOfClasses' => $applyLimit($queryCondition(SuspensionOfClass::query())->latest())->get(),
            'suspensionOfWork'    => $applyLimit($queryCondition(SuspensionOfWork::query())->latest())->get(),
            'preEmptiveTotals'    => [
                'families'         => $preEmptiveReports->sum('families'),
                'persons'          => $preEmptiveReports->sum('persons'),
                'outside_families' => $preEmptiveReports->sum('outside_families'),
                'outside_persons'  => $preEmptiveReports->sum('outside_persons'),
                'total_families'   => $preEmptiveReports->sum('total_families'),
                'total_persons'    => $preEmptiveReports->sum('total_persons'),
            ],
            'grandTotalPartially' => $damagedHouses->sum('partially'),
            'grandTotalTotally'   => $damagedHouses->sum('totally'),
            'grandTotal'          => $damagedHouses->sum('total'),
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

        // Get typhoon name from the most recent weather report
        $typhoonName = 'N/A';
        if (isset($data['weatherReports']) && $data['weatherReports']->count() > 0) {
            $latestReport = $data['weatherReports']->first();
            if (isset($latestReport->typhoon) && $latestReport->typhoon) {
                $typhoonName = $latestReport->typhoon->name ?? 'N/A';
            }
        }

        // Render the Blade view, passing the data and selected year.
        return view('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'typhoonName' => $typhoonName,
        ]));
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

        // Get typhoon name from the most recent weather report
        $typhoonName = 'N/A';
        if (isset($data['weatherReports']) && $data['weatherReports']->count() > 0) {
            $latestReport = $data['weatherReports']->first();
            if (isset($latestReport->typhoon) && $latestReport->typhoon) {
                $typhoonName = $latestReport->typhoon->name ?? 'N/A';
            }
        }

        // Load the same Blade view, but pass an 'isDownloading' flag.
        $pdf = Pdf::loadView('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'typhoonName' => $typhoonName,
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
