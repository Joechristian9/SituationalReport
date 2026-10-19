<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use App\Models\User;
use App\Notifications\FormReminder;
use App\Services\DisasterSummary;
use App\Services\PendingForms;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

use function Illuminate\Support\defer;

class DisasterController extends Controller
{
    /**
     * Report tables (with a user_id column) shown on the form submission status page.
     * Also the only tables getUserFormData() may read, so request input never picks the table.
     */
    private const FORM_TABLES = PendingForms::FORM_TABLES;

    /**
     * Disaster management page. One query: the page derives the current disaster, the
     * status counts and the per-type tiles from this list, so they never disagree with it.
     */
    public function index()
    {
        $typhoons = Typhoon::with([
            'creator:id,name',
            'ender:id,name',
        ])
            ->select('id', 'name', 'disaster_type', 'description', 'status', 'started_at', 'ended_at', 'created_by', 'ended_by', 'pdf_path')
            ->latest('started_at')
            ->get();

        return Inertia::render('Admin/DisasterManagement', [
            'typhoons' => $typhoons,
        ]);
    }

    /**
     * The current disaster (active or paused) for pages that poll it. One query; the keys
     * are kept for the pages that read them.
     */
    public function getActiveTyphoon()
    {
        $current = Typhoon::getActiveTyphoon();

        return response()->json([
            'activeTyphoon' => $current,
            'currentTyphoon' => $current,
            'hasActiveTyphoon' => $current !== null,
            'isPaused' => $current?->status === 'paused',
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
            'disaster_type' => ['required', 'string', Rule::in(Typhoon::TYPES)],
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
            'typhoon' => $disaster->load('creator:id,name'),
        ]);
    }

    /**
     * Pause a typhoon report temporarily
     */
    /**
     * Totals for the "View details" dialog, loaded when it opens instead of for every row.
     */
    public function summary(Typhoon $disaster): JsonResponse
    {
        return response()->json(DisasterSummary::for($disaster));
    }

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
                'message' => "{$disaster->name} is paused. Forms are closed until you resume it.",
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
                'message' => "{$disaster->name} has resumed. Forms are open again.",
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

            $fullPath = storage_path('app/public/'.$pdfPath);

