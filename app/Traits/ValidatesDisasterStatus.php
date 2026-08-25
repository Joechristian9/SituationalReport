<?php

namespace App\Traits;

use App\Models\Typhoon;
use Illuminate\Http\JsonResponse;

trait ValidatesDisasterStatus
{
    /**
     * Check if there's an active disaster
     * Returns error response if no active disaster exists
     * 
     * @return JsonResponse|null Returns null if valid, JsonResponse with error if invalid
     */
    protected function validateActiveTyphoon(): ?JsonResponse
    {
        $activeTyphoon = Typhoon::getActiveTyphoon();
        
        if (!$activeTyphoon) {
            return response()->json([
                'message' => 'No active disaster report. Please wait for an administrator to create a disaster report before submitting data.',
                'error' => 'NO_ACTIVE_TYPHOON',
            ], 403);
        }

        if ($activeTyphoon->status === 'ended') {
            return response()->json([
                'message' => 'This typhoon report has been ended. Data submission is no longer allowed.',
                'error' => 'TYPHOON_ENDED',
                'typhoon' => $activeTyphoon->load('creator', 'ender'),
            ], 403);
        }

        return null;
    }

    /**
     * Get the current active typhoon
     * 
     * @return \App\Models\Typhoon|null
     */
    protected function getActiveTyphoon()
    {
        return Typhoon::getActiveTyphoon();
    }

    /**
     * Get the active typhoon ID for associating with records
     * 
     * @return int|null
     */
    protected function getActiveTyphoonId(): ?int
    {
        $typhoon = $this->getActiveTyphoon();
        return $typhoon ? $typhoon->id : null;
    }
}
