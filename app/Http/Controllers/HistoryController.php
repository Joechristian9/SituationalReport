<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoryController extends Controller
{
    /**
     * Display batch history - showing all ended disasters grouped by year range
     */
    public function index()
    {
        // Get all ended typhoons with their year ranges
        $disasters = Typhoon::where('status', 'ended')
            ->orderBy('ended_at', 'desc')
            ->get()
            ->map(function ($typhoon) {
                $startYear = $typhoon->started_at ? $typhoon->started_at->format('Y') : null;
                $endYear = $typhoon->ended_at ? $typhoon->ended_at->format('Y') : null;
                
                // Create year range label (e.g., "2026-27" or "2026")
                if ($startYear && $endYear) {
                    $yearRange = $startYear === $endYear 
                        ? $startYear 
                        : $startYear . '-' . substr($endYear, -2);
                } else {
                    $yearRange = $startYear ?? $endYear ?? 'Unknown';
                }
                
                return [
                    'id' => $typhoon->id,
                    'name' => $typhoon->name,
                    'type' => $typhoon->type,
                    'description' => $typhoon->description,
                    'started_at' => $typhoon->started_at?->format('M d, Y'),
                    'ended_at' => $typhoon->ended_at?->format('M d, Y'),
                    'year_range' => $yearRange,
                    'start_year' => $startYear,
                    'end_year' => $endYear,
                    'pdf_path' => $typhoon->pdf_path,
                ];
            })
            ->groupBy('year_range')
            ->map(function ($disasters, $yearRange) {
                return [
                    'year_range' => $yearRange,
                    'disasters' => $disasters->values()->toArray(),
                    'count' => $disasters->count(),
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('Admin/BatchHistory', [
            'batches' => $disasters,
        ]);
    }

    /**
     * Display detail view for a specific disaster batch (year range)
     */
    public function show($yearRange)
    {
        // Parse year range (e.g., "2026-27" or "2026")
        if (strpos($yearRange, '-') !== false) {
            [$startYear, $endYearShort] = explode('-', $yearRange);
            $endYear = substr($startYear, 0, 2) . $endYearShort;
        } else {
            $startYear = $endYear = $yearRange;
        }
        
        // Get all disasters within this year range
        $disasters = Typhoon::where('status', 'ended')
            ->whereYear('started_at', '>=', $startYear)
            ->whereYear('ended_at', '<=', $endYear)
            ->orderBy('ended_at', 'desc')
            ->get()
            ->map(function ($typhoon) {
                return [
                    'id' => $typhoon->id,
                    'name' => $typhoon->name,
                    'type' => $typhoon->type,
                    'description' => $typhoon->description,
                    'started_at' => $typhoon->started_at?->format('M d, Y h:i A'),
                    'ended_at' => $typhoon->ended_at?->format('M d, Y h:i A'),
                    'pdf_path' => $typhoon->pdf_path,
                ];
            });

        return Inertia::render('Admin/BatchHistoryDetail', [
            'yearRange' => $yearRange,
            'disasters' => $disasters,
        ]);
    }
}
