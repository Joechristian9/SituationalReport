// resources/js/Components/SituationOverview/WeatherForm.jsx
import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";

// Import icons for better visual feedback and clarity
import { Cloud, History, Loader2, PlusCircle, Save } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

// A helper to format field names nicely
const formatFieldName = (field) => {
    return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function WeatherForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const [isSaving, setIsSaving] = useState(false);

    // Filter and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // --- NEW: dropdown open state + ref for click-outside ---
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

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

    // Fetch modification data (Functionality unchanged)
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

    // Handle input changes
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedReports = [...data.reports];
        updatedReports[index][name] = value;
        setData({ ...data, reports: updatedReports });
    };

    // Add new row
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

    // Submit handler
    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await axios.post(`${APP_URL}/weather-reports`, {
                reports: data.reports,
            });
            toast.success("Weather reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(
                "Failed to save. Please check the console for details."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Derived (filtered + paginated) reports
    const filteredReports = data.reports.filter((report) =>
        report.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredReports.length / rowsPerPage);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    if (isError) {
        return (
            <div className="text-red-500 p-4">
                Error fetching modification data: {error.message}
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl">
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
                    <SearchBar
                        value={searchTerm}
                        onChange={(val) => {
                            setSearchTerm(val);
                            setCurrentPage(1);
                        }}
                        placeholder="Search municipality..."
                    />
                    <RowsPerPage
                        rowsPerPage={rowsPerPage}
                        setRowsPerPage={setRowsPerPage}
                    />
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
                            {paginatedReports.map((row, index) => {
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
                                                    className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>
                                                    <div className="relative mt-1 md:mt-0">
                                                        <input
                                                            name={field}
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
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10"
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
                                                    {latestChange && (
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
                    <AddRowButton
                        onClick={handleAddRow}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>

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
                                <span>Save Weather Report</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
