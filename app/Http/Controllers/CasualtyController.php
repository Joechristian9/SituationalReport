<?php

namespace App\Http\Controllers;

use App\Models\Casualty;
use App\Traits\ValidatesDisasterStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CasualtyController extends Controller
{
    use ValidatesDisasterStatus;
    /**
     * Show list of casualties
     * Optimized: Limit records for better performance
     */
    public function index()
    {
        $typhoonId = $this->getActiveTyphoonId();
        $user = Auth::user();

        $casualtiesQuery = Casualty::when($typhoonId, fn($q) => $q->where('disaster_id', $typhoonId));

        if ($user && !$user->isAdmin()) {
            $accessibleUserIds = $user->getAccessibleUserIds('read');
            $casualtiesQuery->whereIn('user_id', $accessibleUserIds);
        }

        $casualties = $casualtiesQuery->latest()->limit(200)->get();

        return Inertia::render('IncidentMonitored/Index', [
            'casualties' => $casualties,
        ]);
    }

    /**
     * Store casualties
     */
    public function store(Request $request)
    {
        // Validate typhoon status
        if ($error = $this->validateActiveTyphoon()) {
            return $error;
        }

        // Get active typhoon
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();
        
        \Log::info('CasualtyController store - Active Typhoon', [
            'typhoon' => $activeTyphoon ? $activeTyphoon->toArray() : 'NULL',
            'typhoon_id' => $activeTyphoon ? $activeTyphoon->id : 'NULL',
        ]);

        $validated = $request->validate([
            'casualties' => 'required|array',
            'casualties.*.id' => 'nullable',
            'casualties.*.name' => 'nullable|string|max:255',
            'casualties.*.age' => 'nullable|integer',
            'casualties.*.sex' => 'nullable|string|max:255',
            'casualties.*.address' => 'nullable|string|max:255',
            'casualties.*.cause_of_death' => 'nullable|string|max:255',
            'casualties.*.date_died' => 'nullable|date',
            'casualties.*.place_of_incident' => 'nullable|string|max:255',
        ]);

        $savedCasualties = [];

        foreach ($validated['casualties'] as $casualty) {
            // Copy casualty except "sex"
            $dataToCheck = $casualty;
            unset($dataToCheck['sex']);
            unset($dataToCheck['id']);

            // Remove empty values (null, '', whitespace, 0)
            $dataToCheck = array_filter($dataToCheck, function ($value) {
                return !is_null($value) && trim((string)$value) !== '' && $value !== 0 && $value !== '0';
            });

            // If nothing left → means only sex was filled OR everything else empty/zero → skip
            if (empty($dataToCheck)) {
                continue;
            }

            $data = [
                'name'              => $casualty['name'] ?? null,
                'age'               => $casualty['age'] ?? null,
                'sex'               => $casualty['sex'] ?? null,
                'address'           => $casualty['address'] ?? null,
                'cause_of_death'    => $casualty['cause_of_death'] ?? null,
                'date_died'         => $casualty['date_died'] ?? null,
                'place_of_incident' => $casualty['place_of_incident'] ?? null,
                'updated_by'        => Auth::id(),
            ];

            // Check if this is an update or create
            if (!empty($casualty['id']) && is_numeric($casualty['id'])) {
                // Update existing record (only own records for non-admin users)
                $casualtyQuery = Casualty::where('id', $casualty['id']);

                $user = Auth::user();
                if ($user && !$user->isAdmin()) {
                    $accessibleUserIds = $user->getAccessibleUserIds('write');
                    $casualtyQuery->whereIn('user_id', $accessibleUserIds);
                }

                $casualtyRecord = $casualtyQuery->first();
                if ($casualtyRecord) {
                    $casualtyRecord->update($data);
                    $savedCasualties[] = $casualtyRecord->fresh();
                }
            } else {
                // Create new record
                $data['user_id'] = Auth::id();
                $data['disaster_id'] = $activeTyphoon->id;
                
                \Log::info('Creating new casualty', [
                    'user_id' => Auth::id(),
                    'disaster_id' => $activeTyphoon->id,
                    'data' => $data,
                ]);
                
                $savedCasualties[] = Casualty::create($data);
            }
        }

        // Return JSON response with saved records
        if ($request->expectsJson()) {
            \Log::info('Returning saved casualties', [
                'count' => count($savedCasualties),
                'casualties' => $savedCasualties,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Casualties report saved successfully.',
                'casualties' => $savedCasualties,
            ]);
        }

        return back()->with('success', 'Casualties report saved successfully.');
    }
    /**
     * Update specific casualty
     */
    public function update(Request $request, Casualty $casualty)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'sex' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'cause_of_death' => 'nullable|string|max:255',
            'date_died' => 'nullable|date',
            'place_of_incident' => 'nullable|string|max:255',
        ]);

        $casualty->update(array_merge($validated, [
            'updated_by' => Auth::id(),
        ]));

        return back()->with('success', 'Casualty updated successfully.');
    }

    /**
     * Get modification history for Casualties
     */
    public function getModifications()
    {
        $modifications = \App\Models\Modification::where('model_type', 'Casualty')
            ->with('user')
            ->latest()
            ->get();

        $history = [];

        foreach ($modifications as $mod) {
            foreach ($mod->changed_fields as $field => $change) {
                $key = "{$mod->model_id}_{$field}";

                if (!isset($history[$key])) {
                    $history[$key] = [];
                }

                $history[$key][] = [
                    'old'  => $change['old'] ?? null,
                    'new'  => $change['new'] ?? null,
                    'user' => [
                        'id'   => $change['user']['id'] ?? null,
                        'name' => $change['user']['name'] ?? 'Unknown',
                    ],
                    'date' => $mod->created_at,
                ];
            }
        }

        return response()->json(['history' => $history]);
    }

    /**
     * Show casualties submissions page (Admin only)
     */
    public function submissions(Request $request)
    {
        $query = Casualty::with(['user:id,name', 'updater:id,name']);

        // Filter by active typhoon if exists
        $activeTyphoon = \App\Models\Typhoon::getActiveTyphoon();
        if ($activeTyphoon) {
            $query->where('disaster_id', $activeTyphoon->id);
        }

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('cause_of_death', 'like', "%{$search}%");
            });
        }

        // User filter
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        // Date range filter
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $casualties = $query->latest('created_at')->paginate(20)->withQueryString();

        // Get all users for filter dropdown
        $users = \App\Models\User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/CasualtySubmissions', [
            'casualties' => $casualties,
            'users' => $users,
            'filters' => [
                'search' => $request->input('search'),
                'user_id' => $request->input('user_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
        ]);
    }
}
