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
     * Fetch all necessary report data from the database based on a given year.
     * Optimized: Different limits for web view vs PDF, selective columns
     */
    private function getReportData(int $year, bool $forPdf = false)
    {
        // Use smaller limits for PDF generation (faster)
        $limit = $forPdf ? 100 : 500;
        
        // Optimize with select and limit for performance
        $preEmptiveReports = PreEmptiveReport::whereYear('created_at', $year)
            ->latest()
            ->limit($limit)
            ->get();
        $damagedHouses = DamagedHouseReport::whereYear('created_at', $year)
            ->latest()
            ->limit($limit)
            ->get();

        return [
            'weatherReports'      => WeatherReport::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'waterLevelReports'   => WaterLevel::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'electricityReports'  => ElectricityService::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'waterServiceReports' => WaterService::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'communicationReports' => Communication::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'roadReports'         => Road::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'bridgeReports'       => Bridge::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'preEmptiveReports'   => $preEmptiveReports,
            'uscDeclarations'     => UscDeclaration::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'incidentReports'     => IncidentMonitored::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'prePositioningReports' => PrePositioning::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'deadCasualties'      => Casualty::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'injuredCasualties'   => Injured::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'missingCasualties'   => Missing::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'affectedTourists'    => AffectedTourist::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'damagedHouses'       => $damagedHouses,
            'suspensionOfClasses' => SuspensionOfClass::whereYear('created_at', $year)->latest()->limit($limit)->get(),
            'suspensionOfWork'    => SuspensionOfWork::whereYear('created_at', $year)->latest()->limit($limit)->get(),
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
