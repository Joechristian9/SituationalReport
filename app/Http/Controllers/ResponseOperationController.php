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
            'team_unit' => 'required|string|max:255',
            'incident' => 'required|string|max:255',
            'datetime' => 'required|date',
            'location' => 'nullable|string|max:255',
            'actions' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $operation = ResponseOperation::create([
            ...$validated,
            'user_id' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Response operation saved successfully.');
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
