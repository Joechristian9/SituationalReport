// resources/js/Components/SituationOverview/WaterForm.jsx

import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import useTableFilter from "@/hooks/useTableFilter";

import { Droplet, History, Loader2, PlusCircle, Save } from "lucide-react";
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

export default function WaterForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    
    const waterServices = data?.waterServices ?? [];
    
    // Enhanced search and filtering across multiple fields
    const {
        paginatedData: paginatedServices,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(waterServices, ['source_of_water'], 5);

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
        queryKey: ["water-service-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/water-service`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...waterServices];
        newRows[index][name] = value;
        setData("waterServices", newRows);
    };

    const handleAddRow = () => {
        setData("waterServices", [
            ...waterServices,
            {
                id: `new-${Date.now()}`,
                source_of_water: "",
                barangays_served: "",
                status: "",
                remarks: "",
            },
        ]);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Clean string IDs for new rows
            const cleanedServices = waterServices.map(service => ({
                ...service,
                id: typeof service.id === 'string' ? null : service.id
            }));
            
            const response = await axios.post(`${APP_URL}/water-service-reports`, {
                waterServices: cleanedServices,
            });
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['water-service-modifications']);
            
            // Update local state with server response if available
            if (response.data && response.data.waterServices) {
                setData("waterServices", response.data.waterServices);
            }
            
            toast.success("Water service reports saved successfully!");
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 422) {
                toast.error(
                    "Validation failed. Please check the form for errors."
                );
                console.error("Validation Errors:", err.response.data.errors);
            } else {
                toast.error(
                    "Failed to save. Please check the console for details."
                );
            }
        } finally {
            setIsSaving(false);
            // Force refetch after small delay
            setTimeout(() => {
                queryClient.invalidateQueries(['water-service-modifications']);
            }, 100);
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
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="bg-sky-100 text-sky-600 p-2 rounded-lg">
                        <Droplet size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Water Services Monitoring
                        </h3>
                        <p className="text-sm text-slate-500">
                            Enter details of available water sources and
                            services.
                        </p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by water source..."
                    />
                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={waterServices}
                            fileName="Water_Services_Report"
                            sheetName="Water Services"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">
                                    Source of Water
                                </th>
                                <th className="p-3 border-r">
                                    Barangays Served
                                </th>
                                <th className="p-3 border-r">Status</th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedServices.map((row, index) => {
                                const actualIndex =
                                    (currentPage - 1) * rowsPerPage + index;
                                const fields = [
                                    "source_of_water",
                                    "barangays_served",
                                    "status",
                                    "remarks",
                                ];

                                return (
                                    <tr
                                        key={row.id}
                                        className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
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
                                                className:
                                                    "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10",
                                            };

                                            return (
                                                <td
                                                    key={field}
                                                    className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>
                                                    <div className="relative mt-1 md:mt-0">
                                                        {/* --- FIXED RENDER LOGIC --- */}
                                                        {field === "status" ? (
                                                            <select
                                                                {...commonProps}
                                                            >
                                                                <option value="">
                                                                    Select
                                                                    Status
                                                                </option>
                                                                <option value="functional">
                                                                    Functional
                                                                </option>
                                                                <option value="available">
                                                                    Available
                                                                </option>
                                                                <option value="not available">
                                                                    Not
                                                                    Available
                                                                </option>
                                                            </select>
                                                        ) : (
                                                            <input
                                                                {...commonProps}
                                                                placeholder="Enter value..."
                                                            />
                                                        )}

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
                    {errors.waterServices && (
                        <div className="text-red-500 text-sm mt-2 px-3">
                            {errors.waterServices}
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
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <AddRowButton
                            onClick={handleAddRow}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                            <PlusCircle size={16} /> Add Row
                        </AddRowButton>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Save Water Report</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
