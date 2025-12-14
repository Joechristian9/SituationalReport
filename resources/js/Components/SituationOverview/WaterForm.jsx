// resources/js/Components/SituationOverview/WaterForm.jsx

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";

import { Droplet, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function WaterForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [formData, setFormData] = useState({
        source_of_water: "",
        barangays_served: "",
        status: "",
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
        const services = data.waterServices ?? [];
        if (services.length > 0) {
            const firstService = services[0];
            const loadedData = {
                source_of_water: firstService.source_of_water || "",
                barangays_served: firstService.barangays_served || "",
                status: firstService.status || "",
                remarks: firstService.remarks || ""
            };
            
            setFormData(loadedData);
            setOriginalData(JSON.parse(JSON.stringify(loadedData)));
        }
    }, [data.waterServices]);
    
    // Detect when typhoon is resumed (disabled changes from true to false)
    useEffect(() => {
        // If it was disabled and now it's enabled (resumed)
        if (previousDisabled === true && disabled === false) {
            // Clear the form for new report (silently, no toast notification)
            if (formData.source_of_water || formData.barangays_served || formData.status || formData.remarks) {
                const emptyData = {
                    source_of_water: "",
                    barangays_served: "",
                    status: "",
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
        return formData.source_of_water.trim() !== '' || 
               formData.barangays_served.trim() !== '' || 
               formData.status.trim() !== '' ||
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
                source_of_water: formData.source_of_water,
                barangays_served: formData.barangays_served,
                status: formData.status,
                remarks: formData.remarks
            };

            const response = await axios.post(`${APP_URL}/water-service-reports`, {
                waterServices: [serviceData],
            });
            
            if (response.data && Array.isArray(response.data.waterServices) && response.data.waterServices.length > 0) {
                setData("waterServices", response.data.waterServices);
                setOriginalData(JSON.parse(JSON.stringify(formData)));
            } else {
                setOriginalData(JSON.parse(JSON.stringify(formData)));
            }
            
            toast.success("Water service report saved successfully!");
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Failed to save water service report. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="bg-gray-100 p-3 rounded-lg">
                    <Droplet className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-lg">Water Services Status</h4>
                    <p className="text-gray-600 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Source of Water */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source of Water
                    </label>
                    <input
                        type="text"
                        name="source_of_water"
                        value={formData.source_of_water}
                        onChange={handleInputChange}
                        disabled={disabled}
                        placeholder="e.g., Deep well, Spring, Water district..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Barangays Served */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barangays Served
                    </label>
                    <textarea
                        name="barangays_served"
                        value={formData.barangays_served}
                        onChange={handleInputChange}
                        rows="4"
                        disabled={disabled}
                        placeholder="List the barangays served by this water source..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status
                    </label>
                    <textarea
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        rows="4"
                        disabled={disabled}
                        placeholder="e.g., Fully operational, Intermittent supply, Temporarily unavailable due to maintenance..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                    />
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Details
                    </label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        onFocus={handleRemarksFocus}
                        rows="5"
                        disabled={disabled}
                        placeholder="Click to auto-fill date and time, then add your remarks..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                    />
                </div>
            </div>

            {/* Submit Button */}
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
                                    <span>No Changes</span>
                                </>
                            )}
                        </>
                    )}
                </button>
            </div>

            {errors.waterServices && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.waterServices}
                </div>
            )}
        </div>
    );
}
