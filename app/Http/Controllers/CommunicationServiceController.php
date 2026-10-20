<?php

namespace App\Http\Controllers;

use App\Models\CommunicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommunicationServiceController extends Controller
{
    public function index()
    {
        $services = CommunicationService::active()->ordered()->get()->groupBy('category');

        return response()->json([
            'services' => $services,
        ]);
    }

    public function store(Request $request)
    {
        // Services are shared fields on every barangay's form, so only admins change the list.
        abort_unless(Auth::user()->hasRole('admin'), 403, 'Only admins can add communication services');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:cellphone,internet,radio',
        ]);

        // Get the highest order number for this category
        $maxOrder = CommunicationService::where('category', $validated['category'])->max('order') ?? 0;

        $service = CommunicationService::create([
            'name' => strtoupper($validated['name']),
            'category' => $validated['category'],
            'order' => $maxOrder + 1,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Service added successfully',
            'service' => $service,
        ]);
    }

    public function destroy($id)
    {
        abort_unless(Auth::user()->hasRole('admin'), 403, 'Only admins can remove communication services');

        $service = CommunicationService::findOrFail($id);

        // Soft delete by setting is_active to false instead of actually deleting
        // This preserves historical data
        $service->update(['is_active' => false]);

        return response()->json([
            'message' => 'Service removed successfully',
        ]);
    }
}
