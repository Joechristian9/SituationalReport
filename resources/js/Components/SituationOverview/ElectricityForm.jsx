// resources/js/Components/SituationOverview/ElectricityForm.jsx

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";

import { Zap, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ElectricityForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [formData, setFormData] = useState({
        overall_status: "",
        barangays_affected: "",
        remarks: ""
    });
    
    // Track previous disabled state to detect resume
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    
    // Update current date/time every second for real-time display
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);
    
    // Load existing data on mount and when data changes
    useEffect(() => {
        const services = data.electricityServices ?? [];
        if (services.length > 0) {
            const firstService = services[0];
            const loadedData = {
                overall_status: firstService.status || "",
                barangays_affected: firstService.barangays_affected || "",
                remarks: firstService.remarks || ""
            };
            
            setFormData(loadedData);
            setOriginalData(JSON.parse(JSON.stringify(loadedData)));
        }
    }, [data.electricityServices]);
    
    // Detect when typhoon is resumed (disabled changes from true to false)
    useEffect(() => {
        // If it was disabled and now it's enabled (resumed)
        if (previousDisabled === true && disabled === false) {
            // Clear the form for new report (silently, no toast notification)
            if (formData.overall_status || formData.barangays_affected || formData.remarks) {
                const emptyData = {
                    overall_status: "",
                    barangays_affected: "",
                    remarks: ""
                };
                setFormData(emptyData);
                setOriginalData(null);
                // No toast here - the Index.jsx already shows a resume notification
            }
        }
        
        // Update previous disabled state
        setPreviousDisabled(disabled);
    }, [disabled]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRemarksFocus = () => {
        // Auto-fill timestamp if remarks field is empty
        if (!formData.remarks || formData.remarks.trim() === '') {
            const dateTimeString = currentDateTime.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            setFormData(prev => ({
                ...prev,
                remarks: `As of ${dateTimeString}: `
            }));
        }
    };

    // Check if form has any data
    const hasData = useMemo(() => {
        return formData.overall_status.trim() !== '' || 
               formData.barangays_affected.trim() !== '' || 
               formData.remarks.trim() !== '';
    }, [formData]);

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) {
            // If no original data, check if form has any content
            return hasData;
        }
        return JSON.stringify(originalData) !== JSON.stringify(formData);
    }, [originalData, formData, hasData]);

    const handleSubmit = async () => {
        if (disabled) {
            toast.error("Forms are currently disabled. Please wait for an active typhoon report.");
            return;
        }

        if (!hasChanges) {
            toast.info("No changes to save");
            return;
        }
        
        setIsSaving(true);
        
        try {
            const serviceData = {
                status: formData.overall_status,
                barangays_affected: formData.barangays_affected,
                remarks: formData.remarks
            };

            const response = await axios.post(`${APP_URL}/electricity-reports`, {
                electricityServices: [serviceData],
            });
            
            if (response.data && Array.isArray(response.data.electricityServices) && response.data.electricityServices.length > 0) {
                setData("electricityServices", response.data.electricityServices);
                setOriginalData(JSON.parse(JSON.stringify(formData)));
            } else {
                setOriginalData(JSON.parse(JSON.stringify(formData)));
            }
            
            toast.success("Electricity report saved successfully!");
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Failed to save electricity report. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-white mb-1 text-lg">⚡ Power Status Update</h4>
                    <p className="text-blue-50 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Overall Status */}
                <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">1</span>
                        What's the current power situation?
                    </label>
                    <textarea
                        name="overall_status"
                        value={formData.overall_status}
                        onChange={handleInputChange}
                        rows="4"
                        disabled={disabled}
                        placeholder="e.g., Normal operations, Partial outage in some areas, Complete blackout..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed resize-none hover:border-slate-300 placeholder:text-slate-400"
                    />
                </div>

                {/* Affected Barangays */}
                <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">2</span>
                        Which barangays are affected?
                    </label>
                    <textarea
                        name="barangays_affected"
                        value={formData.barangays_affected}
                        onChange={handleInputChange}
                        rows="4"
                        disabled={disabled}
                        placeholder="List the barangays experiencing power issues..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed resize-none hover:border-slate-300 placeholder:text-slate-400"
                    />
                </div>

                {/* Additional Remarks */}
                <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">3</span>
                        Any additional details?
                    </label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        onFocus={handleRemarksFocus}
                        rows="5"
                        disabled={disabled}
                        placeholder="Click to auto-fill date and time, then add your remarks..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed resize-none hover:border-slate-300 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Submit Button */}
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
                    ) : (
                        <>
                            {!hasData ? (
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
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>All Set! ✓</span>
                                </>
                            )}
                        </>
                    )}
                </button>
            </div>

            {errors.electricityServices && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded-r-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.electricityServices}
                </div>
            )}
        </div>
    );
}
