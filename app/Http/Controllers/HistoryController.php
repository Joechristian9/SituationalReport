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
     * Get form data by year and form type
     */
    public function getFormData(Request $request)
    {
        $yearValue = $request->get('year');
        $formType = $request->get('form_type');

        if (!$yearValue || !$formType) {
            return response()->json([]);
        }

        // Get disaster IDs for this year
        $year = Year::where('year', $yearValue)->first();
        
        if (!$year) {
            return response()->json([]);
        }

        $disasterIds = $year->typhoons()
            ->where('status', 'ended')
            ->pluck('id');

        if ($disasterIds->isEmpty()) {
            return response()->json([]);
        }

        // Fetch data based on form type
        $data = [];
        
        switch ($formType) {
            case 'weather':
                $data = \App\Models\WeatherReport::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'electricity':
                $data = \App\Models\ElectricityService::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'water-service':
                $data = \App\Models\WaterService::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'communication':
                $data = \App\Models\Communication::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'pre-emptive':
                $data = \App\Models\PreEmptiveReport::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'agriculture':
                $data = \App\Models\AgricultureReport::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'incident':
                $data = \App\Models\IncidentMonitored::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'road':
                $data = \App\Models\Road::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
            
            case 'bridge':
                $data = \App\Models\Bridge::whereIn('disaster_id', $disasterIds)
                    ->with(['user:id,name', 'typhoon:id,name'])
                    ->latest()
                    ->get();
                break;
        }

        return response()->json($data);
    }
}
