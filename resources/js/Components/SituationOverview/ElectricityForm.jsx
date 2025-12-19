// resources/js/Components/SituationOverview/ElectricityForm.jsx

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import { Zap, Loader2, Save, AlertCircle } from "lucide-react";
import AddRowButton from "@/Components/ui/AddRowButton";

export default function ElectricityForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [rows, setRows] = useState([{
        id: null,
        status: "",
        barangays_affected: "",
        remarks: ""
    }]);
    
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    
    useEffect(() => {
        const services = data.electricityServices ?? [];
        
        // Check if typhoon was recently resumed
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (services.length > 0) {
            const firstService = services[0];
            
            // If typhoon was resumed and this record was created BEFORE the resume, don't load it
            if (typhoonResumedAt && firstService.created_at) {
                const serviceCreatedAt = new Date(firstService.created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (serviceCreatedAt < resumedAt) {
                    // This is old data from before resume, keep form empty
                    return;
                }
            }
            
            const loadedRows = services.map(service => ({
                id: service.id,
                status: service.status || "",
                barangays_affected: service.barangays_affected || "",
                remarks: service.remarks || ""
            }));
            
            setRows(loadedRows);
            setOriginalData(JSON.parse(JSON.stringify(loadedRows)));
        }
    }, [data.electricityServices, typhoon]);
    
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            const hasData = rows.some(row => row.status || row.barangays_affected || row.remarks);
            if (hasData) {
                setRows([{
                    id: null,
                    status: "",
                    barangays_affected: "",
                    remarks: ""
                }]);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled]);

    const handleInputChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleRemarksFocus = (index) => {
        if (!rows[index].remarks || rows[index].remarks.trim() === '') {
            const dateTimeString = currentDateTime.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            const newRows = [...rows];
            newRows[index].remarks = `As of ${dateTimeString}: `;
            setRows(newRows);
        }
    };

    const addRow = () => {
        setRows([...rows, {
            id: null,
            status: "",
            barangays_affected: "",
            remarks: ""
        }]);
    };

    const hasData = useMemo(() => {
        return rows.some(row => 
            row.status.trim() !== '' || 
            row.barangays_affected.trim() !== '' || 
            row.remarks.trim() !== ''
        );
    }, [rows]);

    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        
        // Filter out empty rows before comparing
        const filteredRows = rows.filter(row => 
            row.status.trim() !== '' || 
            row.barangays_affected.trim() !== '' || 
            row.remarks.trim() !== ''
        );
        
        const filteredOriginal = originalData.filter(row => 
            row.status.trim() !== '' || 
            row.barangays_affected.trim() !== '' || 
            row.remarks.trim() !== ''
        );
        
        return JSON.stringify(filteredOriginal) !== JSON.stringify(filteredRows);
    }, [originalData, rows]);

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
            // Filter out empty rows
            const validRows = rows.filter(row => 
                row.status.trim() !== '' || 
                row.barangays_affected.trim() !== '' || 
                row.remarks.trim() !== ''
            );

            const response = await axios.post(`${APP_URL}/electricity-reports`, {
                electricityServices: validRows,
            });
            
            if (response.data && Array.isArray(response.data.electricityServices)) {
                setData("electricityServices", response.data.electricityServices);
                setOriginalData(JSON.parse(JSON.stringify(rows)));
            }
            
            toast.success("Electricity report saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save electricity report.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-lg">Electricity Status Update</h4>
                    <p className="text-blue-700 text-sm">
                        One report per typhoon — update anytime to keep information current.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-blue-50 border-b border-blue-200">
                            <th className="text-left p-4 font-semibold text-blue-900 w-1/3">
                                STATUS OF ELECTRICITY SERVICES
                            </th>
                            <th className="text-left p-4 font-semibold text-blue-900 w-1/3">
                                BARANGAYS AFFECTED
                            </th>
                            <th className="text-left p-4 font-semibold text-blue-900 w-1/3">
                                REMARKS
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                <td className="p-3">
                                    <textarea
                                        value={row.status}
                                        onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                                        disabled={disabled}
                                        rows="3"
                                        placeholder="e.g., 66 Barangays are energized in the City of Ilagan"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                                    />
                                </td>
                                <td className="p-3">
                                    <textarea
                                        value={row.barangays_affected}
                                        onChange={(e) => handleInputChange(index, 'barangays_affected', e.target.value)}
                                        disabled={disabled}
                                        rows="3"
                                        placeholder="List affected barangays..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                                    />
                                </td>
                                <td className="p-3">
                                    <textarea
                                        value={row.remarks}
                                        onChange={(e) => handleInputChange(index, 'remarks', e.target.value)}
                                        onFocus={() => handleRemarksFocus(index)}
                                        disabled={disabled}
                                        rows="3"
                                        placeholder="Click to auto-fill date and time..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center">
                <AddRowButton onClick={addRow} disabled={disabled} label="Add Status Entry" />
                
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
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
