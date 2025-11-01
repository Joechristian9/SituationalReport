// resources/js/Components/Effects/DamagedHousesForm.jsx
import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import {
    History,
    Loader2,
    PlusCircle,
    Save,
} from "lucide-react";
import { LiaHouseDamageSolid } from "react-icons/lia";
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

export default function DamagedHousesForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    
    // Use the correct key 'damaged_houses' and provide a fallback empty array
    const reports = data?.damaged_houses ?? [];
    
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
    } = useTableFilter(reports, ['barangay'], 5);

    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["damaged-houses-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/damaged-houses`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedReports = [...reports];
        updatedReports[index][name] = value;

        const partially = parseInt(updatedReports[index].partially || 0);
        const totally = parseInt(updatedReports[index].totally || 0);
        updatedReports[index].total = partially + totally;

        setData("damaged_houses", updatedReports);
    };

    const handleAddRow = () => {
        setData("damaged_houses", [
            ...reports,
            {
                id: `new-${Date.now()}`,
                barangay: "",
                partially: "",
                totally: "",
                total: 0,
            },
        ]);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Clean the data: convert string IDs (like "new-123") to null for new rows
            const cleanedReports = reports.map(report => ({
                ...report,
                id: typeof report.id === 'string' ? null : report.id
            }));
            
            console.log("Submitting data:", { damaged_houses: cleanedReports });
            
            const response = await axios.post(`${APP_URL}/damaged-houses-reports`, {
                damaged_houses: cleanedReports,
            });
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['damaged-houses-modifications']);
            
            // Update local state with the response data from server
            if (response.data && response.data.damaged_houses) {
                setData("damaged_houses", response.data.damaged_houses);
            }
            
            toast.success("Damaged houses saved successfully!");
        } catch (err) {
            console.error("Full error:", err);
            console.error("Error response:", err.response?.data);
            
            // Show specific validation errors if available
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat();
                errorMessages.forEach(msg => toast.error(msg));
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Failed to save. Please check the console for details.");
            }
        } finally {
            setIsSaving(false);
            // Force a small delay to ensure state updates
            setTimeout(() => {
                queryClient.invalidateQueries(['damaged-houses-modifications']);
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

    // Calculations will now work because 'reports' is a safe, guaranteed array
    const grandTotalPartially = reports.reduce(
        (sum, row) => sum + parseInt(row.partially || 0),
        0
    );
    const grandTotalTotally = reports.reduce(
        (sum, row) => sum + parseInt(row.totally || 0),
        0
    );
    const grandTotal = reports.reduce(
        (sum, row) => sum + parseInt(row.total || 0),
        0
    );

    return (
        <TooltipProvider>
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                        <LiaHouseDamageSolid className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Damaged Houses
                        </h3>
                        <p className="text-sm text-slate-500">
                            Track damaged houses per barangay.
                        </p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    {/* Left: Search bar */}
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search barangay..."
                    />

                    {/* Right: Rows dropdown + download button side-by-side */}
                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={reports}
                            fileName="Damaged_Houses"
                            sheetName="Damaged Houses"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">Barangay</th>
                                <th className="p-3 border-r text-right">Partially</th>
                                <th className="p-3 border-r text-right">Totally</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedReports.map((row, index) => {
                                const actualIndex =
                                    (currentPage - 1) * rowsPerPage + index;
                                const fields = [
                                    "barangay",
                                    "partially",
                                    "totally",
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
                                                            type={
                                                                field === "barangay"
                                                                    ? "text"
                                                                    : "number"
                                                            }
                                                            min={
                                                                field !== "barangay"
                                                                    ? 0
                                                                    : undefined
                                                            }
                                                            name={field}
                                                            value={
                                                                row[field] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    actualIndex,
                                                                    e
                                                                )
                                                            }
                                                            placeholder="Enter value..."
                                                            className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10 ${field !== "barangay" ? "text-right" : ""}`}
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
                                        <td className="block md:table-cell p-3 bg-slate-100/60">
                                            <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                Total
                                            </label>
                                            <div className="font-semibold text-slate-800 md:text-right">
                                                {row.total}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {/* Table Footer */}
                        <tfoot className="hidden md:table-footer-group bg-slate-100 font-bold text-slate-800">
                            <tr>
                                <td className="p-3 text-left">TOTAL</td>
                                <td className="p-3 text-right text-blue-700">
                                    {grandTotalPartially}
                                </td>
                                <td className="p-3 text-right text-blue-700">
                                    {grandTotalTotally}
                                </td>
                                <td className="p-3 text-right text-blue-800">
                                    {grandTotal}
                                </td>
                            </tr>
                        </tfoot>
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
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                            <PlusCircle size={16} /> Add Barangay Row
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
                                <span>Save Damaged Houses</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
