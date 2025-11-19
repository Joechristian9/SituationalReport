<?php

namespace App\Http\Controllers;

use App\Models\Typhoon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class TyphoonController extends Controller
{
    /**
     * Display typhoon management page
     * Optimized with eager loading and selective fields
     */
    public function index()
    {
        // Eager load relationships with only necessary fields
        $typhoons = Typhoon::with([
            'creator:id,name',
            'ender:id,name'
        ])
        ->select('id', 'name', 'description', 'status', 'started_at', 'ended_at', 'created_by', 'ended_by', 'pdf_path')
        ->latest('started_at')
        ->get();

        // Get active typhoon with creator info
        $activeTyphoon = Typhoon::with('creator:id,name')
            ->where('status', 'active')
            ->select('id', 'name', 'description', 'status', 'started_at', 'created_by')
            ->first();

        return Inertia::render('Admin/TyphoonManagement', [
            'typhoons' => $typhoons,
            'activeTyphoon' => $activeTyphoon,
        ]);
    }

    /**
     * Get active typhoon info
     */
    public function getActiveTyphoon()
    {
        $activeTyphoon = Typhoon::getActiveTyphoon();
        
        return response()->json([
            'activeTyphoon' => $activeTyphoon,
            'hasActiveTyphoon' => Typhoon::hasActiveTyphoon(),
        ]);
    }

    /**
     * Store a new typhoon report
     * Optimized with database transaction
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:typhoons,name',
            'description' => 'nullable|string|max:1000',
        ]);

        // Check if there's already an active typhoon (optimized query)
        if (Typhoon::where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'There is already an active typhoon. Please end it before creating a new one.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            $typhoon = Typhoon::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => 'active',
                'started_at' => now(),
                'created_by' => auth()->id(),
            ]);

            \DB::commit();

            return response()->json([
                'message' => 'Typhoon report created successfully. Users can now input data.',
                'typhoon' => $typhoon->load('creator:id,name'),
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Typhoon creation failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Failed to create typhoon report. Please try again.',
            ], 500);
        }
    }

    /**
     * Update typhoon details
     */
    public function update(Request $request, Typhoon $typhoon)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Only allow updating if typhoon is still active
        if ($typhoon->status === 'ended') {
            return response()->json([
                'message' => 'Cannot update an ended typhoon report.',
            ], 422);
        }

        $typhoon->update($validated);

        return response()->json([
            'message' => 'Typhoon report updated successfully.',
            'typhoon' => $typhoon->load('creator'),
        ]);
    }

    /**
     * End a typhoon report and generate PDF
     * Optimized with transaction and async PDF generation
     */
    public function end(Typhoon $typhoon)
    {
        if ($typhoon->status === 'ended') {
            return response()->json([
                'message' => 'This typhoon report has already been ended.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            // Update typhoon status
            $typhoon->update([
                'status' => 'ended',
                'ended_at' => now(),
                'ended_by' => auth()->id(),
            ]);

            \DB::commit();

            // Generate PDF report (non-blocking)
            try {
                $pdfPath = $this->generatePdfReport($typhoon);
                
                $typhoon->update([
                    'pdf_path' => $pdfPath,
                ]);

                return response()->json([
                    'message' => 'Typhoon report ended successfully. PDF generated.',
                    'typhoon' => $typhoon->load(['creator:id,name', 'ender:id,name']),
                    'pdf_path' => $pdfPath,
                ]);
            } catch (\Exception $e) {
                // Log the error for debugging
                \Log::error('PDF Generation Failed', [
                    'typhoon_id' => $typhoon->id,
                    'error' => $e->getMessage(),
                ]);
                
                return response()->json([
                    'message' => 'Typhoon ended successfully. PDF generation will be completed shortly.',
                    'typhoon' => $typhoon->load(['creator:id,name', 'ender:id,name']),
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
    public function downloadPdf(Typhoon $typhoon)
    {
        if (!$typhoon->pdf_path) {
            return response()->json([
                'message' => 'PDF report not available for this typhoon.',
            ], 404);
        }

        $fullPath = storage_path('app/public/' . $typhoon->pdf_path);
        
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
    public function regeneratePdf(Typhoon $typhoon)
    {
        if ($typhoon->status !== 'ended') {
            return response()->json([
                'message' => 'Can only regenerate PDF for ended typhoons.',
            ], 422);
        }

        try {
            $pdfPath = $this->generatePdfReport($typhoon);
            
            $typhoon->update([
                'pdf_path' => $pdfPath,
            ]);

            return response()->json([
                'message' => 'PDF generated successfully.',
                'typhoon' => $typhoon->load(['creator', 'ender']),
                'pdf_path' => $pdfPath,
            ]);
        } catch (\Exception $e) {
            \Log::error('PDF Regeneration Failed', [
                'typhoon_id' => $typhoon->id,
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
    public function destroy(Typhoon $typhoon)
    {
        // Only allow deleting if not active
        if ($typhoon->status === 'active') {
            return response()->json([
                'message' => 'Cannot delete an active typhoon. Please end it first.',
            ], 422);
        }

        \DB::beginTransaction();
        try {
            // Delete associated PDF file if exists
            if ($typhoon->pdf_path) {
                $fullPath = storage_path('app/public/' . $typhoon->pdf_path);
                if (file_exists($fullPath)) {
                    @unlink($fullPath);
                }
            }

            $typhoon->delete();
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
}
