<?php

namespace App\Http\Controllers;

use App\Models\Injured;
use App\Models\Modification;
use App\Models\Typhoon;
use App\Services\Barangays;
use App\Traits\AuthorizesRecordWrites;
use App\Traits\BuildsSubmissionList;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InjuredController extends Controller
{
    use AuthorizesRecordWrites, BuildsSubmissionList, ValidatesDisasterStatus;

    /**
     * Display a listing of the injured records.
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $injuredQuery = Injured::when($typhoonId, fn ($q) => $q->where('disaster_id', $typhoonId));

        if ($user && ! $user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $injuredQuery->whereIn('user_id', $accessibleUserIds);
        }

        $injuredList = $injuredQuery->latest()->limit(200)->get();

        return Inertia::render('IncidentMonitored/Index', [
            'injuredList' => $injuredList,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Handles bulk creation from the form.
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
            'injured' => 'required|array',
            'injured.*.id' => 'nullable',
            'injured.*.name' => 'nullable|string|max:255',
            'injured.*.age' => 'nullable|integer',
            'injured.*.sex' => 'nullable|string|max:255',
            'injured.*.barangay' => ['nullable', 'string', 'max:255', Barangays::rule()],
            'injured.*.address' => 'nullable|string',
            'injured.*.diagnosis' => 'nullable|string',
            'injured.*.date_admitted' => 'nullable|date',
            'injured.*.place_of_incident' => 'nullable|string|max:255',
            'injured.*.remarks' => 'nullable|string',
        ]);

        $savedInjured = [];

        foreach ($validated['injured'] as $injuredData) {
            // Copy injured data but exclude sex and id for empty check
            $dataToCheck = $injuredData;
            unset($dataToCheck['sex']);
            unset($dataToCheck['id']);
            // Pre-filled on new rows, so on its own it does not make a row worth saving.
            unset($dataToCheck['barangay']);

            // Remove empty values (null, '', whitespace, 0, '0')
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return ! is_null($value)
                    && trim((string) $value) !== ''
                    && $value !== 0
                    && $value !== '0';
            });

            // If nothing left → means only sex was filled OR everything else empty/zero → skip
            if (empty($dataToCheck)) {
                continue;
            }

            $data = [
                'name' => $injuredData['name'] ?? null,
                'age' => $injuredData['age'] ?? null,
                'sex' => $injuredData['sex'] ?? null,
                'barangay' => Barangays::forRow($injuredData['barangay'] ?? null, Auth::user()),
                'address' => $injuredData['address'] ?? null,
                'diagnosis' => $injuredData['diagnosis'] ?? null,
                'date_admitted' => $injuredData['date_admitted'] ?? null,
                'place_of_incident' => $injuredData['place_of_incident'] ?? null,
                'remarks' => $injuredData['remarks'] ?? null,
                'updated_by' => Auth::id(),
            ];

            // Check if this is an update or create
            if (! empty($injuredData['id']) && is_numeric($injuredData['id'])) {
                // Update existing record (only own records for non-admin users)
                $injuredQuery = Injured::where('id', $injuredData['id']);

                $user = Auth::user();
                if ($user && ! $user->isAdmin()) {
                    $accessibleUserIds = $user->getAccessibleUserIds('write');
                    $injuredQuery->whereIn('user_id', $accessibleUserIds);
                }

                $injuredRecord = $injuredQuery->first();
                if ($injuredRecord) {
                    $injuredRecord->update($data);
                    $savedInjured[] = $injuredRecord->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $data['disaster_id'] = $activeTyphoon->id;
                $savedInjured[] = Injured::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Injured report saved successfully.',
                'injured' => $savedInjured,
            ]);
        }

        return back()->with('success', 'Injured report saved successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Injured $injured)
    {
        $this->authorizeRecordWrite($injured);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'sex' => 'nullable|string|max:255',
            'barangay' => ['nullable', 'string', 'max:255', Barangays::rule()],
            'address' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'date_admitted' => 'nullable|date',
            'place_of_incident' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        if (array_key_exists('barangay', $validated)) {
            $validated['barangay'] = Barangays::match($validated['barangay']);
        }

        $injured->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Injured record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Injured $injured)
    {
        $injured->delete();

        return back()->with('success', 'Injured record deleted successfully.');
    }

    /**
     * Get modification history for Injured records
     */
    public function getModifications()
    {
        $modifications = Modification::forActiveDisaster(Injured::class)
            ->with('user')
            ->latest()
            ->get();

        $history = [];

        foreach ($modifications as $mod) {
            foreach ($mod->changed_fields as $field => $change) {
                $key = "{$mod->model_id}_{$field}";

                if (! isset($history[$key])) {
                    $history[$key] = [];
                }

                $history[$key][] = [
                    'old' => $change['old'] ?? null,
                    'new' => $change['new'] ?? null,
                    'user' => [
                        'id' => $change['user']['id'] ?? null,
                        'name' => $change['user']['name'] ?? 'Unknown',
                    ],
                    'date' => $mod->created_at,
                ];
            }
        }

        return response()->json(['history' => $history]);
    }

    /**
     * Show injured submissions page (Admin only)
     */
    public function submissions(Request $request): Response
    {
        return $this->submissionsPage($request, Injured::class, 'injured', ['name', 'barangay', 'address', 'diagnosis'], 'Admin/InjuredSubmissions', 'injured');
    }
}
