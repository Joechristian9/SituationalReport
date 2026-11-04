<?php

namespace App\Http\Controllers;

use App\Models\Modification;
use App\Models\ResponseOperation;
use App\Models\Typhoon;
use App\Traits\AuthorizesRecordWrites;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ResponseOperationController extends Controller
{
    use AuthorizesRecordWrites, ValidatesDisasterStatus;

    /**
     * Display a listing of the resource.
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $operationsQuery = ResponseOperation::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $operationsQuery->whereIn('user_id', $accessibleUserIds);
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
        $activeTyphoon = Typhoon::getActiveTyphoon();

        $validated = $request->validate([
            'responses' => 'required|array',
            'responses.*.id' => 'nullable|integer',
            'responses.*.team_unit' => 'nullable|string|max:255',
            'responses.*.incident' => 'nullable|string|max:255',
            'responses.*.datetime' => 'nullable|date',
            'responses.*.location' => 'nullable|string|max:255',
            'responses.*.actions' => 'nullable|string',
            'responses.*.remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $activeTyphoon) {
            foreach ($validated['responses'] as $responseData) {
                // If an ID exists and is numeric, try to find and update that specific record
                if (! empty($responseData['id']) && is_numeric($responseData['id'])) {
                    // An id this account can't change is skipped. New rows always arrive with a null id.
                    $operation = $this->findWritableRecord(ResponseOperation::class, $responseData['id']);
                    if ($operation) {
                        // Update existing record
                        $operation->update([
                            'team_unit' => $responseData['team_unit'] ?? null,
                            'incident' => $responseData['incident'] ?? null,
                            'datetime' => $responseData['datetime'] ?? null,
                            'location' => $responseData['location'] ?? null,
                            'actions' => $responseData['actions'] ?? null,
                            'remarks' => $responseData['remarks'] ?? null,
                            'disaster_id' => $activeTyphoon->id,
                            'updated_by' => Auth::id(),
                        ]);
                    }
                }
                // If no ID or null, it's a new record. We create it.
                else {
                    // Skip rows if all values are null/empty
                    $isEmpty = empty(array_filter($responseData, function ($value) {
                        return ! is_null($value) && $value !== '';
                    }));

                    if ($isEmpty) {
                        continue;
                    }

                    ResponseOperation::create([
                        'team_unit' => $responseData['team_unit'] ?? null,
                        'incident' => $responseData['incident'] ?? null,
                        'datetime' => $responseData['datetime'] ?? null,
                        'location' => $responseData['location'] ?? null,
                        'actions' => $responseData['actions'] ?? null,
                        'remarks' => $responseData['remarks'] ?? null,
                        'user_id' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'disaster_id' => $activeTyphoon->id,
                    ]);
                }
            }
        });

        // Return the fresh data after save
        $user = Auth::user();

        $updatedQuery = ResponseOperation::with('user:id,name')
            ->where('disaster_id', $activeTyphoon->id);

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $updatedQuery->whereIn('user_id', $accessibleUserIds);
        }

        $updatedOperations = $updatedQuery
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Response operations saved successfully!',
            'responses' => $updatedOperations,
        ]);
    }

    /**
     * Get modification history for response operations
     */
    public function getModifications()
    {
        $modifications = Modification::forActiveDisaster(ResponseOperation::class)
            ->readableBy(Auth::user(), ResponseOperation::class)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by model_id and field to track modifications per row
        $history = [];
        foreach ($modifications as $mod) {
            $modelId = $mod->model_id;
            foreach ($mod->changed_fields as $field => $change) {
                // Key format: "modelId_field" to track each row+field combination
                $key = $modelId.'_'.$field;
                $history[$key][] = [
                    'user' => $change['user'] ?? ['id' => $mod->user->id, 'name' => $mod->user->name],
                    'old' => $change['old'] ?? null,
                    'new' => $change['new'] ?? null,
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
                    'old' => $change['old'] ?? null,
                    'new' => $change['new'] ?? null,
                    'user' => $change['user'] ?? ['id' => $latest->user->id, 'name' => $latest->user->name],
                ];
            }
            $latest->changed_fields = $latestChangedFields;
        }

        return response()->json([
            'history' => $history,
            'latest' => $latest,
        ]);
    }
}
