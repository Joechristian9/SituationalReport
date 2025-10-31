// resources/js/Components/Effects/InjuredForm.jsx

import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import useTableFilter from "@/hooks/useTableFilter";

import { UserPlus, History, Loader2, PlusCircle, Save } from "lucide-react";
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

// The enhanced SexSelector component as dropdown
const SexSelector = ({ value, onChange }) => {
    // Normalize value for comparison (case-insensitive, handles null/undefined)
    const currentValue = value ? String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase() : "";
    
    return (
        <select
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition bg-white"
        >
            <option value="">Select sex...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
        </select>
    );
};

export default function InjuredForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    
    const injuredList = data?.injured ?? [];
    
    // Enhanced search and filtering across multiple fields
    const {
        paginatedData: paginatedInjured,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(injuredList, ['name', 'address'], 5);

    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["injured-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}/modifications/injured`);
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...injuredList];
        newRows[index][name] = value;
        setData("injured", newRows);
    };

    const handleAddRow = () => {
        setData("injured", [
            ...injuredList,
            {
                id: `new-${Date.now()}`,
                name: "",
                age: "",
                sex: "",
                address: "",
                diagnosis: "",
                date_admitted: "",
                place_of_incident: "",
                remarks: "",
            },
        ]);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Clean string IDs for new rows
            const cleanedInjured = injuredList.map(injured => ({
                ...injured,
                id: typeof injured.id === 'string' ? null : injured.id
            }));
            
            const response = await axios.post(
                `${APP_URL}/injured`, 
                { injured: cleanedInjured },
                { headers: { 'Accept': 'application/json' } }
            );
            
            // Update local state with server response if available
            if (response.data && response.data.injured) {
                setData("injured", response.data.injured);
                
                // Invalidate and refetch modification history after state update
                await queryClient.invalidateQueries(['injured-modifications']);
            }
            
            toast.success(response.data?.message || "Injured report saved successfully!");
        } catch (err) {
            console.error("Save error:", err);
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
            // Force refetch after small delay to ensure data is fresh
            setTimeout(() => {
                queryClient.invalidateQueries(['injured-modifications']);
            }, 200);
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
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Casualties - Injured
                        </h3>
                        <p className="text-sm text-slate-500">
                            Record the details for each injured individual.
                        </p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by name or address..."
                    />
                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={injuredList}
                            fileName="Casualties_Injured_Report"
                            sheetName="Injured"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">Name</th>
                                <th className="p-3 border-r">Age</th>
                                <th className="p-3 border-r">Sex</th>
                                <th className="p-3 border-r">Address</th>
                                <th className="p-3 border-r">Diagnosis</th>
                                <th className="p-3 border-r">Date Admitted</th>
                                <th className="p-3 border-r">Place of Incident</th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedInjured.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td
                                        colSpan="8"
                                        className="text-center py-12 px-4 text-gray-500"
                                    >
                                        <UserPlus
                                            size={40}
                                            className="mx-auto text-gray-400"
                                        />
                                        <p className="font-medium mt-2">
                                            No injured persons have been recorded.
                                        </p>
                                        <p className="text-xs mt-1">
                                            Click{" "}
                                            <span className="font-semibold text-blue-600">
                                                "Add Row"
                                            </span>{" "}
                                            to begin.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInjured.map((row, index) => {
                                    const actualIndex = (currentPage - 1) * rowsPerPage + index;
                                    const fields = [
                                        "name",
                                        "age",
                                        "sex",
                                        "address",
                                        "diagnosis",
                                        "date_admitted",
                                        "place_of_incident",
                                        "remarks",
                                    ];

                                    return (
                                        <tr
                                            key={row.id}
                                            className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
                                        >
                                            {fields.map((field) => {
                                                const historyKey = `${row.id}_${field}`;
                                                const fieldHistory =
                                                    modificationData?.history?.[historyKey] || [];
                                                const latestChange = fieldHistory[0];
                                                const previousChange =
                                                    fieldHistory.length > 1 ? fieldHistory[1] : null;

                                                return (
                                                    <td
                                                        key={field}
                                                        className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                    >
                                                        <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                            {formatFieldName(field)}
                                                        </label>
                                                        <div className="relative mt-1 md:mt-0">
                                                            {field === "sex" ? (
                                                                <div className="relative">
                                                                    <SexSelector
                                                                        value={row.sex}
                                                                        onChange={(newValue) =>
                                                                            handleInputChange(actualIndex, {
                                                                                target: {
                                                                                    name: "sex",
                                                                                    value: newValue,
                                                                                },
                                                                            })
                                                                        }
                                                                    />
                                                                    {fieldHistory.length > 0 && (
                                                                        <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <History className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer" />
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
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        type={
                                                                            field === "date_admitted"
                                                                                ? "date"
                                                                                : field === "age"
                                                                                ? "number"
                                                                                : "text"
                                                                        }
                                                                        min={field === "age" ? 0 : undefined}
                                                                        name={field}
                                                                        value={row[field] ?? ""}
                                                                        onChange={(e) =>
                                                                            handleInputChange(actualIndex, e)
                                                                        }
                                                                        placeholder={`Enter ${formatFieldName(
                                                                            field
                                                                        ).toLowerCase()}...`}
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10"
                                                                    />
                                                                    {fieldHistory.length > 0 && (
                                                                        <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <History className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer" />
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
                                                                </>
                                                            )}
                                                        </div>
                                                        {latestChange &&
                                                            row[field] &&
                                                            row[field] !== "" && (
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
                                })
                            )}
                        </tbody>
                    </table>
                    {errors.injured && (
                        <div className="text-red-500 text-sm mt-2 px-3">
                            {errors.injured}
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
                                <span>Save Injured Report</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
