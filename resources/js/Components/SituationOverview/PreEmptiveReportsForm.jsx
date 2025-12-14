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
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Users, Save, Plus, X, Loader2, AlertCircle, MoreVertical, Trash2 } from 'lucide-react';

export default function PreEmptiveReportsForm({ data, setData, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    const [barangays, setBarangays] = useState([
        {
            id: Date.now(),
            barangay: '',
            evacuation_center: '',
            families: '',
            persons: '',
            outsideLocations: [
                {
                    id: Date.now() + 1,
                    location: '',
                    families: '',
                    persons: ''
                }
            ]
        }
    ]);

    // Load existing data from props
    useEffect(() => {
        const reports = data.reports ?? [];
        
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (reports.length > 0) {
            if (typhoonResumedAt && reports[0].created_at) {
                const reportCreatedAt = new Date(reports[0].created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (reportCreatedAt < resumedAt) {
                    return;
                }
            }
            
            // Group reports by barangay
            const groupedByBarangay = {};
            reports.forEach(report => {
                const key = `${report.barangay}_${report.evacuation_center}`;
                if (!groupedByBarangay[key]) {
                    groupedByBarangay[key] = {
                        id: report.id || Date.now(),
                        barangay: report.barangay || '',
                        evacuation_center: report.evacuation_center || '',
                        families: report.families || '',
                        persons: report.persons || '',
                        outsideLocations: []
                    };
                }
                
                if (report.outside_center) {
                    groupedByBarangay[key].outsideLocations.push({
                        id: report.id || Date.now(),
                        location: report.outside_center || '',
                        families: report.outside_families || '',
                        persons: report.outside_persons || ''
                    });
                }
            });
            
            const loadedBarangays = Object.values(groupedByBarangay).map(brgy => ({
                ...brgy,
                outsideLocations: brgy.outsideLocations.length > 0 ? brgy.outsideLocations : [{
                    id: Date.now(),
                    location: '',
                    families: '',
                    persons: ''
                }]
            }));
            
            if (loadedBarangays.length > 0) {
                setBarangays(loadedBarangays);
                setOriginalData(JSON.parse(JSON.stringify(loadedBarangays)));
            }
        }
    }, [data.reports, typhoon]);

    // Clear form when re-enabled after being disabled
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            const hasAnyData = barangays.some(brgy => 
                brgy.barangay || brgy.evacuation_center || brgy.families || brgy.persons ||
                brgy.outsideLocations.some(loc => loc.location || loc.families || loc.persons)
            );
            
            if (hasAnyData) {
                setBarangays([{
                    id: Date.now(),
                    barangay: '',
                    evacuation_center: '',
                    families: '',
                    persons: '',
                    outsideLocations: [{
                        id: Date.now() + 1,
                        location: '',
                        families: '',
                        persons: ''
                    }]
                }]);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled, previousDisabled, barangays]);

    const addBarangay = () => {
        setBarangays([...barangays, {
            id: Date.now(),
            barangay: '',
            evacuation_center: '',
            families: '',
            persons: '',
            outsideLocations: [{
                id: Date.now() + 1,
                location: '',
                families: '',
                persons: ''
            }]
        }]);
    };

    const removeBarangay = (id) => {
        if (barangays.length > 1) {
            setBarangays(barangays.filter(brgy => brgy.id !== id));
        }
    };

    const updateBarangay = (id, field, value) => {
        setBarangays(barangays.map(brgy => 
            brgy.id === id ? { ...brgy, [field]: value } : brgy
        ));
    };

    const addOutsideLocation = (barangayId) => {
        setBarangays(barangays.map(brgy => 
            brgy.id === barangayId ? {
                ...brgy,
                outsideLocations: [...brgy.outsideLocations, {
                    id: Date.now(),
                    location: '',
                    families: '',
                    persons: ''
                }]
            } : brgy
        ));
    };

    const removeOutsideLocation = (barangayId, locationId) => {
        setBarangays(barangays.map(brgy => 
            brgy.id === barangayId ? {
                ...brgy,
                outsideLocations: brgy.outsideLocations.length > 1 
                    ? brgy.outsideLocations.filter(loc => loc.id !== locationId)
                    : brgy.outsideLocations
            } : brgy
        ));
    };

    const updateOutsideLocation = (barangayId, locationId, field, value) => {
        setBarangays(barangays.map(brgy => 
            brgy.id === barangayId ? {
                ...brgy,
                outsideLocations: brgy.outsideLocations.map(loc =>
                    loc.id === locationId ? { ...loc, [field]: value } : loc
                )
            } : brgy
        ));
    };

    // Check if form has any data
    const hasData = useMemo(() => {
        return barangays.some(brgy => 
            brgy.barangay.trim() !== '' || 
            brgy.evacuation_center.trim() !== '' || 
            brgy.families !== '' || 
            brgy.persons !== '' ||
            brgy.outsideLocations.some(loc => 
                loc.location.trim() !== '' || loc.families !== '' || loc.persons !== ''
            )
        );
    }, [barangays]);

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        return JSON.stringify(originalData) !== JSON.stringify(barangays);
    }, [originalData, barangays, hasData]);

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
            // Flatten the data structure for the API
            const flattenedReports = [];
            barangays.forEach(brgy => {
                brgy.outsideLocations.forEach(loc => {
                    flattenedReports.push({
                        barangay: brgy.barangay,
                        evacuation_center: brgy.evacuation_center,
                        families: brgy.families,
                        persons: brgy.persons,
                        outside_center: loc.location,
                        outside_families: loc.families,
                        outside_persons: loc.persons
                    });
                });
            });

            const response = await axios.post(`${APP_URL}/pre-emptive-reports`, {
                reports: flattenedReports
            });
            
            if (response.data && Array.isArray(response.data.reports)) {
                setData("reports", response.data.reports);
                setOriginalData(JSON.parse(JSON.stringify(barangays)));
            }
            
            toast.success("Pre-emptive evacuation reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save pre-emptive reports.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="bg-gray-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-lg">Pre-Emptive Evacuation Report</h4>
                    <p className="text-gray-600 text-sm">
                        One report per typhoon — update anytime to keep information current.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Evacuation Centers</h3>
                        <p className="text-sm text-gray-600">Add multiple evacuation centers and their details</p>
                    </div>
                    <Button
                        type="button"
                        onClick={addBarangay}
                        disabled={disabled}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Barangay
                    </Button>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700" rowSpan="2">Barangay/Evacuation Center</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700" colSpan="2">Inside Evacuation Center</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700" colSpan="3">Outside Center</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-24" rowSpan="2">Action</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Families</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Individuals</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Location</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Families</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Individuals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {barangays.map((brgy) => (
                                    <React.Fragment key={brgy.id}>
                                        {brgy.outsideLocations.map((loc, locIndex) => (
                                            <tr key={loc.id} className="hover:bg-gray-50">
                                                {locIndex === 0 && (
                                                    <>
                                                        <td className="px-4 py-3 border-r border-gray-200" rowSpan={brgy.outsideLocations.length}>
                                                            <input
                                                                type="text"
                                                                value={brgy.barangay}
                                                                onChange={(e) => updateBarangay(brgy.id, 'barangay', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                                placeholder="Barangay"
                                                                disabled={disabled}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={brgy.evacuation_center}
                                                                onChange={(e) => updateBarangay(brgy.id, 'evacuation_center', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2 disabled:cursor-not-allowed disabled:bg-gray-50"
                                                                placeholder="Evacuation Center"
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-gray-200" rowSpan={brgy.outsideLocations.length}>
                                                            <input
                                                                type="number"
                                                                value={brgy.families}
                                                                onChange={(e) => updateBarangay(brgy.id, 'families', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center disabled:cursor-not-allowed disabled:bg-gray-50"
                                                                placeholder="0"
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-gray-200" rowSpan={brgy.outsideLocations.length}>
                                                            <input
                                                                type="number"
                                                                value={brgy.persons}
                                                                onChange={(e) => updateBarangay(brgy.id, 'persons', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center disabled:cursor-not-allowed disabled:bg-gray-50"
                                                                placeholder="0"
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3 border-r border-gray-200">
                                                    <input
                                                        type="text"
                                                        value={loc.location}
                                                        onChange={(e) => updateOutsideLocation(brgy.id, loc.id, 'location', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                        placeholder="Location"
                                                        disabled={disabled}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-200">
                                                    <input
                                                        type="number"
                                                        value={loc.families}
                                                        onChange={(e) => updateOutsideLocation(brgy.id, loc.id, 'families', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center disabled:cursor-not-allowed disabled:bg-gray-50"
                                                        placeholder="0"
                                                        disabled={disabled}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-200">
                                                    <input
                                                        type="number"
                                                        value={loc.persons}
                                                        onChange={(e) => updateOutsideLocation(brgy.id, loc.id, 'persons', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center disabled:cursor-not-allowed disabled:bg-gray-50"
                                                        placeholder="0"
                                                        disabled={disabled}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
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
                                                            {locIndex === 0 && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => addOutsideLocation(brgy.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Plus className="mr-2 h-4 w-4 text-blue-600" />
                                                                        <span>Add Outside Location</span>
                                                                    </DropdownMenuItem>
                                                                    {barangays.length > 1 && (
                                                                        <>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                onClick={() => removeBarangay(brgy.id)}
                                                                                className="cursor-pointer text-red-600"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                <span>Remove Barangay</span>
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                            {brgy.outsideLocations.length > 1 && locIndex > 0 && (
                                                                <DropdownMenuItem
                                                                    onClick={() => removeOutsideLocation(brgy.id, loc.id)}
                                                                    className="cursor-pointer text-red-600"
                                                                >
                                                                    <X className="mr-2 h-4 w-4" />
                                                                    <span>Remove This Location</span>
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
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
