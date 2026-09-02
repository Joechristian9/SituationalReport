import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAppUrl from '@/hooks/useAppUrl';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertTriangle, Save, Plus, Loader2, AlertCircle, MoreVertical, Trash2, History } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function IncidentMonitoredForm({ data, setData, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    const [incidents, setIncidents] = useState([
        {
            id: Date.now(),
            kinds_of_incident: '',
            date_time: '',
            location: '',
            description: '',
            remarks: ''
        }
    ]);
    
    // Fetch modification history
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["incident-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/incident-monitored`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    // Load existing data from props
    useEffect(() => {
        const existingIncidents = data.incidents ?? [];
        
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (existingIncidents.length > 0) {
            if (typhoonResumedAt && existingIncidents[0].created_at) {
                const incidentCreatedAt = new Date(existingIncidents[0].created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (incidentCreatedAt < resumedAt) {
                    return;
                }
            }
            
            setIncidents(existingIncidents);
            setOriginalData(JSON.parse(JSON.stringify(existingIncidents)));
        }
    }, [data.incidents, typhoon]);

    // Clear form when re-enabled after being disabled
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            const hasAnyData = incidents.some(incident => 
                incident.kinds_of_incident || incident.date_time || incident.location || 
                incident.description || incident.remarks
            );
            
            if (hasAnyData) {
                setIncidents([{
                    id: Date.now(),
                    kinds_of_incident: '',
                    date_time: '',
                    location: '',
                    description: '',
                    remarks: ''
                }]);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled, previousDisabled, incidents]);

    const addIncident = () => {
        setIncidents([...incidents, {
            id: Date.now(),
            kinds_of_incident: '',
            date_time: '',
            location: '',
            description: '',
            remarks: ''
        }]);
    };

    const removeIncident = (id) => {
        if (incidents.length > 1) {
            setIncidents(incidents.filter(incident => incident.id !== id));
        }
    };

    const updateIncident = (id, field, value) => {
        setIncidents(incidents.map(incident => 
            incident.id === id ? { ...incident, [field]: value } : incident
        ));
    };

    // Check if form has any data
    const hasData = useMemo(() => {
        return incidents.some(incident => 
            incident.kinds_of_incident.trim() !== '' || 
            incident.date_time.trim() !== '' || 
            incident.location.trim() !== '' || 
            incident.description.trim() !== '' || 
            incident.remarks.trim() !== ''
        );
    }, [incidents]);

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        return JSON.stringify(originalData) !== JSON.stringify(incidents);
    }, [originalData, incidents, hasData]);

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
            const response = await axios.post(`${APP_URL}/incident-monitored`, {
                incidents: incidents
            });
            
            if (response.data && Array.isArray(response.data.incidents)) {
                setData("incidents", response.data.incidents);
                setOriginalData(JSON.parse(JSON.stringify(incidents)));
                
                // Invalidate and refetch modification history
                await queryClient.invalidateQueries(['incident-modifications']);
            }
            
            toast.success("Incident reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save incident reports.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Don't block the form if modification history fails
    if (isError) {
        console.error('Error fetching modification data:', error);
    }
    
    // Helper function to get field modification history
    const getFieldHistory = (incidentId, fieldName) => {
        if (!modificationData?.history) return [];
        const historyKey = `${incidentId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };
    
    // Helper component to display modification indicator
    const ModificationIndicator = ({ incidentId, fieldName }) => {
        const fieldHistory = getFieldHistory(incidentId, fieldName);
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
                    <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-lg">Incidents Monitored</h4>
                    <p className="text-blue-700 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Incident Reports</h3>
                        <p className="text-sm text-gray-600">Add multiple incidents and their details</p>
                    </div>
                    <Button
                        type="button"
                        onClick={addIncident}
                        disabled={disabled}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Incident
                    </Button>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-blue-50 border-b border-blue-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Kinds of Incident</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Date & Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Location</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Remarks</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-900 w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {incidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={incident.kinds_of_incident}
                                                    onChange={(e) => updateIncident(incident.id, 'kinds_of_incident', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="e.g., Flooding, Landslide"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator incidentId={incident.id} fieldName="kinds_of_incident" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    value={incident.date_time}
                                                    onChange={(e) => updateIncident(incident.id, 'date_time', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator incidentId={incident.id} fieldName="date_time" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={incident.location}
                                                    onChange={(e) => updateIncident(incident.id, 'location', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="e.g 33 Barangays flooded..."
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator incidentId={incident.id} fieldName="location" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <textarea
                                                    value={incident.description}
                                                    onChange={(e) => updateIncident(incident.id, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="Description"
                                                    rows="2"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator incidentId={incident.id} fieldName="description" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <textarea
                                                    value={incident.remarks}
                                                    onChange={(e) => updateIncident(incident.id, 'remarks', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="Remarks"
                                                    rows="2"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator incidentId={incident.id} fieldName="remarks" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {incidents.length > 1 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            disabled={disabled}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => removeIncident(incident.id)}
                                                            className="cursor-pointer text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Remove Incident</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-gray-200">
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
