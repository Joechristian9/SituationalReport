import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * NoActiveTyphoonBadge Component
 * Shows "No Active Typhoon" message in header for admin
 * 
 * @param {Object} typhoon - The typhoon object
 * @param {boolean} hasActive - Whether there's an active typhoon
 */
export default function NoActiveTyphoonBadge({ typhoon, hasActive }) {
    // Only show if there's no active typhoon
    if (hasActive && typhoon && typhoon.status === 'active') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-full shadow-md"
        >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">No Active Typhoon</span>
        </motion.div>
    );
}
