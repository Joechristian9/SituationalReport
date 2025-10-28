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
use Carbon\Carbon; // Import Carbon for date handling

// Import your models
use App\Models\WeatherReport;
use App\Models\WaterLevel;
use App\Models\WaterService;
use App\Models\SuspensionOfWork;

class ReportController extends Controller
{
    /**
     * Fetch filtered data from the database based on a given year.
     * @param int $year The year to filter the reports by.
     * @return array
     */
    private function getReportData(int $year)
    {
        $weatherReports = WeatherReport::whereYear('created_at', $year)->get();
        $waterLevelReports = WaterLevel::whereYear('created_at', $year)->get();
        $electricityReports = ElectricityService::whereYear('created_at', $year)->get();
        $waterServiceReports = WaterService::whereYear('created_at', $year)->get();
        $roadReports = Road::whereYear('created_at', $year)->get();
        $bridgeReports = Bridge::whereYear('created_at', $year)->get();
        $preEmptiveReports = PreEmptiveReport::whereYear('created_at', $year)->get();
        $uscDeclarations = UscDeclaration::whereYear('created_at', $year)->get();
        $incidentReports = IncidentMonitored::whereYear('created_at', $year)->get();
        $preEmptiveReports = PreEmptiveReport::whereYear('created_at', $year)->get();
        /* $prePositioningTotalPersonnel = $prePositioningReports->sum('personnel_deployed'); */
        $prePositioningReports = PrePositioning::whereYear('created_at', $year)->get();
        $deadCasualties = Casualty::whereYear('created_at', $year)->get();
        $injuredCasualties = Injured::whereYear('created_at', $year)->get();
        $missingCasualties = Missing::whereYear('created_at', $year)->get();
        $affectedTourists = AffectedTourist::whereYear('created_at', $year)->get();
        $damagedHouses = DamagedHouseReport::whereYear('created_at', $year)->get();
        $suspensionOfClasses = SuspensionOfClass::whereYear('created_at', $year)->get();
        $suspensionOfWork = SuspensionOfWork::whereYear('created_at', $year)->get();

        // **FIX:** Calculate totals based on the *filtered* $preEmptiveReports collection.
        $preEmptiveTotals = [
            'families'         => $preEmptiveReports->sum('families'),
            'persons'          => $preEmptiveReports->sum('persons'),
            'outside_families' => $preEmptiveReports->sum('outside_families'),
            'outside_persons'  => $preEmptiveReports->sum('outside_persons'),
            'total_families'   => $preEmptiveReports->sum('total_families'),
            'total_persons'    => $preEmptiveReports->sum('total_persons'),
        ];

        //damaged houses totals
        $grandTotalPartially = $damagedHouses->sum('partially');
        $grandTotalTotally = $damagedHouses->sum('totally');

        $grandTotal = $damagedHouses->sum('total');

        // **FIX:** Return the calculated totals along with the report data.
        return [
            'weatherReports'      => $weatherReports,
            'waterLevelReports'   => $waterLevelReports,
            'electricityReports'  => $electricityReports,
            'waterServiceReports' => $waterServiceReports,
            'roadReports'         => $roadReports,
            'bridgeReports'       => $bridgeReports,
            'preEmptiveReports'   => $preEmptiveReports,
            'uscDeclarations'     => $uscDeclarations,
            'preEmptiveTotals'    => $preEmptiveTotals,
            'prePositioningReports' => $prePositioningReports,
            /* 'prePositioningTotalPersonnel' => $prePositioningTotalPersonnel, */
            'incidentReports'     => $incidentReports,
            'deadCasualties'      => $deadCasualties,
            'injuredCasualties'   => $injuredCasualties,
            'missingCasualties'   => $missingCasualties,
            'affectedTourists'    => $affectedTourists,
            'damagedHouses'       => $damagedHouses,
            'grandTotalPartially' => $grandTotalPartially,
            'grandTotalTotally'   => $grandTotalTotally,
            'grandTotal'          => $grandTotal,
            'suspensionOfClasses' => $suspensionOfClasses,
            'suspensionOfWork'    => $suspensionOfWork,
        ];
    }

    /**
     * Display the consolidated report webpage with a year filter.
     */
    public function view(Request $request)
    {
        // 1. Determine the selected year. Use the request's 'year' input, or default to the current year.
        $selectedYear = $request->input('year', Carbon::now()->year);

        // 2. Generate a list of years for the dropdown (e.g., last 5 years up to the current year).
        $currentYear = Carbon::now()->year;
        $years = range($currentYear, $currentYear - 5); // [2025, 2024, 2023, 2022, 2021, 2020]

        // 3. Fetch the data for the selected year.
        $data = $this->getReportData($selectedYear);

        // 4. Pass the filtered data, the list of years, and the selected year to the view.
        return view('reports.situational_report', array_merge($data, [
            'years'        => $years,
            'selectedYear' => $selectedYear,
        ]));
    }

    /**
     * Generate and download the consolidated report as a PDF for a specific year.
     */
    public function download(Request $request)
    {
        // 1. Get the year from the download link's query parameter, or default to the current year.
        $selectedYear = $request->input('year', Carbon::now()->year);

        // 2. Fetch the data for that year.
        $data = $this->getReportData($selectedYear);

        // 3. Pass the data and selected year to the view for PDF generation.
        $pdf = Pdf::loadView('reports.situational_report', array_merge($data, [
            'selectedYear' => $selectedYear,
            'isDownloading' => true, // A flag to hide the dropdown in the PDF
        ]));

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download("situational-report-{$selectedYear}.pdf");
    }
}
