import React, { useMemo } from 'react';
import { History } from 'lucide-react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/Components/ui/tooltip";

/**
 * Reusable Modification Indicator Component
 * Shows modification history with inline tooltip
 * 
 * @param {number|string} recordId - The ID of the record being tracked
 * @param {string} fieldName - The name of the field being tracked
 * @param {function} getFieldHistory - Function to retrieve field history: (recordId, fieldName) => array
 * @param {string} currentValue - Optional: Current value of the field (to determine if we show "Last modified by" text)
 * @param {boolean} showLastModified - Optional: Whether to show "Last modified by" text below the input (default: true)
 */
export default function ModificationIndicator({ recordId, fieldName, getFieldHistory, currentValue, showLastModified = true }) {
    // Memoize the field history to prevent unnecessary recalculations
    const fieldHistory = useMemo(() => {
        if (!getFieldHistory || !recordId || !fieldName) return [];
        return getFieldHistory(recordId, fieldName);
    }, [recordId, fieldName, getFieldHistory]);
    
    // Only show if this specific field has been modified
    if (!fieldHistory || fieldHistory.length === 0) return null;
    
    // Get the latest (current) and previous updates
    const latestChange = fieldHistory[0];
    if (!latestChange) return null;
    
    const previousChange = fieldHistory.length > 1 ? fieldHistory[1] : null;
    
    // Determine if we should show "Last modified by" text
    const shouldShowModifiedText = showLastModified && latestChange && currentValue !== undefined && currentValue !== null && currentValue !== '';
    
    return (
        <>
            <TooltipProvider>
                <div className="absolute top-1/2 -translate-y-1/2 right-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <History className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                            side="right"
                            className="max-w-xs bg-slate-800 text-white p-3 rounded-lg shadow-lg"
                        >
                            <div className="text-sm space-y-2">
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">
                                        Latest Change:
                                    </p>
                                    <p>
                                        <span className="font-semibold text-blue-300">
                                            {latestChange.user?.name || 'Unknown User'}
                                        </span>{" "}
                                        changed from{" "}
                                        <span className="text-red-400 font-mono">
                                            {latestChange.old ?? "nothing"}
                                        </span>{" "}
                                        to{" "}
                                        <span className="text-green-400 font-mono">
                                            {latestChange.new ?? "nothing"}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(latestChange.date).toLocaleString()}
                                    </p>
                                </div>
                                {previousChange && (
                                    <div className="mt-2 pt-2 border-t border-gray-600">
                                        <p className="text-sm font-bold text-gray-300 mb-1">
                                            Previous Change:
                                        </p>
                                        <p>
                                            <span className="font-semibold text-blue-300">
                                                {previousChange.user?.name || 'Unknown User'}
                                            </span>{" "}
                                            changed from{" "}
                                            <span className="text-red-400 font-mono">
                                                {previousChange.old ?? "nothing"}
                                            </span>{" "}
                                            to{" "}
                                            <span className="text-green-400 font-mono">
                                                {previousChange.new ?? "nothing"}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(previousChange.date).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
            {shouldShowModifiedText && (
                <p className="text-xs text-slate-500 mt-2">
                    Last modified by{" "}
                    <span className="font-medium text-blue-700">
                        {latestChange.user?.name || 'Unknown User'}
                    </span>
                </p>
            )}
        </>
    );
}
