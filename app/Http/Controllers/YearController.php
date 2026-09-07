<?php

namespace App\Http\Controllers;

use App\Models\Year;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class YearController extends Controller
{
    /**
     * Get all years for selection
     */
    public function index()
    {
        $years = Year::orderBy('year', 'desc')->get();
        
        return response()->json($years);
    }

    /**
     * Store a new year
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => [
                'required',
                'integer',
                'min:1900',
                'max:2100',
                Rule::unique('years', 'year'),
            ],
        ]);

        $year = Year::create($validated);

        return response()->json([
            'message' => 'Year added successfully',
            'year' => $year,
        ], 201);
    }

    /**
     * Delete a year (only if no disasters are associated)
     */
    public function destroy(Year $year)
    {
        // Check if year has associated disasters
        if ($year->typhoons()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete year with associated disasters',
            ], 422);
        }

        $year->delete();

        return response()->json([
            'message' => 'Year deleted successfully',
        ]);
    }
}
