// resources/js/Components/SituationOverview/WeatherForm.jsx
import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import {
    Cloud,
    Download,
    History,
    Loader2,
    PlusCircle,
    Save,
} from "lucide-react";
import AddRowButton from "../ui/AddRowButton";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

const formatFieldName = (field) => {
    return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const sanitizeNumericValue = (value) => {
    if (!value || value === '') return '';
    // Convert to string and remove any non-numeric characters except decimal point
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
};

export default function WeatherForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [originalData, setOriginalData] = useState(null);
    const debounceTimerRef = useRef(null);
    
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
    } = useTableFilter(data.reports, ['municipality'], 5);

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

    // Debounced input change handler for better performance
    const handleInputChange = useCallback((rowId, event) => {
        const { name, value } = event.target;
        
        // For number fields (wind, precipitation), ensure valid numeric format
        let sanitizedValue = value;
        if ((name === 'wind' || name === 'precipitation') && value) {
            // Remove any non-numeric characters except decimal point and negative sign
            sanitizedValue = value.replace(/[^\d.-]/g, '');
            // Ensure only one decimal point
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) {
                sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        
        // Immediate UI update for responsiveness
        const updatedReports = data.reports.map(report => 
            report.id === rowId 
                ? { ...report, [name]: sanitizedValue }
                : report
        );
        setData({ ...data, reports: updatedReports });
    }, [data, setData]);

    const handleAddRow = () => {
        setData({
            ...data,
            reports: [
                ...data.reports,
                {
                    id: `new-${Date.now()}`,
                    municipality: "",
                    sky_condition: "",
                    wind: "",
                    precipitation: "",
                    sea_condition: "",
                },
            ],
        });
    };

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(originalData) !== JSON.stringify(data.reports);
    }, [originalData, data.reports]);
    
    // Validate reports before submission
    const validateReports = useCallback(() => {
        const errors = [];
        
        data.reports.forEach((report, index) => {
            // Check if municipality is filled
            if (!report.municipality || report.municipality.trim() === '') {
                errors.push(`Row ${index + 1}: Municipality is required`);
            }
            
            // Validate numeric fields
            if (report.wind && (isNaN(report.wind) || parseFloat(report.wind) < 0)) {
                errors.push(`Row ${index + 1}: Wind must be a positive number`);
            }
            if (report.precipitation && (isNaN(report.precipitation) || parseFloat(report.precipitation) < 0)) {
                errors.push(`Row ${index + 1}: Precipitation must be a positive number`);
            }
        });
        
        return errors;
    }, [data.reports]);

    const handleSubmit = async () => {
        // Check if forms are disabled
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
            toast.error(validationErrors[0]); // Show first error
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Clean the data: convert string IDs (like "new-123") to null for new rows
            const cleanedReports = data.reports.map(report => ({
                ...report,
                id: typeof report.id === 'string' ? null : report.id
            }));
            
            const response = await axios.post(`${APP_URL}/weather-reports`, {
                reports: cleanedReports,
            });
            
            // Update local state with the response data from server
            // Only overwrite if the server actually returns at least one report.
            // This prevents the UI from going blank when the response is empty.
            if (response.data && Array.isArray(response.data.reports) && response.data.reports.length > 0) {
                setData({ ...data, reports: response.data.reports });
                // Update original data to reflect saved state
                setOriginalData(JSON.parse(JSON.stringify(response.data.reports)));
            } else {
                // No reports returned (e.g., legacy edge case) – keep current data as the saved state
                setOriginalData(JSON.parse(JSON.stringify(data.reports)));
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries(['weather-modifications']);
            queryClient.invalidateQueries(['weather-timeline']);
            
            toast.success("Weather reports saved successfully!");
        } catch (err) {
            console.error(err);
            
            // Provide more specific error messages
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Failed to save weather reports. Please try again.";
            
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
                `${APP_URL}/generate-weather-report-pdf`,
                { reports: data.reports },
                { responseType: "blob" } // Important for handling file downloads
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "weather-report.pdf");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download PDF.");
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <Cloud size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Present Weather Conditions
                        </h3>
                        <p className="text-sm text-slate-500">
                            Enter current weather details.
                        </p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    {/* Left: Search bar */}
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search municipality..."
                    />

                    {/* Right: Rows dropdown + download button side-by-side */}
                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={data.reports}
                            fileName="Present_Weather_Conditions"
                            sheetName="Weather Reports"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">Municipality</th>
                                <th className="p-3 border-r">Sky Condition</th>
                                <th className="p-3 border-r">Wind</th>
                                <th className="p-3 border-r">Precipitation</th>
                                <th className="p-3 border-r">Sea Condition</th>
                            </tr>
                        </thead>
                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedReports.length === 0 && searchTerm ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-100 text-slate-400 p-4 rounded-full">
                                                <Cloud size={48} />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700">
                                                No results found
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                No municipality matches "<strong>{searchTerm}</strong>"
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
                            ) : paginatedReports.map((row, index) => {
                                const fields = [
                                    "municipality",
                                    "sky_condition",
                                    "wind",
                                    "precipitation",
                                    "sea_condition",
                                ];
                                return (
                                    <tr
                                        key={row.id}
                                        className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
                                    >
                                        {fields.map((field) => {
                                            // Use row ID + field to get modification history for this specific cell
                                            const historyKey = `${row.id}_${field}`;
                                            const fieldHistory =
                                                modificationData?.history?.[
                                                    historyKey
                                                ] || [];
                                            const latestChange =
                                                fieldHistory[0];
                                            const previousChange =
                                                fieldHistory.length > 1
                                                    ? fieldHistory[1]
                                                    : null;
                                            
                                            return (
                                                <td
                                                    key={field}
                                                    className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>
                                                    <div className="relative mt-1 md:mt-0">
                                                        <input
                                                            type={field === 'wind' || field === 'precipitation' ? 'number' : 'text'}
                                                            name={field}
                                                            value={
                                                                field === 'wind' || field === 'precipitation'
                                                                    ? sanitizeNumericValue(row[field])
                                                                    : (row[field] ?? "")
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    row.id,
                                                                    e
                                                                )
                                                            }
                                                            placeholder="Enter value..."
                                                            step={field === 'wind' || field === 'precipitation' ? '0.01' : undefined}
                                                            min={field === 'wind' || field === 'precipitation' ? '0' : undefined}
                                                            disabled={disabled}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        />
                                                        {fieldHistory.length >
                                                            0 && (
                                                            <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <History className="w-5 h-5 text-slate-400 hover:text-blue-600" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="right"
                                                                        className="max-w-xs bg-slate-800 text-white p-3 rounded-lg shadow-lg"
                                                                    >
                                                                        <div className="text-sm space-y-2">
                                                                            <div>
                                                                                <p className="text-sm font-bold text-white mb-1">
                                                                                    Latest
                                                                                    Change:
                                                                                </p>
                                                                                <p>
                                                                                    <span className="font-semibold text-blue-300">
                                                                                        {
                                                                                            latestChange
                                                                                                .user
                                                                                                ?.name
                                                                                        }
                                                                                    </span>{" "}
                                                                                    changed
                                                                                    from{" "}
                                                                                    <span className="text-red-400 font-mono">
                                                                                        {latestChange.old ??
                                                                                            "nothing"}
                                                                                    </span>{" "}
                                                                                    to{" "}
                                                                                    <span className="text-green-400 font-mono">
                                                                                        {latestChange.new ??
                                                                                            "nothing"}
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
                                                                                        Previous
                                                                                        Change:
                                                                                    </p>
                                                                                    <p>
                                                                                        <span className="font-semibold text-blue-300">
                                                                                            {
                                                                                                previousChange
                                                                                                    .user
                                                                                                    ?.name
                                                                                            }
                                                                                        </span>{" "}
                                                                                        changed
                                                                                        from{" "}
                                                                                        <span className="text-red-400 font-mono">
                                                                                            {previousChange.old ??
                                                                                                "nothing"}
                                                                                        </span>{" "}
                                                                                        to{" "}
                                                                                        <span className="text-green-400 font-mono">
                                                                                            {previousChange.new ??
                                                                                                "nothing"}
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
                                                                {
                                                                    latestChange
                                                                        .user
                                                                        ?.name
                                                                }
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

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
                    }
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <AddRowButton
                            onClick={handleAddRow}
                            disabled={disabled}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusCircle size={16} /> Add Row
                        </AddRowButton>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !hasChanges || disabled}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : disabled ? (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Forms Disabled</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{hasChanges ? 'Save Weather Report' : 'No Changes'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
