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
     * @param int|null $typhoonId Filter by specific typhoon instead of year (currently disabled)
     */
    public function getReportData(?int $year = null, bool $forPdf = false, ?int $typhoonId = null)
    {
        // Use smaller limits for PDF generation (faster)
        $limit = $forPdf ? 100 : 500;
        
        // Build query condition based on year only (typhoon_id filtering disabled to show all data)
        $queryCondition = function ($query) use ($year) {
            if ($year) {
                return $query->whereYear('created_at', $year);
            }
            return $query;
        };
        
        // Optimize with select and limit for performance
        $preEmptiveReports = $queryCondition(PreEmptiveReport::query())
            ->latest()
            ->limit($limit)
            ->get();
        $damagedHouses = $queryCondition(DamagedHouseReport::query())
            ->latest()
            ->limit($limit)
            ->get();

        return [
            'weatherReports'      => $queryCondition(WeatherReport::query())->latest()->limit($limit)->get(),
            'waterLevelReports'   => $queryCondition(WaterLevel::query())->latest()->limit($limit)->get(),
            'electricityReports'  => $queryCondition(ElectricityService::query())->latest()->limit($limit)->get(),
            'waterServiceReports' => $queryCondition(WaterService::query())->latest()->limit($limit)->get(),
            'communicationReports' => $queryCondition(Communication::query())->latest()->limit($limit)->get(),
            'roadReports'         => $queryCondition(Road::query())->latest()->limit($limit)->get(),
            'bridgeReports'       => $queryCondition(Bridge::query())->latest()->limit($limit)->get(),
            'preEmptiveReports'   => $preEmptiveReports,
            'uscDeclarations'     => $queryCondition(UscDeclaration::query())->latest()->limit($limit)->get(),
            'incidentReports'     => $queryCondition(IncidentMonitored::query())->latest()->limit($limit)->get(),
            'prePositioningReports' => $queryCondition(PrePositioning::query())->latest()->limit($limit)->get(),
            'deadCasualties'      => $queryCondition(Casualty::query())->latest()->limit($limit)->get(),
            'injuredCasualties'   => $queryCondition(Injured::query())->latest()->limit($limit)->get(),
            'missingCasualties'   => $queryCondition(Missing::query())->latest()->limit($limit)->get(),
            'affectedTourists'    => $queryCondition(AffectedTourist::query())->latest()->limit($limit)->get(),
            'damagedHouses'       => $damagedHouses,
            'suspensionOfClasses' => $queryCondition(SuspensionOfClass::query())->latest()->limit($limit)->get(),
            'suspensionOfWork'    => $queryCondition(SuspensionOfWork::query())->latest()->limit($limit)->get(),
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

        // Render the Blade view, passing the data and selected year.
        return view('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
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

        // Load the same Blade view, but pass an 'isDownloading' flag.
        $pdf = Pdf::loadView('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
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
