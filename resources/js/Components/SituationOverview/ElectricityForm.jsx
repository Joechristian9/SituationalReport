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
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-white mb-1 text-lg">⚡ Electricity Status Update</h4>
                    <p className="text-yellow-50 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-b border-slate-200">
                            <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200 w-1/3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    STATUS OF ELECTRICITY SERVICES
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200 w-1/3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    BARANGAYS AFFECTED
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-slate-700 w-1/3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    REMARKS
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                <td className="p-3 border-r border-slate-200">
                                    <textarea
                                        value={row.status}
                                        onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                                        disabled={disabled}
                                        rows="3"
                                        placeholder="e.g., 66 Barangays are energized in the City of Ilagan"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-yellow-300 shadow-sm resize-none"
                                    />
                                </td>
                                <td className="p-3 border-r border-slate-200">
                                    <textarea
                                        value={row.barangays_affected}
                                        onChange={(e) => handleInputChange(index, 'barangays_affected', e.target.value)}
                                        disabled={disabled}
                                        rows="3"
                                        placeholder="List affected barangays..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-yellow-300 shadow-sm resize-none"
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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed hover:border-yellow-300 shadow-sm resize-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddRowButton onClick={addRow} disabled={disabled} label="Add Status Entry" />

            <div className="flex justify-end pt-5 border-t border-slate-200">
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all"
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
