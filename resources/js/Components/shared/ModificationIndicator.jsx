import React, { useState, useRef, useEffect } from 'react';
import { History } from 'lucide-react';

/**
 * Reusable Modification Indicator Component
 * Shows modification history with hover + click functionality
 * 
 * @param {number|string} recordId - The ID of the record being tracked
 * @param {string} fieldName - The name of the field being tracked
 * @param {function} getFieldHistory - Function to retrieve field history: (recordId, fieldName) => array
 */
export default function ModificationIndicator({ recordId, fieldName, getFieldHistory }) {
    const fieldHistory = getFieldHistory(recordId, fieldName);
    const [isOpen, setIsOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const buttonRef = useRef(null);
    const [popoverStyle, setPopoverStyle] = useState({});
    
    // Only show icon if this specific field has been modified
    if (fieldHistory.length === 0) return null;
    
    // Get the latest (current) and previous updates
    const currentUpdate = fieldHistory[0];
    const previousUpdate = fieldHistory.length > 1 ? fieldHistory[1] : null;
    
    // Check if this field was updated in the most recent submit (within last 5 minutes)
    const wasJustUpdated = currentUpdate && (new Date() - new Date(currentUpdate.date)) < 5 * 60 * 1000;
    
    // Calculate popover position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const popoverWidth = 384;
            const popoverHeight = 400;
            
            let left = rect.right + 8;
            let top = rect.top;
            
            if (left + popoverWidth > window.innerWidth) {
                left = rect.left - popoverWidth - 8;
            }
            
            if (top + popoverHeight > window.innerHeight) {
                top = window.innerHeight - popoverHeight - 16;
            }
            
            if (top < 16) {
                top = 16;
            }
            
            setPopoverStyle({
                left: `${left}px`,
                top: `${top}px`
            });
        }
    }, [isOpen]);
    
    const handleMouseEnter = () => {
        setIsOpen(true);
    };
    
    const handleMouseLeave = () => {
        if (!isPinned) {
            setIsOpen(false);
        }
    };
    
    const handleClick = (e) => {
        e.stopPropagation();
        setIsPinned(!isPinned);
        setIsOpen(true);
    };
    
    const handleClose = () => {
        setIsOpen(false);
        setIsPinned(false);
    };
    
    return (
        <>
            <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {wasJustUpdated && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        New
                    </span>
                )}
                
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleClick}
                    className={`transition-colors relative ${
                        wasJustUpdated 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-blue-600 hover:text-blue-800'
                    }`}
                    title="View modification history"
                >
                    <History className="w-5 h-5" />
                    {wasJustUpdated && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                    )}
                </button>
            </div>
            
            {isOpen && (
                <>
                    {isPinned && (
                        <div 
                            className="fixed inset-0 z-[9998]" 
                            onClick={handleClose}
                        />
                    )}
                    
                    <div 
                        className="fixed bg-white rounded-lg shadow-2xl border-2 border-blue-300 z-[9999] w-96 max-h-[80vh] overflow-y-auto"
                        style={popoverStyle}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-semibold">
                                    Change History
                                </span>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors flex-shrink-0"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-3 space-y-3">
                            {/* Current Update */}
                            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                        {currentUpdate.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                                            {currentUpdate.user?.name || 'Unknown User'}
                                            {wasJustUpdated && (
                                                <span className="bg-green-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full uppercase">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            {new Date(currentUpdate.date).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs pl-8">
                                    {currentUpdate.old !== null && currentUpdate.old !== undefined && (
                                        <div className="bg-red-50 border border-red-200 rounded p-2">
                                            <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                            <div className="text-red-900 break-words">
                                                {currentUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-green-50 border border-green-200 rounded p-2">
                                        <div className="font-semibold text-green-700 mb-0.5">Current:</div>
                                        <div className="text-green-900 break-words font-semibold">
                                            {currentUpdate.new || <span className="italic text-green-400">(empty)</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Previous Update */}
                            {previousUpdate && (
                                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {previousUpdate.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-700 text-xs">
                                                {previousUpdate.user?.name || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(previousUpdate.date).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs pl-8">
                                        <div className="bg-red-50 border border-red-200 rounded p-2">
                                            <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                            <div className="text-red-900 break-words">
                                                {previousUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                            <div className="font-semibold text-yellow-700 mb-0.5">Updated to:</div>
                                            <div className="text-yellow-900 break-words">
                                                {previousUpdate.new || <span className="italic text-yellow-400">(empty)</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
