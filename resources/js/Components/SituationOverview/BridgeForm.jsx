// resources/js/Components/SituationOverview/BridgeForm.jsx

import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import { Landmark, History, Loader2, PlusCircle, Save } from "lucide-react";
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

export default function BridgeForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [originalData, setOriginalData] = useState(null);
    
    const bridges = data?.bridges ?? [];
    
    // Store original data on mount for change detection
    useEffect(() => {
        if (!originalData) {
            setOriginalData(JSON.parse(JSON.stringify(bridges)));
        }
    }, []);
    
    // Enhanced search and filtering across multiple fields
    const {
        paginatedData: paginatedBridges,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(bridges, ['name_of_bridge'], 5);

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
        queryKey: ["bridge-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}/modifications/bridge`);
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleInputChange = useCallback((index, event) => {
        const { name, value } = event.target;
        const newRows = [...bridges];
        newRows[index][name] = value;
        setData("bridges", newRows);
    }, [bridges, setData]);

    const handleAddRow = () => {
        setData("bridges", [
            ...bridges,
            {
                id: `new-${Date.now()}`,
                road_classification: "",
                name_of_bridge: "",
                status: "",
                areas_affected: "",
                re_routing: "",
                remarks: "",
            },
        ]);
    };

    // Check if data has changed
    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(originalData) !== JSON.stringify(bridges);
    }, [originalData, bridges]);
    
    // Validate bridges before submission
    const validateBridges = useCallback(() => {
        const errors = [];
        
        bridges.forEach((bridge, index) => {
            if (!bridge.name_of_bridge || bridge.name_of_bridge.trim() === '') {
                errors.push(`Row ${index + 1}: Bridge name is required`);
            }
        });
        
        return errors;
    }, [bridges]);

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
        const validationErrors = validateBridges();
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Clean string IDs for new rows
            const cleanedBridges = bridges.map(bridge => ({
                ...bridge,
                id: typeof bridge.id === 'string' ? null : bridge.id
            }));
            
            const response = await axios.post(`${APP_URL}/bridge-reports`, {
                bridges: cleanedBridges,
            });
            
            // Update local state with server response if available
            // Only overwrite if the server actually returns at least one bridge
            if (response.data && Array.isArray(response.data.bridges) && response.data.bridges.length > 0) {
                setData("bridges", response.data.bridges);
                // Update original data to reflect saved state
                setOriginalData(JSON.parse(JSON.stringify(response.data.bridges)));
            } else {
                // No bridges returned – keep current data as the saved state
                setOriginalData(JSON.parse(JSON.stringify(bridges)));
            }
            
            // Invalidate modification history once
            queryClient.invalidateQueries(['bridge-modifications']);
            
            toast.success("Bridge reports saved successfully!");
        } catch (err) {
            console.error(err);
            
            // Provide more specific error messages
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Failed to save bridge reports. Please try again.";
            
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

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <Landmark className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-lg">Bridges / Overflow Bridges</h4>
                        <p className="text-gray-600 text-sm">
                            One report per typhoon — update anytime to keep information current.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Road Classification</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name of Bridges</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Areas/Barangays Affected</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Re-routing</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">REMARKS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {paginatedBridges.length === 0 && searchTerm ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-100 text-slate-400 p-4 rounded-full">
                                                <Landmark size={48} />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700">
                                                No results found
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                No bridge matches "<strong>{searchTerm}</strong>"
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
                            ) : paginatedBridges.map((row, index) => {
                                const actualIndex =
                                    (currentPage - 1) * rowsPerPage + index;
                                const fields = [
                                    "road_classification",
                                    "name_of_bridge",
                                    "status",
                                    "areas_affected",
                                    "re_routing",
                                    "remarks",
                                ];

                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {fields.map((field) => {
                                            // Use row ID + field for row-specific tracking
                                            const historyKey = `${row.id}_${field}`;
                                            const fieldHistory =
                                                modificationData?.history?.[historyKey] || [];
                                            const latestChange =
                                                fieldHistory[0];
                                            const previousChange =
                                                fieldHistory.length > 1
                                                    ? fieldHistory[1]
                                                    : null;

                                            const commonProps = {
                                                name: field,
                                                value: row[field] ?? "",
                                                onChange: (e) =>
                                                    handleInputChange(
                                                        actualIndex,
                                                        e
                                                    ),
                                                disabled: disabled,
                                                className:
                                                    "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10 disabled:bg-slate-100 disabled:cursor-not-allowed",
                                            };

                                            return (
                                                <td
                                                    key={field}
                                                    className="px-4 py-3"
                                                >
                                                    <div className="relative">
                                                        <textarea
                                                            {...commonProps}
                                                            placeholder="Enter value..."
                                                            rows="2"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 resize-none"
                                                        />

                                                        {fieldHistory.length >
                                                            0 && (
                                                            <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <History className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer" />
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
                    {errors.bridges && (
                        <div className="text-red-500 text-sm mt-2 px-3">
                            {errors.bridges}
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
                    }
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        disabled={disabled}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg disabled:cursor-not-allowed disabled:opacity-50 transition shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add Row
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !hasChanges || disabled}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : hasChanges ? (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Save Bridges Report</span>
                            </>
                        ) : (
                            <span>No Changes</span>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
