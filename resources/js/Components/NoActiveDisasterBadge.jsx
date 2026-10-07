import React from 'react';
import { AlertCircle } from 'lucide-react';
import { m as motion } from 'framer-motion';

/**
 * NoActiveDisasterBadge Component
 * Shows "No Active Disaster" message in header for admin
 * Only shows when there's NO disaster at all (not active, not paused, nothing)
 * 
 * @param {Object} typhoon - The typhoon object
 * @param {boolean} hasActive - Whether there's an active typhoon
 */
export default function NoActiveTyphoonBadge({ typhoon, hasActive }) {
    // Hide badge if there's any disaster (active OR paused)
    if (typhoon) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-600 px-2.5 py-1.5 text-white shadow-md sm:gap-2 sm:px-4 sm:py-2"
        >
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="whitespace-nowrap text-xs font-semibold sm:text-sm">
                No <span className="hidden sm:inline">Active </span>Disaster
            </span>
        </motion.div>
    );
}
