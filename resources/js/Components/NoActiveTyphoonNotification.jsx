import React, { useState } from 'react';
import { Bell, X, AlertCircle, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NoActiveTyphoonNotification Component
 * Shows a bell icon with notification when there's no active typhoon or typhoon is paused
 * Displays a popup with information when clicked
 */
export default function NoActiveTyphoonNotification({ typhoon, hasActive }) {
    const [showNotification, setShowNotification] = useState(false);

    // Determine if we should show the notification
    const isPaused = hasActive && typhoon?.status === 'paused';
    const isEnded = hasActive && typhoon?.status === 'ended';
    const noTyphoon = !hasActive;
    
    const shouldShow = isPaused || isEnded || noTyphoon;
    
    if (!shouldShow) return null;

    // Count notifications (1 for now, can be expanded)
    const notificationCount = 1;

    // Determine message based on status
    const getTitle = () => {
        if (isPaused) return 'Typhoon Report Paused';
        if (isEnded) return 'Typhoon Report Ended';
        return 'No Active Typhoon';
    };

    const getMessage = () => {
        if (isPaused) {
            return `The ${typhoon.name} typhoon report has been temporarily paused by the administrator.`;
        }
        if (isEnded) {
            return `The ${typhoon.name} typhoon report has been ended.`;
        }
        return 'There is currently no active typhoon report.';
    };

    const getIcon = () => {
        if (isPaused) return <Pause className="w-4 h-4 text-amber-600" />;
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setShowNotification(!showNotification)}
                className="relative p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
                title={getTitle()}
            >
                <Bell className="w-5 h-5 text-amber-600" />
                {/* Notification badge with number */}
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {notificationCount}
                </span>
            </motion.button>

            {/* Notification Popup */}
            <AnimatePresence>
                {showNotification && (
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
                                        {getIcon()}
                                    </div>
                                    <h4 className="font-semibold text-gray-900">{getTitle()}</h4>
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
                                    {getMessage()}
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-800">
                                        <span className="font-semibold">⚠️ Forms are disabled</span>
                                        <br />
                                        {isPaused 
                                            ? 'Please wait for the administrator to resume reporting before making any changes.'
                                            : 'Please wait for the administrator to create a new typhoon report before you can submit data.'
                                        }
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    You can still view your report history while waiting.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
