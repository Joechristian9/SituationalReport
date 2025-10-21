// resources/js/Components/SituationOverview/WaterLevelForm.jsx
import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import DownloadPDFButton from "../ui/DownloadPDFButton";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";

import { Droplets, History, Loader2, PlusCircle, Save } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

// Helper to format field names for labels
const formatFieldName = (field) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function WaterLevelForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Fetch modification history
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
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedReports = [...data.reports];
        updatedReports[index][name] = value;
        setData({ ...data, reports: updatedReports });
    };

    const handleAddRow = () => {
        setData({
            ...data,
            reports: [
                ...data.reports,
                {
                    id: `new-${Date.now()}`,
                    gauging_station: "",
                    current_level: "",
                    alarm_level: "",
                    critical_level: "",
                    affected_areas: "",
                },
            ],
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await axios.post(`${APP_URL}/water-level-reports`, {
                reports: data.reports,
            });
            toast.success("Water level reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(
                "Failed to save water levels. Check console for details."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Filter, paginate, and display
    const filteredReports = data.reports.filter((report) =>
        report.gauging_station?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredReports.length / rowsPerPage);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    if (isError)
        return (
            <div className="text-red-500 p-4">
                Error fetching modification data: {error.message}
            </div>
        );

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
                        <DownloadPDFButton
                            data={data.reports}
                            fileName="Water_Level_Reports"
                            title="Water Level Reports"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-cyan-600">
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
                            {paginatedReports.map((row, index) => {
                                const fields = [
                                    "gauging_station",
                                    "current_level",
                                    "alarm_level",
                                    "critical_level",
                                    "affected_areas",
                                ];

                                return (
                                    <tr
                                        key={row.id}
                                        className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
                                    >
                                        {fields.map((field) => {
                                            const fieldHistory =
                                                modificationData?.history?.[
                                                    field
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
                                                    className="block md:table-cell p-3 border-b border-slate-200 last:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>
                                                    <div className="relative mt-1 md:mt-0">
                                                        <input
                                                            name={field}
                                                            type={
                                                                field.includes(
                                                                    "_level"
                                                                )
                                                                    ? "number"
                                                                    : "text"
                                                            }
                                                            value={
                                                                row[field] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    index,
                                                                    e
                                                                )
                                                            }
                                                            placeholder="Enter value..."
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none transition pr-10"
                                                        />
                                                        {fieldHistory.length >
                                                            0 && (
                                                            <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <History className="w-5 h-5 text-slate-400 hover:text-cyan-600" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="right"
                                                                        className="max-w-xs bg-slate-800 text-white p-3 rounded-lg shadow-lg"
                                                                    >
                                                                        <div className="text-sm space-y-2">
                                                                            <div>
                                                                                <p className="font-bold text-white mb-1">
                                                                                    Latest
                                                                                    Change:
                                                                                </p>
                                                                                <p>
                                                                                    <span className="font-semibold text-cyan-300">
                                                                                        {
                                                                                            latestChange
                                                                                                ?.user
                                                                                                ?.name
                                                                                        }
                                                                                    </span>{" "}
                                                                                    changed
                                                                                    from{" "}
                                                                                    <span className="text-red-400 font-mono">
                                                                                        {latestChange?.old ??
                                                                                            "—"}
                                                                                    </span>{" "}
                                                                                    to{" "}
                                                                                    <span className="text-green-400 font-mono">
                                                                                        {latestChange?.new ??
                                                                                            "—"}
                                                                                    </span>
                                                                                </p>
                                                                                <p className="text-xs text-gray-400">
                                                                                    {new Date(
                                                                                        latestChange?.date
                                                                                    ).toLocaleString()}
                                                                                </p>
                                                                            </div>
                                                                            {previousChange && (
                                                                                <div className="mt-2 pt-2 border-t border-gray-600">
                                                                                    <p className="font-bold text-gray-300 mb-1">
                                                                                        Previous
                                                                                        Change:
                                                                                    </p>
                                                                                    <p>
                                                                                        <span className="font-semibold text-cyan-300">
                                                                                            {
                                                                                                previousChange
                                                                                                    ?.user
                                                                                                    ?.name
                                                                                            }
                                                                                        </span>{" "}
                                                                                        changed
                                                                                        from{" "}
                                                                                        <span className="text-red-400 font-mono">
                                                                                            {previousChange?.old ??
                                                                                                "—"}
                                                                                        </span>{" "}
                                                                                        to{" "}
                                                                                        <span className="text-green-400 font-mono">
                                                                                            {previousChange?.new ??
                                                                                                "—"}
                                                                                        </span>
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-400">
                                                                                        {new Date(
                                                                                            previousChange?.date
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
                                                            <span className="font-medium text-cyan-700">
                                                                {
                                                                    latestChange
                                                                        ?.user
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

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) =>
                        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
                    }
                />

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                    <AddRowButton
                        onClick={handleAddRow}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
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
