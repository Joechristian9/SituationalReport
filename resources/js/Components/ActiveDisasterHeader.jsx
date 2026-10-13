import React from 'react';
import { Badge } from '@/Components/ui/badge';
import { Cloud, CheckCircle } from 'lucide-react';
import { m as motion } from 'framer-motion';

/**
 * ActiveTyphoonHeader Component
 * Compact inline component showing active or paused typhoon information
 * Designed to be placed in the header on the right side. The paused notice itself
 * lives in the bell of the app header (NotificationBell).
 *
 * @param {Object} typhoon - The active/paused disaster object (null if no active disaster)
 * @param {boolean} hasActive - Whether there's an active or paused disaster
 */
export default function ActiveTyphoonHeader({ typhoon, hasActive }) {
    // Only show if there's an active or paused typhoon
    if (!hasActive || !typhoon) {
        return null;
    }

    const isPaused = typhoon.status === 'paused';
    const isActive = typhoon.status === 'active';

    // Don't show if ended
    if (!isActive && !isPaused) {
        return null;
    }

    return (
        <div className="relative flex min-w-0 shrink items-center gap-2 sm:gap-3">
            {/* Typhoon Status Badge */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex min-w-0 max-w-[min(18rem,calc(100vw-6rem))] items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-md sm:max-w-xs sm:gap-2 sm:px-3 ${
                    isPaused
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                }`}
                title={`${typhoon.name} · ${isPaused ? 'Paused' : 'Active'}`}
            >
                <Cloud className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs font-semibold sm:text-sm">{typhoon.name}</span>
                {isActive && (
                    <Badge className="shrink-0 bg-white px-1.5 py-0.5 text-xs text-blue-600 hover:bg-white/90 sm:px-2">
                        <CheckCircle className="h-3 w-3 sm:mr-1" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Active</span>
                    </Badge>
                )}
                {isPaused && <span className="sr-only">Paused</span>}
            </motion.div>
        </div>
    );
}
