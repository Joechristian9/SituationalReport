<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use App\Models\Year;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoryController extends Controller
{
    /**
     * Display batch history - showing all ended disasters grouped by year
     */
    public function index()
    {
        // Get all years with their ended disasters
        $years = Year::with(['typhoons' => function ($query) {
            $query->where('status', 'ended')
                  ->orderBy('ended_at', 'desc');
        }])
        ->orderBy('year', 'desc')
        ->get()
        ->filter(function ($year) {
            return $year->typhoons->count() > 0; // Only show years with disasters
        })
        ->map(function ($year) {
            return [
                'year' => $year->year,
                'disasters' => $year->typhoons->map(function ($typhoon) {
                    return [
                        'id' => $typhoon->id,
                        'name' => $typhoon->name,
                        'disaster_type' => $typhoon->disaster_type,
                        'description' => $typhoon->description,
                        'started_at' => $typhoon->started_at?->format('M d, Y'),
                        'ended_at' => $typhoon->ended_at?->format('M d, Y'),
                        'pdf_path' => $typhoon->pdf_path,
                    ];
                })->toArray(),
                'count' => $year->typhoons->count(),
            ];
        })
        ->values()
        ->toArray();

        // Get all available years for selection
        $availableYears = Year::orderBy('year', 'desc')->get();

        return Inertia::render('Admin/BatchHistory', [
            'batches' => $years,
            'availableYears' => $availableYears,
        ]);
    }

    /**
     * Get all report data by year and disaster type
     */
    public function getAllData(Request $request)
    {
        $yearValue = $request->get('year');
        $disasterType = $request->get('disaster_type');

        if (!$yearValue || !$disasterType) {
            return response()->json([]);
        }

        // Get disaster IDs for this year and disaster type
        $year = Year::where('year', $yearValue)->first();
        
        if (!$year) {
            return response()->json([]);
        }

        $disasterIds = $year->typhoons()
            ->where('status', 'ended')
            ->where('disaster_type', $disasterType)
            ->pluck('id');

        if ($disasterIds->isEmpty()) {
            return response()->json([]);
        }

        // Fetch all report types for these disasters
        $allData = [];

        // Weather Reports
        $weatherData = \App\Models\WeatherReport::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Weather Report';
                return $item;
            });
        $allData = array_merge($allData, $weatherData->toArray());

        // Electricity Service
        $electricityData = \App\Models\ElectricityService::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Electricity Service';
                return $item;
            });
        $allData = array_merge($allData, $electricityData->toArray());

        // Water Service
        $waterData = \App\Models\WaterService::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Water Service';
                return $item;
            });
        $allData = array_merge($allData, $waterData->toArray());

        // Communication
        $commData = \App\Models\Communication::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Communication';
                return $item;
            });
        $allData = array_merge($allData, $commData->toArray());

        // Pre-Emptive Reports
        $preEmptiveData = \App\Models\PreEmptiveReport::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Pre-Emptive Report';
                return $item;
            });
        $allData = array_merge($allData, $preEmptiveData->toArray());

        // Agriculture Reports
        $agricultureData = \App\Models\AgricultureReport::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Agriculture Report';
                return $item;
            });
        $allData = array_merge($allData, $agricultureData->toArray());

        // Incident Monitored
        $incidentData = \App\Models\IncidentMonitored::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Incident Monitored';
                return $item;
            });
        $allData = array_merge($allData, $incidentData->toArray());

        // Roads
        $roadData = \App\Models\Road::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Road Status';
                return $item;
            });
        $allData = array_merge($allData, $roadData->toArray());

        // Bridges
        $bridgeData = \App\Models\Bridge::whereIn('disaster_id', $disasterIds)
            ->with(['user:id,name', 'typhoon:id,name,disaster_type'])
            ->latest()
            ->get()
            ->map(function($item) {
                $item->report_type = 'Bridge Status';
                return $item;
            });
        $allData = array_merge($allData, $bridgeData->toArray());

        // Sort by created_at descending
        usort($allData, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json($allData);
    }
}
