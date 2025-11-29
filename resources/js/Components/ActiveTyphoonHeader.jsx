import React, { useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import { Cloud, CheckCircle, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ActiveTyphoonHeader Component
 * Compact inline component showing active or paused typhoon information
 * Designed to be placed in the header on the right side
 * 
 * @param {Object} typhoon - The active/paused typhoon object (null if no active typhoon)
 * @param {boolean} hasActive - Whether there's an active or paused typhoon
 */
export default function ActiveTyphoonHeader({ typhoon, hasActive }) {
    const [showNotification, setShowNotification] = useState(false);

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
        <div className="relative flex items-center gap-3">
            {/* Notification Bell Icon (only show when paused) */}
            {isPaused && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setShowNotification(!showNotification)}
                    className="relative p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
                >
                    <Bell className="w-5 h-5 text-amber-600" />
                    {/* Notification dot */}
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                </motion.button>
            )}

            {/* Typhoon Status Badge */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md ${
                    isPaused 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-blue-500 text-white'
                }`}
            >
                <Cloud className="w-4 h-4" />
                <span className="text-sm font-semibold">{typhoon.name}</span>
                {isActive && (
                    <Badge className="bg-white text-blue-600 hover:bg-white/90 text-xs px-2 py-0.5">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                    </Badge>
                )}
            </motion.div>

            {/* Notification Popup */}
            <AnimatePresence>
                {showNotification && isPaused && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-amber-200 z-50"
                    >
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-900">Report Paused</h4>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-700">
                                    The <span className="font-semibold text-amber-600">{typhoon.name}</span> typhoon report has been temporarily paused.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-800">
                                        <span className="font-semibold">⚠️ Forms are disabled</span>
                                        <br />
                                        Please wait for the administrator to resume reporting before making any changes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
