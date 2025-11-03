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

class ReportController extends Controller
{
    /**
     * Fetch all necessary report data from the database based on a given year.
     * Optimized: Uses eager loading and selective columns where possible
     */
    private function getReportData(int $year)
    {
        // Optimize with select and limit if needed for performance
        $preEmptiveReports = PreEmptiveReport::whereYear('created_at', $year)
            ->latest()
            ->limit(1000)
            ->get();
        $damagedHouses = DamagedHouseReport::whereYear('created_at', $year)
            ->latest()
            ->limit(1000)
            ->get();

        return [
            'weatherReports'      => WeatherReport::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'waterLevelReports'   => WaterLevel::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'electricityReports'  => ElectricityService::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'waterServiceReports' => WaterService::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'roadReports'         => Road::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'bridgeReports'       => Bridge::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'preEmptiveReports'   => $preEmptiveReports,
            'uscDeclarations'     => UscDeclaration::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'incidentReports'     => IncidentMonitored::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'prePositioningReports' => PrePositioning::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'deadCasualties'      => Casualty::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'injuredCasualties'   => Injured::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'missingCasualties'   => Missing::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'affectedTourists'    => AffectedTourist::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'damagedHouses'       => $damagedHouses,
            'suspensionOfClasses' => SuspensionOfClass::whereYear('created_at', $year)->latest()->limit(1000)->get(),
            'suspensionOfWork'    => SuspensionOfWork::whereYear('created_at', $year)->latest()->limit(1000)->get(),
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
     */
    public function download(Request $request)
    {
        // Get the year from the request, or default to the current year.
        $selectedYear = $request->input('year', Carbon::now()->year);

        // Fetch the data for that year.
        $data = $this->getReportData($selectedYear);

        // Load the same Blade view, but pass an 'isDownloading' flag.
        $pdf = Pdf::loadView('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'isDownloading' => true, // This flag hides the download button in the PDF
        ]));

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download("situational-report-{$selectedYear}.pdf");
    }
}
