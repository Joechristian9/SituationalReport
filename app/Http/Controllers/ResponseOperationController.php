<?php

namespace App\Http\Controllers;

use App\Models\ResponseOperation;
use App\Models\Modification;
use App\Traits\ValidatesTyphoonStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResponseOperationController extends Controller
{
    use ValidatesTyphoonStatus;
    /**
     * Display a listing of the resource.
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $operationsQuery = ResponseOperation::when($typhoonId, fn($q) => $q->where('typhoon_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $operationsQuery->where('user_id', $user->id);
        }

        $operations = $operationsQuery->latest()->limit(200)->get();

        return inertia('ResponseOperations/Index', [
            'operations' => $operations,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Handles bulk creation/update with modification tracking.
     */
    public function store(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'responses' => 'required|array',
            'responses.*.id' => 'nullable|integer',
            'responses.*.team_unit' => 'nullable|string|max:255',
            'responses.*.incident'  => 'nullable|string|max:255',
            'responses.*.datetime'  => 'nullable|date',
            'responses.*.location'  => 'nullable|string|max:255',
            'responses.*.actions'   => 'nullable|string',
            'responses.*.remarks'   => 'nullable|string',
        ]);

        foreach ($validated['responses'] as $responseData) {
            // If an ID exists and is numeric, try to find and update that specific record
            if (!empty($responseData['id']) && is_numeric($responseData['id'])) {
                $operationQuery = ResponseOperation::where('id', $responseData['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $operationQuery->where('user_id', $user->id);
                }

                $operation = $operationQuery->first();
                if ($operation) {
                    // Update existing record
                    $operation->update([
                        'team_unit' => $responseData['team_unit'] ?? null,
                        'incident'  => $responseData['incident'] ?? null,
                        'datetime'  => $responseData['datetime'] ?? null,
                        'location'  => $responseData['location'] ?? null,
                        'actions'   => $responseData['actions'] ?? null,
                        'remarks'   => $responseData['remarks'] ?? null,
                        'typhoon_id' => $activeTyphoon->id,
                        'updated_by' => Auth::id(),
                    ]);
                } else {
                    // ID provided but doesn't exist in DB - treat as new record
                    $isEmpty = empty(array_filter($responseData, function ($value) {
                        return !is_null($value) && $value !== '';
                    }));

                    if (!$isEmpty) {
                        ResponseOperation::create([
                            'team_unit' => $responseData['team_unit'] ?? null,
                            'incident'  => $responseData['incident'] ?? null,
                            'datetime'  => $responseData['datetime'] ?? null,
                            'location'  => $responseData['location'] ?? null,
                            'actions'   => $responseData['actions'] ?? null,
                            'remarks'   => $responseData['remarks'] ?? null,
                            'user_id'   => Auth::id(),
                            'updated_by' => Auth::id(),
                            'typhoon_id' => $activeTyphoon->id,
                        ]);
                    }
                }
            }
            // If no ID or null, it's a new record. We create it.
            else {
                // Skip rows if all values are null/empty
                $isEmpty = empty(array_filter($responseData, function ($value) {
                    return !is_null($value) && $value !== '';
                }));

                if ($isEmpty) {
                    continue;
                }

                ResponseOperation::create([
                    'team_unit' => $responseData['team_unit'] ?? null,
                    'incident'  => $responseData['incident'] ?? null,
                    'datetime'  => $responseData['datetime'] ?? null,
                    'location'  => $responseData['location'] ?? null,
                    'actions'   => $responseData['actions'] ?? null,
                    'remarks'   => $responseData['remarks'] ?? null,
                    'user_id'   => Auth::id(),
                    'updated_by' => Auth::id(),
                    'typhoon_id' => $activeTyphoon->id,
                ]);
            }
        }

        // Return the fresh data after save
        $user = Auth::user();

        $updatedQuery = ResponseOperation::with('user:id,name')
            ->where('typhoon_id', $activeTyphoon->id);

        if ($user && !$user->isAdmin()) {
            $updatedQuery->where('user_id', $user->id);
        }

        $updatedOperations = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->get();
        
        return response()->json([
            'message' => 'Response operations saved successfully!',
            'responses' => $updatedOperations
        ]);
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ResponseOperation $responseOperation)
    {
        $validated = $request->validate([
            'team_unit' => 'required|string|max:255',
            'incident' => 'required|string|max:255',
            'datetime' => 'required|date',
            'location' => 'nullable|string|max:255',
            'actions' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $responseOperation->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Response operation updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ResponseOperation $responseOperation)
    {
        $responseOperation->delete();

        return redirect()->back()->with('success', 'Response operation deleted successfully.');
    }

    /**
     * Get modification history for response operations
     */
    public function getModifications()
    {
        $modifications = Modification::where('model_type', 'ResponseOperation')
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by model_id and field to track modifications per row
        $history = [];
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            foreach ($mod->changed_fields as $field => $change) {
                // Key format: "modelId_field" to track each row+field combination
                $key = $modelId . '_' . $field;
                $history[$key][] = [
                    'user' => $change['user'] ?? ['id' => $mod->user->id, 'name' => $mod->user->name],
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'date' => $mod->created_at,
                    'model_id' => $modelId,
                ];
            }
        }

        $latest = $modifications->first();
        if ($latest) {
            $latestChangedFields = [];
            foreach ($latest->changed_fields as $field => $change) {
                $latestChangedFields[$field] = [
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'user' => $change['user'] ?? ['id' => $latest->user->id, 'name' => $latest->user->name],
                ];
            }
            $latest->changed_fields = $latestChangedFields;
        }

        return response()->json([
            'history' => $history,
            'latest'  => $latest,
        ]);
    }
}
