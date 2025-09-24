<?php

namespace App\Http\Controllers;

use App\Models\ResponseOperation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResponseOperationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $operations = ResponseOperation::latest()->paginate(10);

        return inertia('ResponseOperations/Index', [
            'operations' => $operations,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'responses' => 'required|array',

            'responses.*.team_unit' => 'nullable|string|max:255',
            'responses.*.incident'  => 'nullable|string|max:255',
            'responses.*.datetime'  => 'nullable|date',
            'responses.*.location'  => 'nullable|string|max:255',
            'responses.*.actions'   => 'nullable|string',
            'responses.*.remarks'   => 'nullable|string',
        ]);

        foreach ($validated['responses'] as $response) {
            // ✅ Skip rows if all values are null/empty
            $isEmpty = empty(array_filter($response, function ($value) {
                return !is_null($value) && $value !== '';
            }));

            if ($isEmpty) {
                continue;
            }

            ResponseOperation::create([
                'team_unit' => $response['team_unit'] ?? null,
                'incident'  => $response['incident'] ?? null,
                'datetime'  => $response['datetime'] ?? null,
                'location'  => $response['location'] ?? null,
                'actions'   => $response['actions'] ?? null,
                'remarks'   => $response['remarks'] ?? null,
                'user_id'   => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'Response operations saved successfully.');
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
}
