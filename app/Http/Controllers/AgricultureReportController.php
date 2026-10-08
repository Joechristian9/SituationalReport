<?php

namespace App\Http\Controllers;

use App\Models\AgricultureReport;
use App\Models\Modification;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\Request;
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
            ->when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId))
            ->latest()
            ->limit(200)
            ->get();

        // Group by typhoon
        $groupedByTyphoon = $agriculture->groupBy('disaster_id')->map(function ($reports, $typhoonId) {
            $typhoon = $reports->first()->typhoon;

            return [
                'typhoon' => $typhoon,
                'reports' => $reports->values(),
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
            'crops.*.id' => 'nullable|integer',
            'crops.*.crops_affected' => 'nullable|string|max:255',
            'crops.*.standing_crop_ha' => 'nullable|numeric|min:0',
            'crops.*.stage_of_crop' => 'nullable|string|max:255',
            'crops.*.total_area_affected_ha' => 'nullable|numeric|min:0',
            'crops.*.total_production_loss' => 'nullable|numeric|min:0',
            'crops.*.remarks' => 'nullable|string',
        ]);

        $typhoonId = $this->getActiveTyphoonId();
        $fields = ['crops_affected', 'standing_crop_ha', 'stage_of_crop', 'total_area_affected_ha', 'total_production_loss', 'remarks'];

        DB::beginTransaction();
        try {
            // Update saved crops in place (keeps their ids, so the change history and
            // audit trail stay attached) and create the new ones.
            $savedCrops = [];
            foreach ($validated['crops'] as $cropData) {
                $values = array_map(fn ($field) => $cropData[$field] ?? null, array_combine($fields, $fields));
                if (array_filter($values, fn ($value) => $value !== null && $value !== '') === []) {
                    continue; // a cleared row is removed below
                }

                $crop = empty($cropData['id'])
                    ? null
                    : AgricultureReport::where('disaster_id', $typhoonId)->find($cropData['id']);

                if ($crop) {
                    $crop->update($values);
                } else {
                    $crop = AgricultureReport::create(['disaster_id' => $typhoonId] + $values);
                }
                $savedCrops[] = $crop;
            }

            // One shared list per disaster: crops left out or cleared were removed in the form.
            // Deleted through Eloquent so the audit observer records each one.
            AgricultureReport::where('disaster_id', $typhoonId)
                ->whereNotIn('id', array_map(fn ($crop) => $crop->id, $savedCrops))
                ->get()
                ->each->delete();

            DB::commit();

            return response()->json([
                'message' => 'Agriculture reports saved successfully',
                'agriculture' => $savedCrops,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'message' => 'Failed to save agriculture reports',
            ], 500);
        }
    }

    /**
     * Get modification history for Agriculture Reports
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'AgricultureReport')
            ->with('user:id,name')
            ->latest()
            ->get();

        $history = [];

        foreach ($modifications as $mod) {
            $changedFields = is_string($mod->changed_fields)
                ? json_decode($mod->changed_fields, true)
                : $mod->changed_fields;

            if (! is_array($changedFields)) {
                continue;
            }

            foreach ($changedFields as $fieldName => $fieldData) {
                $key = "{$mod->model_id}_{$fieldName}";

                if (! isset($history[$key])) {
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
            'history' => (object) $history,
        ]);
    }
}