            if (! file_exists($fullPath)) {
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
                'message' => 'Failed to generate snapshot: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * End a disaster report. The final PDF takes several seconds to render, so it is
     * built after the response is sent (there is no queue worker on the host). If that
     * fails, downloading the report from the history table generates it on demand.
     */
    public function end(Typhoon $disaster): JsonResponse
    {
        if ($disaster->status === 'ended') {
            return response()->json([
                'message' => 'This disaster report has already been ended.',
            ], 422);
        }

        $disaster->update([
            'status' => 'ended',
            'ended_at' => now(),
            'ended_by' => auth()->id(),
        ]);

        defer(function () use ($disaster) {
            if ($disaster->fresh()->pdf_path) {
                return;
            }

            try {
                $disaster->update(['pdf_path' => $this->generatePdfReport($disaster)]);
            } catch (\Throwable $e) {
                \Log::error('PDF Generation Failed', [
                    'disaster_id' => $disaster->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });

        return response()->json([
            'message' => "{$disaster->name} has ended. Forms are now closed.",
            'typhoon' => $disaster->load(['creator:id,name', 'ender:id,name']),
        ]);
    }

    /**
     * Generate PDF report for ended typhoon
     */
    private function generatePdfReport(Typhoon $typhoon)
    {
        // Get the ReportController to reuse its data fetching logic
        $reportController = new ReportController;
        $reportData = $reportController->getReportData(null, true, $typhoon->id);

        // Add missing variables for the blade template
        $reportData['selectedYear'] = $typhoon->started_at->year;
        $reportData['typhoonName'] = $typhoon->name;
        $reportData['isDownloading'] = true;

        // Generate PDF
        $pdf = Pdf::loadView('reports.situational_report', $reportData);

        // Configure PDF settings
        $pdf->setPaper('legal', 'portrait');
        $pdf->setOptions([
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'dpi' => 96,
        ]);

        // Create filename with typhoon name and date
        $filename = 'Typhoon_'.str_replace(' ', '_', $typhoon->name).'_Report_'.now()->format('Y-m-d_His').'.pdf';
        $filePath = 'reports/'.$filename;

        // Ensure directory exists
        $fullPath = storage_path('app/public/'.$filePath);
        $directory = dirname($fullPath);
        if (! file_exists($directory)) {
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
        if (! $disaster->pdf_path) {
            return response()->json([
                'message' => 'PDF report not available for this typhoon.',
            ], 404);
        }

        $fullPath = storage_path('app/public/'.$disaster->pdf_path);

        if (! file_exists($fullPath)) {
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
                'typhoon' => $disaster->load(['creator:id,name', 'ender:id,name']),
                'pdf_path' => $pdfPath,
            ]);
        } catch (\Exception $e) {
            \Log::error('PDF Regeneration Failed', [
                'disaster_id' => $disaster->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'PDF generation failed: '.$e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a typhoon report
     * Optimized with transaction and file cleanup
     */
    public function destroy(Request $request, Typhoon $disaster)
    {
        // Deleting can't be undone: the admin re-enters their password, so an unattended session can't do it.
        $request->validate(['password' => ['required', 'current_password']]);

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
                $fullPath = storage_path('app/public/'.$disaster->pdf_path);
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

        // Every form's per-account figures in one query (plus one for the shared agriculture
        // list), instead of one query per form; this page refreshes itself every 30 seconds.
        $submissionsByUser = [];
        $agricultureData = null;

        if ($activeTyphoon) {
            foreach (PendingForms::submissionsByUser($activeTyphoon) as $userId => $forms) {
                foreach ($forms as $table => $figures) {
                    $submissionsByUser[$userId][$table] = ['name' => PendingForms::label($table), 'table' => $table] + $figures;
                }
            }

            if ($agriculture = PendingForms::agricultureSubmission($activeTyphoon)) {
                // Shared by every account that holds the agriculture form.
                $agricultureData = ['name' => PendingForms::label(PendingForms::AGRICULTURE_TABLE), 'table' => PendingForms::AGRICULTURE_TABLE] + $agriculture;
            }
        }

        $remindedAt = $activeTyphoon ? FormReminder::lastSentByUser($activeTyphoon) : [];

        // Get all users with their permissions (excluding admins) - only load necessary fields
        $users = User::select('id', 'name', 'email')
            ->with(['permissions:id,name'])
            ->whereHas('roles', function ($query) {
                $query->where('name', 'user');
            })
            ->get()
            ->map(function ($user) use ($submissionsByUser, $agricultureData, $remindedAt, $activeTyphoon) {
                $submittedForms = $submissionsByUser[$user->id] ?? [];

                // Add agriculture data if user has permission
                if (isset($agricultureData) && $user->permissions->contains('name', 'access-agriculture-form')) {
                    $submittedForms['agriculture_reports'] = $agricultureData;
                }

                // Calculate last submission and has_submitted
                $lastSubmission = null;
                foreach ($submittedForms as $form) {
                    if (! $lastSubmission || $form['last_updated'] > $lastSubmission) {
                        $lastSubmission = $form['last_updated'];
                    }
                }

                // Get list of submitted form types (for coloring in UI)
                $submittedFormTypes = array_keys($submittedForms);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'has_submitted' => ! empty($submittedForms),
                    'last_submission' => $lastSubmission,
                    'permissions' => $user->permissions->pluck('name')->toArray(),
                    'submitted_forms' => array_values($submittedForms),
                    'submitted_form_types' => $submittedFormTypes,
                    // Forms the account still has to file, and when an admin last reminded it.
                    'pending_forms' => $activeTyphoon
                        ? array_map([PendingForms::class, 'label'], PendingForms::missing($user->permissions->pluck('name')->all(), $submittedFormTypes))
                        : [],
                    'reminded_at' => ($remindedAt[$user->id] ?? null)?->toIso8601String(),
                ];
            });

        return Inertia::render('Admin/FormSubmissionStatus', [
            'users' => $users,
            // Only what the page reads.
            'activeTyphoon' => $activeTyphoon?->only(['id', 'name', 'status']),
        ]);
    }

    /**
     * Get detailed form data for a specific user
     */
    public function getUserFormData(Request $request, $userId)
    {
        $validated = $request->validate([
            'table' => ['required', 'string', Rule::in([...array_keys(self::FORM_TABLES), 'agriculture_reports'])],
            'form_name' => ['nullable', 'string', 'max:255'],
        ]);

        $activeTyphoon = Typhoon::getActiveTyphoon();

        if (! $activeTyphoon) {
            return response()->json(['error' => 'No active disaster'], 404);
        }

        $table = $validated['table'];
        $user = User::findOrFail($userId);

        // Fetch data from the specified table
        $query = \DB::table($table)
            ->where('disaster_id', $activeTyphoon->id);

        // Only add user_id filter if the table has that column
        if ($table !== 'agriculture_reports') {
            $query->where('user_id', $userId);
        }

        $data = $query->latest('updated_at')->get();

        return response()->json([
            'form_name' => $validated['form_name'] ?? null,
            'user_name' => $user->name,
            'data' => $data,
        ]);
    }
}
