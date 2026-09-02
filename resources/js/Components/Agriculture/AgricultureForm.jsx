import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAppUrl from '@/hooks/useAppUrl';
import { usePage } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ModificationIndicator from '@/Components/shared/ModificationIndicator';
import { Sprout, Save, Plus, Loader2, AlertCircle, MoreVertical, Trash2 } from 'lucide-react';

export default function AgricultureForm({ data, setData, disabled = false }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { typhoon } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    const [crops, setCrops] = useState([
        {
            id: Date.now(),
            crops_affected: '',
            standing_crop_ha: '',
            stage_of_crop: '',
            total_area_affected_ha: '',
            total_production_loss: ''
        }
    ]);

    // Fetch modification history
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["agriculture-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}/modifications/agriculture-reports`);
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Helper function to get field modification history
    const getFieldHistory = (recordId, fieldName) => {
        if (!modificationData?.history) return [];
        const historyKey = `${recordId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };

    // Load existing data from props
    useEffect(() => {
        const existingCrops = data.agriculture ?? [];
        
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (existingCrops.length > 0) {
            if (typhoonResumedAt && existingCrops[0].created_at) {
                const cropCreatedAt = new Date(existingCrops[0].created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (cropCreatedAt < resumedAt) {
                    return;
                }
            }
            
            setCrops(existingCrops);
            setOriginalData(JSON.parse(JSON.stringify(existingCrops)));
        }
    }, [data.agriculture, typhoon]);

    // Clear form when re-enabled after being disabled
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            const hasAnyData = crops.some(crop => 
                crop.crops_affected || crop.standing_crop_ha || crop.stage_of_crop || 
                crop.total_area_affected_ha || crop.total_production_loss
            );
            
            if (hasAnyData) {
                setCrops([{
                    id: Date.now(),
                    crops_affected: '',
                    standing_crop_ha: '',
                    stage_of_crop: '',
                    total_area_affected_ha: '',
                    total_production_loss: ''
                }]);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled, previousDisabled, crops]);

    const addCrop = () => {
        setCrops([...crops, {
            id: Date.now(),
            crops_affected: '',
            standing_crop_ha: '',
            stage_of_crop: '',
            total_area_affected_ha: '',
            total_production_loss: ''
        }]);
    };

    const removeCrop = (id) => {
        if (crops.length > 1) {
            setCrops(crops.filter(crop => crop.id !== id));
        }
    };

    const updateCrop = (id, field, value) => {
        setCrops(crops.map(crop => 
            crop.id === id ? { ...crop, [field]: value } : crop
        ));
    };

    // Check if form has any data
    const hasData = useMemo(() => {
        return crops.some(crop => 
            crop.crops_affected.trim() !== '' || 
            crop.standing_crop_ha.toString().trim() !== '' || 
            crop.stage_of_crop.trim() !== '' || 
            crop.total_area_affected_ha.toString().trim() !== '' || 
            crop.total_production_loss.toString().trim() !== ''
        );
    }, [crops]);

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        return JSON.stringify(originalData) !== JSON.stringify(crops);
    }, [originalData, crops, hasData]);

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
            const response = await axios.post(`${APP_URL}/agriculture-reports`, {
                crops: crops
            });
            
            if (response.data && Array.isArray(response.data.agriculture)) {
                setData("agriculture", response.data.agriculture);
                setOriginalData(JSON.parse(JSON.stringify(crops)));
                
                // Invalidate and refetch modification history
                await queryClient.invalidateQueries(['agriculture-modifications']);
            }
            
            toast.success("Agriculture reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save agriculture reports.");
        } finally {
            setIsSaving(false);
            // Force refetch after small delay to ensure data is fresh
            setTimeout(() => {
                queryClient.invalidateQueries(['agriculture-modifications']);
            }, 200);
        }
    };

    if (isError) {
        return (
            <div className="text-red-500 p-4">
                Error fetching modification data: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                    <Sprout className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-lg">Agriculture Report</h4>
                    <p className="text-blue-700 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Crops Affected</h3>
                        <p className="text-sm text-gray-600">Add multiple crops and their damage details</p>
                    </div>
                    <Button
                        type="button"
                        onClick={addCrop}
                        disabled={disabled}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Crop
                    </Button>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-blue-50 border-b border-blue-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900" rowSpan="2">Crops<br/>affected</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-900" colSpan="4">Area Affected</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-blue-900 w-24" rowSpan="2">Action</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Standing<br/>Crop (Ha)</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Stage of<br/>crop</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">TOTAL<br/>Area<br/>Affected<br/>(Ha)</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Total Production<br/>Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {crops.map((crop) => (
                                    <tr key={crop.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={crop.crops_affected}
                                                    onChange={(e) => updateCrop(crop.id, 'crops_affected', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="e.g., RICE, CORN, HVCC"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator 
                                                    recordId={crop.id} 
                                                    fieldName="crops_affected" 
                                                    getFieldHistory={getFieldHistory} 
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={crop.standing_crop_ha}
                                                    onChange={(e) => updateCrop(crop.id, 'standing_crop_ha', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="0.00"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator 
                                                    recordId={crop.id} 
                                                    fieldName="standing_crop_ha" 
                                                    getFieldHistory={getFieldHistory} 
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={crop.stage_of_crop}
                                                    onChange={(e) => updateCrop(crop.id, 'stage_of_crop', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="e.g., Vegetative"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator 
                                                    recordId={crop.id} 
                                                    fieldName="stage_of_crop" 
                                                    getFieldHistory={getFieldHistory} 
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={crop.total_area_affected_ha}
                                                    onChange={(e) => updateCrop(crop.id, 'total_area_affected_ha', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="0.00"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator 
                                                    recordId={crop.id} 
                                                    fieldName="total_area_affected_ha" 
                                                    getFieldHistory={getFieldHistory} 
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={crop.total_production_loss}
                                                    onChange={(e) => updateCrop(crop.id, 'total_production_loss', e.target.value)}
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                                                    placeholder="0.00"
                                                    disabled={disabled}
                                                />
                                                <ModificationIndicator 
                                                    recordId={crop.id} 
                                                    fieldName="total_production_loss" 
                                                    getFieldHistory={getFieldHistory} 
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {crops.length > 1 ? (
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
                                                            onClick={() => removeCrop(crop.id)}
                                                            className="cursor-pointer text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Remove Crop</span>
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
