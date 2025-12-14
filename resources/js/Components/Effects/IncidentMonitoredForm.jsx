import React, { useState, useEffect, useMemo } from 'react';
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
import { AlertTriangle, Save, Plus, Loader2, AlertCircle, MoreVertical, Trash2 } from 'lucide-react';

export default function IncidentMonitoredForm({ data, setData, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
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
            }
            
            toast.success("Incident reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save incident reports.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="bg-gray-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-lg">Incidents Monitored</h4>
                    <p className="text-gray-600 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
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
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kinds of Incident</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date & Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remarks</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {incidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <input
                                                type="text"
                                                value={incident.kinds_of_incident}
                                                onChange={(e) => updateIncident(incident.id, 'kinds_of_incident', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                placeholder="e.g., Flooding, Landslide"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <input
                                                type="datetime-local"
                                                value={incident.date_time}
                                                onChange={(e) => updateIncident(incident.id, 'date_time', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <input
                                                type="text"
                                                value={incident.location}
                                                onChange={(e) => updateIncident(incident.id, 'location', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                placeholder="e.g 33 Barangays flooded..."
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <textarea
                                                value={incident.description}
                                                onChange={(e) => updateIncident(incident.id, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                placeholder="Description"
                                                rows="2"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <textarea
                                                value={incident.remarks}
                                                onChange={(e) => updateIncident(incident.id, 'remarks', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                placeholder="Remarks"
                                                rows="2"
                                                disabled={disabled}
                                            />
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
