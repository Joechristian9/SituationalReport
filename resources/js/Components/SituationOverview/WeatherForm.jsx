import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import { Cloud, Loader2, Save, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ModificationIndicator from "@/Components/shared/ModificationIndicator";

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
    const getFieldHistory = (recordId, fieldName) => {
        // Use passed recordId or fallback to currentRecordId
        const useRecordId = recordId || currentRecordId;
        if (!useRecordId || !modificationData?.history) return [];
        const historyKey = `${useRecordId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
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
                                    <ModificationIndicator 
                                        recordId={currentRecordId}
                                        fieldName="sky_condition"
                                        getFieldHistory={getFieldHistory}
                                        currentValue={formData.sky_condition}
                                        showLastModified={false}
                                    />
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
                                    <ModificationIndicator 
                                        recordId={currentRecordId}
                                        fieldName="wind"
                                        getFieldHistory={getFieldHistory}
                                        currentValue={formData.wind}
                                        showLastModified={false}
                                    />
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
                                    <ModificationIndicator 
                                        recordId={currentRecordId}
                                        fieldName="precipitation"
                                        getFieldHistory={getFieldHistory}
                                        currentValue={formData.precipitation}
                                        showLastModified={false}
                                    />
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
                                    <ModificationIndicator 
                                        recordId={currentRecordId}
                                        fieldName="sea_condition"
                                        getFieldHistory={getFieldHistory}
                                        currentValue={formData.sea_condition}
                                        showLastModified={false}
                                    />
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
