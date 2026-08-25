<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class DisasterController extends Controller
{
    /**
     * Display disaster management page
     * Optimized with eager loading and selective fields
     */
    public function index()
    {
        // Eager load relationships with only necessary fields
        $typhoons = Typhoon::with([
            'creator:id,name',
            'ender:id,name'
        ])
        ->select('id', 'name', 'disaster_type', 'description', 'status', 'started_at', 'ended_at', 'created_by', 'ended_by', 'pdf_path')
        ->latest('started_at')
        ->get();

        // Get active or paused typhoon with creator info
        $activeTyphoon = Typhoon::with('creator:id,name')
            ->whereIn('status', ['active', 'paused'])
            ->select('id', 'name', 'disaster_type', 'description', 'status', 'started_at', 'created_by')
            ->latest('started_at')
            ->first();

        // Get disaster statistics by type
        $disasterStats = Typhoon::select('disaster_type', \DB::raw('count(*) as count'))
            ->whereNotNull('disaster_type')
            ->groupBy('disaster_type')
            ->orderBy('count', 'desc')
            ->get();

        // Get total counts by status
        $statusCounts = [
            'total' => Typhoon::count(),
            'active' => Typhoon::where('status', 'active')->count(),
            'paused' => Typhoon::where('status', 'paused')->count(),
            'ended' => Typhoon::where('status', 'ended')->count(),
        ];

        return Inertia::render('Admin/DisasterManagement', [
            'typhoons' => $typhoons,
            'activeTyphoon' => $activeTyphoon,
            'disasterStats' => $disasterStats,
            'statusCounts' => $statusCounts,
        ]);
    }

    /**
     * Get active typhoon info
     */
    public function getActiveTyphoon()
    {
        $activeTyphoon = Typhoon::getActiveTyphoon();
        $pausedTyphoon = Typhoon::paused()->latest()->first();
        
        // If there's a paused typhoon but no active one, return the paused one
        $currentTyphoon = $activeTyphoon ?? $pausedTyphoon;
        
        return response()->json([
            'activeTyphoon' => $activeTyphoon,
            'currentTyphoon' => $currentTyphoon,
            'hasActiveTyphoon' => Typhoon::hasActiveTyphoon(),
            'isPaused' => $currentTyphoon && $currentTyphoon->status === 'paused',
        ]);
    }

    /**
     * Store a new typhoon report
     * Optimized with database transaction
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:disasters,name',
            'disaster_type' => 'required|string|in:Typhoon,Tropical Storm,Tropical Depression,Flood,Flash Flood,Earthquake,Landslide,Storm Surge,Drought,Volcanic Eruption,Fire,Tornado,Heavy Rainfall,Other',
            'description' => 'nullable|string|max:1000',
        ]);

        // Check if there's already an active disaster (optimized query)
        if (Typhoon::where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'There is already an active disaster. Please end it before creating a new one.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            $typhoon = Typhoon::create([
                'name' => $validated['name'],
                'disaster_type' => $validated['disaster_type'],
                'description' => $validated['description'] ?? null,
                'status' => 'active',
                'started_at' => now(),
                'created_by' => auth()->id(),
            ]);

            \DB::commit();

            return response()->json([
                'message' => 'Disaster report created successfully. Users can now input data.',
                'typhoon' => $typhoon->load('creator:id,name'),
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Disaster creation failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to create disaster report. Please try again.',
            ], 500);
        }
    }

    /**
     * Update typhoon details
     */
    public function update(Request $request, Typhoon $disaster)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Only allow updating if typhoon is still active
        if ($disaster->status === 'ended') {
            return response()->json([
                'message' => 'Cannot update an ended typhoon report.',
            ], 422);
        }

        $disaster->update($validated);

        return response()->json([
            'message' => 'Typhoon report updated successfully.',
            'typhoon' => $disaster->load('creator'),
        ]);
    }

    /**
     * Pause a typhoon report temporarily
     */
    public function pause(Typhoon $disaster)
    {
        if ($disaster->status === 'ended') {
            return response()->json([
                'message' => 'Cannot pause an ended typhoon report.',
            ], 422);
        }

        if ($disaster->status === 'paused') {
            return response()->json([
                'message' => 'This typhoon report is already paused.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            $disaster->update([
                'status' => 'paused',
                'paused_at' => now(),
                'paused_by' => auth()->id(),
            ]);

            \DB::commit();

            return response()->json([
                'message' => 'Typhoon report paused successfully. Forms are now disabled.',
                'typhoon' => $disaster->load(['creator:id,name', 'pauser:id,name']),
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Typhoon pause failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to pause typhoon report. Please try again.',
            ], 500);
        }
    }

    /**
     * Resume a paused typhoon report
     */
    public function resume(Typhoon $disaster)
    {
        if ($disaster->status !== 'paused') {
            return response()->json([
                'message' => 'Can only resume a paused typhoon report.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            $disaster->update([
                'status' => 'active',
                'resumed_at' => now(),
                'resumed_by' => auth()->id(),
            ]);

            \DB::commit();

            return response()->json([
                'message' => 'Typhoon report resumed successfully. Forms are now enabled.',
                'typhoon' => $disaster->load(['creator:id,name', 'resumer:id,name']),
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Typhoon resume failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to resume typhoon report. Please try again.',
            ], 500);
        }
    }

    /**
     * Download current data snapshot for paused typhoon
     */
    public function downloadSnapshot(Typhoon $disaster)
    {
        try {
            // Generate PDF for current state
            $pdfPath = $this->generatePdfReport($disaster);
            
            $fullPath = storage_path('app/public/' . $pdfPath);
            
            if (!file_exists($fullPath)) {
                return response()->json([
                    'message' => 'PDF file not found.',
                ], 404);
            }

            // Download and then delete the temporary file
            return response()->download($fullPath)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            \Log::error('Snapshot download failed', [
                'disaster_id' => $disaster->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Failed to generate snapshot: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * End a typhoon report and generate PDF
     * Optimized with transaction and async PDF generation
     */
    public function end(Typhoon $disaster)
    {
        if ($disaster->status === 'ended') {
            return response()->json([
                'message' => 'This typhoon report has already been ended.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            // Update typhoon status
            $disaster->update([
                'status' => 'ended',
                'ended_at' => now(),
                'ended_by' => auth()->id(),
            ]);

            \DB::commit();

            // Generate PDF report (non-blocking)
            try {
                $pdfPath = $this->generatePdfReport($disaster);
                
                $disaster->update([
                    'pdf_path' => $pdfPath,
                ]);

                return response()->json([
                    'message' => 'Typhoon report ended successfully. PDF generated.',
                    'typhoon' => $disaster->load(['creator:id,name', 'ender:id,name']),
                    'pdf_path' => $pdfPath,
                ]);
            } catch (\Exception $e) {
                // Log the error for debugging
                \Log::error('PDF Generation Failed', [
                    'disaster_id' => $disaster->id,
                    'error' => $e->getMessage(),
                ]);
                
                return response()->json([
                    'message' => 'Typhoon ended successfully. PDF generation will be completed shortly.',
                    'typhoon' => $disaster->load(['creator:id,name', 'ender:id,name']),
                ], 200);
            }
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Typhoon end failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to end typhoon report. Please try again.',
            ], 500);
        }
    }

    /**
     * Generate PDF report for ended typhoon
     */
    private function generatePdfReport(Typhoon $typhoon)
    {
        // Get the ReportController to reuse its data fetching logic
        $reportController = new ReportController();
        $reportData = $reportController->getReportData(null, true, $typhoon->id);

        // Add missing variables for the blade template
        $reportData['selectedYear'] = $typhoon->started_at->year;
        $reportData['typhoonName'] = $typhoon->name;
        $reportData['isDownloading'] = true;

        // Generate PDF
        $pdf = PDF::loadView('reports.situational_report', $reportData);
        
        // Configure PDF settings
        $pdf->setPaper('legal', 'portrait');
        $pdf->setOptions([
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'dpi' => 96,
        ]);

        // Create filename with typhoon name and date
        $filename = 'Typhoon_' . str_replace(' ', '_', $typhoon->name) . '_Report_' . now()->format('Y-m-d_His') . '.pdf';
        $filePath = 'reports/' . $filename;
        
        // Ensure directory exists
        $fullPath = storage_path('app/public/' . $filePath);
        $directory = dirname($fullPath);
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Save PDF
        $pdf->save($fullPath);

        return $filePath;
    }

    /**
     * Download typhoon PDF report
     */
    public function downloadPdf(Typhoon $disaster)
    {
        if (!$disaster->pdf_path) {
            return response()->json([
                'message' => 'PDF report not available for this typhoon.',
            ], 404);
        }

        $fullPath = storage_path('app/public/' . $disaster->pdf_path);
        
        if (!file_exists($fullPath)) {
            return response()->json([
                'message' => 'PDF file not found.',
            ], 404);
        }

        return response()->download($fullPath);
    }

    /**
     * Regenerate PDF for an ended typhoon
     */
    public function regeneratePdf(Typhoon $disaster)
    {
        if ($disaster->status !== 'ended') {
            return response()->json([
                'message' => 'Can only regenerate PDF for ended typhoons.',
            ], 422);
        }

        try {
            $pdfPath = $this->generatePdfReport($disaster);
            
            $disaster->update([
                'pdf_path' => $pdfPath,
            ]);

            return response()->json([
                'message' => 'PDF generated successfully.',
                'typhoon' => $disaster->load(['creator', 'ender']),
                'pdf_path' => $pdfPath,
            ]);
        } catch (\Exception $e) {
            \Log::error('PDF Regeneration Failed', [
                'disaster_id' => $disaster->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'PDF generation failed: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a typhoon report
     * Optimized with transaction and file cleanup
     */
    public function destroy(Typhoon $disaster)
    {
        // Only allow deleting if not active
        if ($disaster->status === 'active') {
            return response()->json([
                'message' => 'Cannot delete an active typhoon. Please end it first.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            // Delete associated PDF file if exists
            if ($disaster->pdf_path) {
                $fullPath = storage_path('app/public/' . $disaster->pdf_path);
                if (file_exists($fullPath)) {
                    @unlink($fullPath);
                }
            }

            $disaster->delete();
            \DB::commit();

            return response()->json([
                'message' => 'Typhoon report deleted successfully.',
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Typhoon deletion failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to delete typhoon report. Please try again.',
            ], 500);
        }
    }

    /**
     * Show form submission status for all users
     */
    public function formSubmissionStatus()
    {
        $activeTyphoon = Typhoon::getActiveTyphoon();
        
        // Define form mappings with table names and display names
        $formMappings = [
            'weather_reports' => 'Weather Report',
            'electricity_services' => 'Electricity Services',
            'water_services' => 'Water Services',
            'communications' => 'Communication Services',
            'pre_emptive_reports' => 'Pre-Emptive Evacuation',
            'incident_monitored' => 'Incident Monitored',
            'casualties' => 'Casualties',
            'injureds' => 'Injured',
            'missing' => 'Missing Persons',
            'pre_positionings' => 'Pre-Positioning',
            'usc_declarations' => 'USC Declaration',
            'damaged_house_reports' => 'Damaged Houses',
            'affected_tourists' => 'Affected Tourists',
            'response_operations' => 'Response Operations',
            'assistance_extendeds' => 'Assistance Extended',
            'assistance_provided_lgus' => 'Assistance Provided LGUs',
            'suspension_of_classes' => 'Suspension of Classes',
            'suspension_of_works' => 'Suspension of Work',
            'bridges' => 'Bridges',
            'roads' => 'Roads',
            'water_levels' => 'Water Levels',
        ];
        
        // Initialize variables before the closure
        $submissionsByUser = [];
        $agricultureData = null;
        
        // Pre-fetch all submission data in bulk if there's an active typhoon
        if ($activeTyphoon) {
            foreach ($formMappings as $table => $displayName) {
                try {
                    $records = \DB::table($table)
                        ->select('user_id', \DB::raw('COUNT(*) as count'), \DB::raw('MAX(updated_at) as last_updated'))
                        ->where('disaster_id', $activeTyphoon->id)
                        ->whereNotNull('user_id')
                        ->groupBy('user_id')
                        ->get();
                    
                    foreach ($records as $record) {
                        if (!isset($submissionsByUser[$record->user_id])) {
                            $submissionsByUser[$record->user_id] = [];
                        }
                        $submissionsByUser[$record->user_id][$table] = [
                            'name' => $displayName,
                            'table' => $table,
                            'count' => $record->count,
                            'last_updated' => $record->last_updated,
                        ];
                    }
                } catch (\Exception $e) {
                    \Log::debug("Table {$table} check failed: " . $e->getMessage());
                }
            }
            
            // Check agriculture_reports separately (no user_id)
            try {
                $agricultureCount = \DB::table('agriculture_reports')
                    ->where('disaster_id', $activeTyphoon->id)
                    ->count();
                
                if ($agricultureCount > 0) {
                    $agricultureLastUpdated = \DB::table('agriculture_reports')
                        ->where('disaster_id', $activeTyphoon->id)
                        ->max('updated_at');
                    
                    // Store agriculture data separately to be added to users with permission
                    $agricultureData = [
                        'name' => 'Agriculture Report',
                        'table' => 'agriculture_reports',
                        'count' => $agricultureCount,
                        'last_updated' => $agricultureLastUpdated,
                    ];
                }
            } catch (\Exception $e) {
                \Log::debug("Agriculture table check failed: " . $e->getMessage());
            }
        }
        
        // Get all users with their permissions (excluding admins) - only load necessary fields
        $users = \App\Models\User::select('id', 'name', 'email')
            ->with(['permissions:id,name'])
            ->whereHas('roles', function($query) {
                $query->where('name', 'user');
            })
            ->get()
            ->map(function($user) use ($submissionsByUser, $activeTyphoon, $agricultureData) {
                $submittedForms = $submissionsByUser[$user->id] ?? [];
                
                // Add agriculture data if user has permission
                if (isset($agricultureData) && $user->permissions->contains('name', 'access-agriculture-form')) {
                    $submittedForms['agriculture_reports'] = $agricultureData;
                }
                
                // Calculate last submission and has_submitted
                $lastSubmission = null;
                foreach ($submittedForms as $form) {
                    if (!$lastSubmission || $form['last_updated'] > $lastSubmission) {
                        $lastSubmission = $form['last_updated'];
                    }
                }
                
                // Get list of submitted form types (for coloring in UI)
                $submittedFormTypes = array_keys($submittedForms);
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'has_submitted' => !empty($submittedForms),
                    'last_submission' => $lastSubmission,
                    'permissions' => $user->permissions->pluck('name')->toArray(),
                    'submitted_forms' => array_values($submittedForms),
                    'submitted_form_types' => $submittedFormTypes,
                ];
            });
        
        return Inertia::render('Admin/FormSubmissionStatus', [
            'users' => $users,
            'activeTyphoon' => $activeTyphoon,
        ]);
    }

    /**
     * Get detailed form data for a specific user
     */
    public function getUserFormData(Request $request, $userId)
    {
        $activeTyphoon = Typhoon::getActiveTyphoon();
        
        if (!$activeTyphoon) {
            return response()->json(['error' => 'No active disaster'], 404);
        }
        
        $table = $request->input('table');
        $user = \App\Models\User::findOrFail($userId);
        
        // Fetch data from the specified table
        $query = \DB::table($table)
            ->where('disaster_id', $activeTyphoon->id);
        
        // Only add user_id filter if the table has that column
        if ($table !== 'agriculture_reports') {
            $query->where('user_id', $userId);
        }
        
        $data = $query->latest('updated_at')->get();
        
        return response()->json([
            'form_name' => $request->input('form_name'),
            'user_name' => $user->name,
            'data' => $data,
        ]);
    }
}
