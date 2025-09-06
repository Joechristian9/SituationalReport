<?php

namespace App\Http\Controllers;

use App\Models\WeatherReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia; // Make sure Inertia is imported

class WeatherReportController extends Controller
{
    /**
     * Display a listing of the resource.
     * This will show all the saved weather reports.
     */
    public function index()
    {
        $weatherReports = WeatherReport::with('user') // ✅ include user
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('SituationReports/Index', [
            'weatherReports' => $weatherReports,
        ]);
    }


    /**
     * Display the weather report creation form.
     */
    /* public function create()
    {
        return Inertia::render('SituationReports/Create');
    } */

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'reports' => 'required|array|min:1',
            'reports.*.municipality'   => 'nullable|string|max:255',
            'reports.*.sky_condition'  => 'nullable|string|max:255',
            'reports.*.wind'           => 'nullable|string|max:255',
            'reports.*.precipitation'  => 'nullable|string|max:255',
            'reports.*.sea_condition'  => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validatedData) {
            foreach ($validatedData['reports'] as $reportData) {
                if (
                    empty($reportData['municipality']) &&
                    empty($reportData['sky_condition']) &&
                    empty($reportData['wind']) &&
                    empty($reportData['precipitation']) &&
                    empty($reportData['sea_condition'])
                ) {
                    continue;
                }

                WeatherReport::create(array_merge($reportData, [
                    'user_id' => auth()->id(),
                ]));
            }
        });

        return Redirect::route('situation-reports.index')
            ->with('success', 'Weather reports saved successfully!');
    }
}
