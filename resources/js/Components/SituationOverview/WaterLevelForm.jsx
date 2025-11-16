// resources/js/Components/SituationOverview/WaterLevelForm.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage, router } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import { Download, Droplets, Loader2, PlusCircle, Save, History } from "lucide-react";

import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";

import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

// Helper function
const formatFieldName = (field) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function WaterLevelForm({ data, setData, disabled = false }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [originalData, setOriginalData] = useState(null);
    
    // Store original data on mount for change detection
    useEffect(() => {
        if (!originalData) {
            setOriginalData(JSON.parse(JSON.stringify(data.reports)));
        }
    }, []);
    
    // Enhanced search and filtering across multiple fields
    const {
        paginatedData: paginatedReports,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(data.reports, ['gauging_station'], 5);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch modification history (unchanged)
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["water-level-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/water-level`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });


    // Handle input typing — find item by ID to handle filtered data correctly
    const handleInputChange = useCallback((rowId, event) => {
        const { name, value } = event.target;

        setData((prev) => {
            const updatedReports = [...prev.reports];
            
            // Find the correct index in the original array by ID
            const actualIndex = updatedReports.findIndex(r => r.id === rowId);
            
            if (actualIndex === -1) {
                console.warn("handleInputChange: row not found", rowId);
                return prev;
            }

            updatedReports[actualIndex] = {
                ...updatedReports[actualIndex],
                [name]: value,
            };
            
            return { ...prev, reports: updatedReports };
        });
    }, [setData]);

    // Add row — only on explicit click
    const handleAddRow = () => {
        console.log("handleAddRow clicked");
        setData((prev) => {
            const reports = [...prev.reports];
            const last = reports[reports.length - 1] ?? null;

            // Optional safety: do not add a new row if the last row is completely empty
            if (
                last &&
                Object.values(last).every(
                    (v) => v === "" || v === null || v === undefined
                )
            ) {
                console.log(
                    "handleAddRow: last row still empty, not adding new one."
                );
                return prev;
            }

            return {
                ...prev,
                reports: [
                    ...reports,
                    {
                        id: `temp-${Date.now()}`, // Temporary ID for new rows
                        gauging_station: "",
                        current_level: "",
                        alarm_level: "",
                        critical_level: "",
                        affected_areas: "",
                    },
                ],
            };
        });
    };

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(originalData) !== JSON.stringify(data.reports);
    }, [originalData, data.reports]);
    
    // Validate water level reports before submission
    const validateReports = useCallback(() => {
        const errors = [];
        
        data.reports.forEach((report, index) => {
            if (!report.gauging_station || report.gauging_station.trim() === '') {
                errors.push(`Row ${index + 1}: Gauging station is required`);
            }
            if (report.current_level && isNaN(parseFloat(report.current_level))) {
                errors.push(`Row ${index + 1}: Current level must be a valid number`);
            }
            if (report.alarm_level && isNaN(parseFloat(report.alarm_level))) {
                errors.push(`Row ${index + 1}: Alarm level must be a valid number`);
            }
            if (report.critical_level && isNaN(parseFloat(report.critical_level))) {
                errors.push(`Row ${index + 1}: Critical level must be a valid number`);
            }
        });
        
        return errors;
    }, [data.reports]);

    const handleSubmit = async () => {
        if (disabled) {
            toast.error("Forms are currently disabled. Please wait for an active typhoon report.");
            return;
        }
        
        // Check if there are any changes
        if (!hasChanges) {
            toast.info("No changes to save");
            return;
        }
        
        // Validate data before submission
        const validationErrors = validateReports();
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        
        setIsSaving(true);
        
        try {
            // IMPORTANT: send only expected fields if backend requires it
            const cleaned = data.reports.map((r) => ({
                id: (typeof r.id === 'string' && r.id.startsWith('temp-')) ? null : r.id,
                gauging_station: r.gauging_station ?? "",
                current_level:
                    r.current_level === "" ? null : parseFloat(r.current_level),
                alarm_level:
                    r.alarm_level === "" ? null : parseFloat(r.alarm_level),
                critical_level:
                    r.critical_level === ""
                        ? null
                        : parseFloat(r.critical_level),
                affected_areas: r.affected_areas ?? "",
            }));

            const response = await axios.post(`${APP_URL}/water-level-reports`, {
                reports: cleaned,
            });
            
            // Update local state with server response if available
            // Only overwrite if the server actually returns at least one report
            if (response.data && Array.isArray(response.data.reports) && response.data.reports.length > 0) {
                setData({ ...data, reports: response.data.reports });
                // Update original data to reflect saved state
                setOriginalData(JSON.parse(JSON.stringify(response.data.reports)));
            } else {
                // No reports returned – keep current data as the saved state
                setOriginalData(JSON.parse(JSON.stringify(data.reports)));
            }
            
            // Invalidate modification history once
            queryClient.invalidateQueries(['water-level-modifications']);
            
            // Force Inertia to reload page data (updates Dashboard graphs)
            router.reload({ only: ['waterLevels'] });
            
            toast.success("Water level reports saved successfully!");
        } catch (err) {
            console.error("Save error:", err.response?.data || err);
            
            // Provide more specific error messages
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Failed to save water level reports. Please try again.";
            
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (isError) {
        return (
            <div className="text-red-500 p-4">
                Error fetching modification data: {error.message}
            </div>
        );
    }
    const handleDownloadPDF = async () => {
        try {
            const response = await axios.post(
                `${APP_URL}/generate-water-level-report-pdf`,
                { reports: data.reports },
                { responseType: "blob" } // This is crucial for file downloads
            );

            // Create a temporary link to trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "water-level-report.pdf");
            document.body.appendChild(link);
            link.click();

            // Clean up the temporary link
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download PDF. Please check the console.");
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 text-cyan-600 p-2 rounded-lg">
                        <Droplets size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Water Level Monitoring
                        </h3>
                        <p className="text-sm text-slate-500">
                            Enter river/stream gauging station levels.
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search gauging station..."
                    />

                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={data.reports}
                            fileName="Water_Level_Reports"
                            sheetName="Water Levels"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">
                                    Gauging Station
                                </th>
                                <th className="p-3 border-r">
                                    Current Level (m)
                                </th>
                                <th className="p-3 border-r">
                                    Alarm Level (m)
                                </th>
                                <th className="p-3 border-r">
                                    Critical Level (m)
                                </th>
                                <th className="p-3">Affected Areas</th>
                            </tr>
                        </thead>

                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedReports.length === 0 && searchTerm ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-100 text-slate-400 p-4 rounded-full">
                                                <Droplets size={48} />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700">
                                                No results found
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                No gauging station matches "<strong>{searchTerm}</strong>"
                                            </p>
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                Clear search
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedReports.map((row, pageIndex) => {
                                const fields = [
                                    "gauging_station",
                                    "current_level",
                                    "alarm_level",
                                    "critical_level",
                                    "affected_areas",
                                ];

                                return (
                                    <tr
                                        key={row.id ?? `new-${pageIndex}`} // stable key
                                        className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
                                    >
                                        {fields.map((field) => {
                                            // Use row ID + field to get modification history for this specific cell
                                            const historyKey = `${row.id}_${field}`;
                                            const fieldHistory =
                                                modificationData?.history?.[historyKey] || [];
                                            const latestChange = fieldHistory[0];
                                            const previousChange =
                                                fieldHistory.length > 1 ? fieldHistory[1] : null;

                                            return (
                                                <td
                                                    key={field}
                                                    className="block md:table-cell p-3 border-b border-slate-200 last:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>

                                                    <div className="relative mt-1 md:mt-0">
                                                        <input
                                                            name={field}
                                                            type={
                                                                field.includes("_level")
                                                                    ? "number"
                                                                    : "text"
                                                            }
                                                            value={row[field] ?? ""}
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    row.id,
                                                                    e
                                                                )
                                                            }
                                                            placeholder="Enter value..."
                                                            disabled={disabled}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none transition pr-10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        />
                                                        {fieldHistory.length > 0 && (
                                                            <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <History className="w-5 h-5 text-slate-400 hover:text-cyan-600" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="right"
                                                                        className="max-w-xs bg-slate-800 text-white p-3 rounded-lg shadow-lg"
                                                                    >
                                                                        <div className="text-sm space-y-2">
                                                                            <div>
                                                                                <p className="text-sm font-bold text-white mb-1">
                                                                                    Latest Change:
                                                                                </p>
                                                                                <p>
                                                                                    <span className="font-semibold text-blue-300">
                                                                                        {latestChange.user?.name}
                                                                                    </span>{" "}
                                                                                    changed from{" "}
                                                                                    <span className="text-red-400 font-mono">
                                                                                        {latestChange.old ?? "nothing"}
                                                                                    </span>{" "}
                                                                                    to{" "}
                                                                                    <span className="text-green-400 font-mono">
                                                                                        {latestChange.new ?? "nothing"}
                                                                                    </span>
                                                                                </p>
                                                                                <p className="text-xs text-gray-400">
                                                                                    {new Date(
                                                                                        latestChange.date
                                                                                    ).toLocaleString()}
                                                                                </p>
                                                                            </div>
                                                                            {previousChange && (
                                                                                <div className="mt-2 pt-2 border-t border-gray-600">
                                                                                    <p className="text-sm font-bold text-gray-300 mb-1">
                                                                                        Previous Change:
                                                                                    </p>
                                                                                    <p>
                                                                                        <span className="font-semibold text-blue-300">
                                                                                            {previousChange.user?.name}
                                                                                        </span>{" "}
                                                                                        changed from{" "}
                                                                                        <span className="text-red-400 font-mono">
                                                                                            {previousChange.old ?? "nothing"}
                                                                                        </span>{" "}
                                                                                        to{" "}
                                                                                        <span className="text-green-400 font-mono">
                                                                                            {previousChange.new ?? "nothing"}
                                                                                        </span>
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-400">
                                                                                        {new Date(
                                                                                            previousChange.date
                                                                                        ).toLocaleString()}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {latestChange && row[field] && row[field] !== '' && (
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Last modified by{" "}
                                                            <span className="font-medium text-blue-700">
                                                                {latestChange.user?.name}
                                                            </span>
                                                        </p>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
                    }
                />

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                    <AddRowButton
                        onClick={handleAddRow}
                        disabled={disabled}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !hasChanges || disabled}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{disabled ? 'Forms Disabled' : (hasChanges ? 'Save Water Level' : 'No Changes')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
