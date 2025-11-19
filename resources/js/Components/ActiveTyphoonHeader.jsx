import React from 'react';
import { Badge } from '@/Components/ui/badge';
import { Cloud, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ActiveTyphoonHeader Component
 * Compact inline component showing only active typhoon information
 * Designed to be placed in the header on the right side
 * 
 * @param {Object} typhoon - The active typhoon object (null if no active typhoon)
 * @param {boolean} hasActive - Whether there's an active typhoon
 */
export default function ActiveTyphoonHeader({ typhoon, hasActive }) {
    // Only show if there's an active typhoon
    if (!hasActive || !typhoon || typhoon.status !== 'active') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-md"
        >
            <Cloud className="w-4 h-4" />
            <span className="text-sm font-semibold">{typhoon.name}</span>
            <Badge className="bg-white text-blue-600 hover:bg-white/90 text-xs px-2 py-0.5">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </Badge>
        </motion.div>
    );
}
