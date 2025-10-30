// resources/js/Components/SituationOverview/WaterLevelForm.jsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";

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

export default function WaterLevelForm({ data, setData }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

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

    // --- DEBUG: see what data looks like on every render (remove later)
    // console.log("WaterLevelForm render data.reports length:", data.reports.length);

    // Compute pagination indices
    const filteredReports = data.reports.filter((report) =>
        report.gauging_station
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReports.length / rowsPerPage)
    );
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedReports = filteredReports.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    // Handle input typing — use absolute index (index in the original data.reports)
    const handleInputChange = (absoluteIndex, event) => {
        const { name, value } = event.target;

        // Debug: show which absolute index is being edited
        console.log(
            "handleInputChange -> absoluteIndex:",
            absoluteIndex,
            "name:",
            name,
            "value:",
            value
        );

        setData((prev) => {
            const updatedReports = [...prev.reports];

            // Safety: if absoluteIndex is out of bounds, bail out (prevents accidental insertion)
            if (absoluteIndex < 0 || absoluteIndex >= updatedReports.length) {
                console.warn(
                    "handleInputChange: absoluteIndex out of range",
                    absoluteIndex
                );
                return prev;
            }

            updatedReports[absoluteIndex] = {
                ...updatedReports[absoluteIndex],
                [name]: value,
            };
            return { ...prev, reports: updatedReports };
        });
    };

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
                        id: null,
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

    // Submit (unchanged except debug)
    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // IMPORTANT: send only expected fields if backend requires it
            const cleaned = data.reports.map((r) => ({
                id: (typeof r.id === 'string' || !r.id) ? null : r.id,
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

            console.log("Submitting cleaned payload:", cleaned);
            const response = await axios.post(`${APP_URL}/water-level-reports`, {
                reports: cleaned,
            });
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['water-level-modifications']);
            
            // Update local state with the response data from server
            if (response.data && response.data.reports) {
                setData({ ...data, reports: response.data.reports });
            }
            
            toast.success("Water level reports saved successfully!");
        } catch (err) {
            console.error("Save error:", err.response?.data || err);
            if (err.response?.status === 422) {
                toast.error("Validation failed — check required fields.");
                console.table(err.response.data.errors);
            } else {
                toast.error(
                    "Failed to save water levels. Check console for details."
                );
            }
        } finally {
            setIsSaving(false);
            // Force a small delay to ensure state updates
            setTimeout(() => {
                queryClient.invalidateQueries(['water-level-modifications']);
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
                        onChange={(val) => {
                            setSearchTerm(val);
                            setCurrentPage(1);
                        }}
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
                            {paginatedReports.map((row, pageIndex) => {
                                // Convert pageIndex -> absolute index in original data.reports
                                const absoluteIndex = startIndex + pageIndex;
                                const fields = [
                                    "gauging_station",
                                    "current_level",
                                    "alarm_level",
                                    "critical_level",
                                    "affected_areas",
                                ];

                                return (
                                    <tr
                                        key={row.id ?? `new-${absoluteIndex}`} // stable key
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
                                                            value={
                                                                data.reports[
                                                                    absoluteIndex
                                                                ]?.[field] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    absoluteIndex,
                                                                    e
                                                                )
                                                            }
                                                            placeholder="Enter value..."
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none transition pr-10"
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
                                                    {latestChange && (
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
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Save Water Level</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
