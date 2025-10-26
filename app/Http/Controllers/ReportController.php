<?php

namespace App\Http\Controllers;

use App\Models\ElectricityService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon; // Import Carbon for date handling

// Import your models
use App\Models\WeatherReport;
use App\Models\WaterLevel;

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

        return [
            'weatherReports'    => $weatherReports,
            'waterLevelReports' => $waterLevelReports,
            'electricityReports' => $electricityReports,
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
