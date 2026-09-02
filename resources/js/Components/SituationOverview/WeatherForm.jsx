import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import { Cloud, Loader2, Save, AlertCircle, History } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function WeatherForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        municipality: "City of Ilagan",
        sky_condition: "",
        wind: "",
        precipitation: "",
        sea_condition: ""
    });
    
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    
    // Fetch modification history
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["weather-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/weather`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
    
    useEffect(() => {
        const reports = data.reports ?? [];
        
        // Check if typhoon was recently resumed
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (reports.length > 0) {
            const firstReport = reports[0];
            
            // Store the record ID for modification tracking
            setCurrentRecordId(firstReport.id);
            
            // If typhoon was resumed and this record was created BEFORE the resume, don't load it
            if (typhoonResumedAt && firstReport.created_at) {
                const reportCreatedAt = new Date(firstReport.created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (reportCreatedAt < resumedAt) {
                    // This is old data from before resume, keep form empty
                    return;
                }
            }
            
            const loadedData = {
                municipality: firstReport.municipality || "City of Ilagan",
                sky_condition: firstReport.sky_condition || "",
                wind: firstReport.wind || "",
                precipitation: firstReport.precipitation || "",
                sea_condition: firstReport.sea_condition || ""
            };
            setFormData(loadedData);
            setOriginalData(JSON.parse(JSON.stringify(loadedData)));
        }
    }, [data.reports, typhoon]);
    
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            if (formData.sky_condition || formData.wind || formData.precipitation || formData.sea_condition) {
                const emptyData = {
                    municipality: "City of Ilagan",
                    sky_condition: "",
                    wind: "",
                    precipitation: "",
                    sea_condition: ""
                };
                setFormData(emptyData);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const hasData = useMemo(() => {
        return formData.sky_condition.trim() !== '' || 
               formData.wind.trim() !== '' || 
               formData.precipitation.trim() !== '' || 
               formData.sea_condition.trim() !== '';
    }, [formData]);

    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        return JSON.stringify(originalData) !== JSON.stringify(formData);
    }, [originalData, formData, hasData]);

    const handleSubmit = async () => {
        if (disabled) {
            toast.error("Forms are currently disabled.");
            return;
        }
        if (!hasChanges) {
            toast.info("No changes to save");
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Include the ID if we're updating an existing record
            const reportToSubmit = {
                ...formData,
                ...(currentRecordId && { id: currentRecordId })
            };
            
            const response = await axios.post(`${APP_URL}/weather-reports`, {
                reports: [reportToSubmit],
            });
            
            if (response.data && Array.isArray(response.data.reports)) {
                setData("reports", response.data.reports);
                
                // Update the record ID if it's a new record
                if (response.data.reports[0]?.id) {
                    setCurrentRecordId(response.data.reports[0].id);
                }
                
                setOriginalData(JSON.parse(JSON.stringify(formData)));
                
                // Invalidate and refetch modification history
                await queryClient.invalidateQueries(['weather-modifications']);
            }
            
            toast.success("Weather report saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save weather report.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Helper function to get field modification history
    const getFieldHistory = (fieldName) => {
        if (!currentRecordId || !modificationData?.history) return [];
        const historyKey = `${currentRecordId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };
    
    // Helper component to display modification indicator
    const ModificationIndicator = ({ fieldName }) => {
        const fieldHistory = getFieldHistory(fieldName);
        const [isOpen, setIsOpen] = useState(false);
        const [isPinned, setIsPinned] = useState(false); // Track if popover is pinned by click
        const buttonRef = React.useRef(null);
        const [popoverStyle, setPopoverStyle] = useState({});
        
        // Only show icon if this specific field has been modified
        if (fieldHistory.length === 0) return null;
        
        // Get the latest (current) and previous updates
        const currentUpdate = fieldHistory[0]; // Most recent
        const previousUpdate = fieldHistory.length > 1 ? fieldHistory[1] : null; // Second most recent
        
        // Check if this field was updated in the most recent submit (within last 5 minutes)
        const wasJustUpdated = currentUpdate && (new Date() - new Date(currentUpdate.date)) < 5 * 60 * 1000;
        
        // Calculate popover position when opened
        React.useEffect(() => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const popoverWidth = 384; // w-96 = 384px
                const popoverHeight = 400; // estimated
                
                let left = rect.right + 8; // 8px gap from button
                let top = rect.top;
                
                // Check if popover would go off right edge
                if (left + popoverWidth > window.innerWidth) {
                    left = rect.left - popoverWidth - 8; // Show on left side instead
                }
                
                // Check if popover would go off bottom edge
                if (top + popoverHeight > window.innerHeight) {
                    top = window.innerHeight - popoverHeight - 16; // 16px padding from bottom
                }
                
                // Make sure it doesn't go off top edge
                if (top < 16) {
                    top = 16; // 16px padding from top
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
            // Only close on mouse leave if not pinned
            if (!isPinned) {
                setIsOpen(false);
            }
        };
        
        const handleClick = (e) => {
            e.stopPropagation();
            setIsPinned(!isPinned); // Toggle pinned state
            setIsOpen(true); // Always open when clicked
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
                    {/* "New" badge for just updated fields - NO animation */}
                    {wasJustUpdated && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            New
                        </span>
                    )}
                    
                    {/* History icon button */}
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
                        {/* Notification dot for recent updates */}
                        {wasJustUpdated && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                        )}
                    </button>
                </div>
                
                {isOpen && (
                    <>
                        {/* Backdrop to close popover when clicking outside - only if pinned */}
                        {isPinned && (
                            <div 
                                className="fixed inset-0 z-[9998]" 
                                onClick={handleClose}
                            />
                        )}
                        
                        {/* Popover - positioned fixed relative to button */}
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
                                {/* Current Update - Show at TOP */}
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
                                
                                {/* Previous Update (if exists) - Show at BOTTOM */}
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
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                    <Cloud className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-lg">Weather Conditions Update</h4>
                    <p className="text-blue-700 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden">
                <table className="w-full">
                    <tbody>
                        <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                            <td className="bg-gradient-to-br from-blue-100 to-indigo-100 font-semibold text-blue-900 p-5 border-r border-blue-200 w-1/3 align-middle" rowSpan="4">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Location</span>
                                    <input
                                        type="text"
                                        name="municipality"
                                        value={formData.municipality}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="City of Ilagan"
                                        className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center font-semibold text-gray-700 shadow-sm"
                                    />
                                </div>
                            </td>
                            <td className="bg-blue-50 font-semibold text-blue-900 p-4 border-r border-blue-200 w-1/4">
                                Sky Condition
                            </td>
                            <td className="p-4 bg-white">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="sky_condition"
                                        value={formData.sky_condition}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Cloudy, Partly cloudy, Clear skies"
                                        className="w-full px-4 py-2.5 pr-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
                                    />
                                    <ModificationIndicator fieldName="sky_condition" />
                                </div>
                            </td>
                        </tr>
                        <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                            <td className="bg-blue-50 font-semibold text-blue-900 p-4 border-r border-blue-200">
                                Wind
                            </td>
                            <td className="p-4 bg-white">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="wind"
                                        value={formData.wind}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Light winds, Moderate winds"
                                        className="w-full px-4 py-2.5 pr-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
                                    />
                                    <ModificationIndicator fieldName="wind" />
                                </div>
                            </td>
                        </tr>
                        <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                            <td className="bg-blue-50 font-semibold text-blue-900 p-4 border-r border-blue-200">
                                Precipitation
                            </td>
                            <td className="p-4 bg-white">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="precipitation"
                                        value={formData.precipitation}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., No rain in the last 12 hours"
                                        className="w-full px-4 py-2.5 pr-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
                                    />
                                    <ModificationIndicator fieldName="precipitation" />
                                </div>
                            </td>
                        </tr>
                        <tr className="hover:bg-blue-50 transition-colors">
                            <td className="bg-blue-50 font-semibold text-blue-900 p-4 border-r border-blue-200">
                                Sea Condition
                            </td>
                            <td className="p-4 bg-white">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="sea_condition"
                                        value={formData.sea_condition}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., N/A, Calm, Moderate waves"
                                        className="w-full px-4 py-2.5 pr-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
                                    />
                                    <ModificationIndicator fieldName="sea_condition" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-5 border-t border-blue-200">
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:shadow-lg"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Submitting...</span>
                        </>
                    ) : !hasData ? (
                        <>
                            <AlertCircle className="w-5 h-5" />
                            <span>Fill in the form</span>
                        </>
                    ) : hasChanges ? (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Submit Report</span>
                        </>
                    ) : (
                        <>
                            <span>No Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
