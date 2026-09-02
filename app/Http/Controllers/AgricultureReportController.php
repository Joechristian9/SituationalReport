<?php

namespace App\Http\Controllers;

use App\Models\AgricultureReport;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AgricultureReportController extends Controller
{
    use ValidatesDisasterStatus;

    /**
     * Display agriculture report history page
     */
    public function history()
    {
        return inertia('AgricultureHistory/Index');
    }

    /**
     * API endpoint for agriculture report history
     */
    public function apiHistory()
    {
        $typhoonId = $this->getActiveTyphoonId();
        
        $agriculture = AgricultureReport::with(['typhoon', 'typhoon.creator'])
            ->when($typhoonId, fn($q) => $q->where('disaster_id', $typhoonId))
            ->latest()
            ->limit(200)
            ->get();

        // Group by typhoon
        $groupedByTyphoon = $agriculture->groupBy('disaster_id')->map(function ($reports, $typhoonId) {
            $typhoon = $reports->first()->typhoon;
            return [
                'typhoon' => $typhoon,
                'reports' => $reports->values()
            ];
        })->values();

        return response()->json($groupedByTyphoon);
    }

    /**
     * Store agriculture reports
     */
    public function store(Request $request)
    {
        // Check if there's an active typhoon
        $validationError = $this->validateActiveTyphoon();
        if ($validationError) {
            return $validationError;
        }

        $validated = $request->validate([
            'crops' => 'required|array',
            'crops.*.crops_affected' => 'nullable|string|max:255',
            'crops.*.standing_crop_ha' => 'nullable|numeric|min:0',
            'crops.*.stage_of_crop' => 'nullable|string|max:255',
            'crops.*.total_area_affected_ha' => 'nullable|numeric|min:0',
            'crops.*.total_production_loss' => 'nullable|numeric|min:0',
            'crops.*.remarks' => 'nullable|string',
        ]);

        $typhoonId = $this->getActiveTyphoonId();
        $userId = Auth::id();

        DB::beginTransaction();
        try {
            // Delete existing reports for this typhoon and user
            AgricultureReport::where('disaster_id', $typhoonId)->delete();

            // Create new reports
            $savedCrops = [];
            foreach ($validated['crops'] as $cropData) {
                // Skip empty rows
                if (empty($cropData['crops_affected']) && 
                    empty($cropData['standing_crop_ha']) && 
                    empty($cropData['stage_of_crop']) &&
                    empty($cropData['total_area_affected_ha']) &&
                    empty($cropData['total_production_loss'])) {
                    continue;
                }

                $crop = AgricultureReport::create([
                    'disaster_id' => $typhoonId,
                    'crops_affected' => $cropData['crops_affected'] ?? null,
                    'standing_crop_ha' => $cropData['standing_crop_ha'] ?? null,
                    'stage_of_crop' => $cropData['stage_of_crop'] ?? null,
                    'total_area_affected_ha' => $cropData['total_area_affected_ha'] ?? null,
                    'total_production_loss' => $cropData['total_production_loss'] ?? null,
                    'remarks' => $cropData['remarks'] ?? null,
                ]);

                $savedCrops[] = $crop;
            }

            DB::commit();

            return response()->json([
                'message' => 'Agriculture reports saved successfully',
                'agriculture' => $savedCrops
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save agriculture reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get modification history for Agriculture Reports
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'AgricultureReport')
            ->with('user:id,name')
            ->latest()
            ->get();

        $history = [];

        foreach ($modifications as $mod) {
            $changedFields = is_string($mod->changed_fields) 
                ? json_decode($mod->changed_fields, true) 
                : $mod->changed_fields;
            
            if (!is_array($changedFields)) {
                continue;
            }
            
            foreach ($changedFields as $fieldName => $fieldData) {
                $key = "{$mod->model_id}_{$fieldName}";
                
                if (!isset($history[$key])) {
                    $history[$key] = [];
                }
                
                $history[$key][] = [
                    'user' => $mod->user ?? ['name' => $fieldData['user']['name'] ?? 'Unknown'],
                    'field' => $fieldName,
                    'old' => $fieldData['old'] ?? null,
                    'new' => $fieldData['new'] ?? null,
                    'date' => $mod->created_at,
                ];
            }
        }

        return response()->json([
            'history' => (object)$history,
        ]);
    }
}
