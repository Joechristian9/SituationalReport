import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import { Cloud, Loader2, Save, AlertCircle } from "lucide-react";

export default function WeatherForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
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
    
    useEffect(() => {
        const reports = data.reports ?? [];
        
        // Check if typhoon was recently resumed
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (reports.length > 0) {
            const firstReport = reports[0];
            
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
            const response = await axios.post(`${APP_URL}/weather-reports`, {
                reports: [formData],
            });
            
            if (response.data && Array.isArray(response.data.reports)) {
                setData("reports", response.data.reports);
                setOriginalData(JSON.parse(JSON.stringify(formData)));
            }
            
            toast.success("Weather report saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save weather report.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Cloud className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-white mb-1 text-lg">☁️ Weather Conditions Update</h4>
                    <p className="text-blue-50 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <tbody>
                        <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <td className="bg-gradient-to-br from-blue-50 to-blue-100/50 font-semibold text-slate-800 p-5 border-r border-slate-200 w-1/3 align-middle" rowSpan="4">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs uppercase tracking-wide text-blue-600 font-medium">Location</span>
                                    <input
                                        type="text"
                                        name="municipality"
                                        value={formData.municipality}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="City of Ilagan"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed text-center font-semibold text-slate-700 shadow-sm hover:border-blue-300"
                                    />
                                </div>
                            </td>
                            <td className="bg-slate-50 font-medium text-slate-700 p-4 border-r border-slate-200 w-1/4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    Sky Condition
                                </div>
                            </td>
                            <td className="p-4 bg-white">
                                <input
                                    type="text"
                                    name="sky_condition"
                                    value={formData.sky_condition}
                                    onChange={handleInputChange}
                                    disabled={disabled}
                                    placeholder="e.g., Cloudy, Partly cloudy, Clear skies"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-blue-300 shadow-sm"
                                />
                            </td>
                        </tr>
                        <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <td className="bg-slate-50 font-medium text-slate-700 p-4 border-r border-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    Wind
                                </div>
                            </td>
                            <td className="p-4 bg-white">
                                <input
                                    type="text"
                                    name="wind"
                                    value={formData.wind}
                                    onChange={handleInputChange}
                                    disabled={disabled}
                                    placeholder="e.g., Light winds, Moderate winds"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-blue-300 shadow-sm"
                                />
                            </td>
                        </tr>
                        <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                            <td className="bg-slate-50 font-medium text-slate-700 p-4 border-r border-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    Precipitation
                                </div>
                            </td>
                            <td className="p-4 bg-white">
                                <input
                                    type="text"
                                    name="precipitation"
                                    value={formData.precipitation}
                                    onChange={handleInputChange}
                                    disabled={disabled}
                                    placeholder="e.g., No rain in the last 12 hours"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-blue-300 shadow-sm"
                                />
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="bg-slate-50 font-medium text-slate-700 p-4 border-r border-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    Sea Condition
                                </div>
                            </td>
                            <td className="p-4 bg-white">
                                <input
                                    type="text"
                                    name="sea_condition"
                                    value={formData.sea_condition}
                                    onChange={handleInputChange}
                                    disabled={disabled}
                                    placeholder="e.g., N/A, Calm, Moderate waves"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-blue-300 shadow-sm"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-200">
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all"
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
