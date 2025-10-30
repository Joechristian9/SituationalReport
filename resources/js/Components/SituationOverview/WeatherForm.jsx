// resources/js/Components/SituationOverview/WeatherForm.jsx
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
import Echo from "laravel-echo";
import Pusher from "pusher-js";

import {
    Cloud,
    Download,
    History,
    Loader2,
    PlusCircle,
    Save,
    User,
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

export default function WeatherForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState({});
    const channelRef = useRef(null);
    const typingTimeoutRef = useRef({});

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

    // Real-time typing indicator using Laravel Echo for cross-device support
    useEffect(() => {
        // Initialize Echo if not already done
        if (!window.Echo) {
            window.Pusher = Pusher;
            window.Echo = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
                wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
                wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
            });
        }
        
        // Join the weather form channel
        const channel = window.Echo.private('weather-form-typing');
        channelRef.current = channel;
        
        // Listen for typing events from other users
        channel.listen('.typing', (data) => {
            const { userId, userName, fieldKey, isTyping } = data;
            
            // Don't show own typing
            if (userId === auth.user.id) return;
            
            setTypingUsers(prev => {
                const newState = { ...prev };
                if (isTyping) {
                    newState[fieldKey] = { userId, userName };
                } else {
                    delete newState[fieldKey];
                }
                return newState;
            });
            
            // Auto-clear typing indicator after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current[fieldKey]) {
                    clearTimeout(typingTimeoutRef.current[fieldKey]);
                }
                typingTimeoutRef.current[fieldKey] = setTimeout(() => {
                    setTypingUsers(prev => {
                        const newState = { ...prev };
                        delete newState[fieldKey];
                        return newState;
                    });
                }, 3000);
            }
        });
        
        return () => {
            if (channelRef.current) {
                channel.stopListening('.typing');
                window.Echo.leave('weather-form-typing');
            }
            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        };
    }, [auth.user.id]);

    // Broadcast typing event to server
    const broadcastTyping = async (rowId, field, isTyping) => {
        try {
            const fieldKey = `${rowId}_${field}`;
            await axios.post(`${APP_URL}/broadcast-typing`, {
                userId: auth.user.id,
                userName: auth.user.name,
                fieldKey,
                isTyping,
                channel: 'weather-form-typing'
            });
        } catch (error) {
            console.error('Failed to broadcast typing:', error);
        }
    };

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

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedReports = [...data.reports];
        updatedReports[index][name] = value;
        setData({ ...data, reports: updatedReports });
        
        // Broadcast typing event
        const row = updatedReports[index];
        broadcastTyping(row.id, name, true);
        
        // Clear typing indicator after user stops typing
        if (typingTimeoutRef.current[`${row.id}_${name}`]) {
            clearTimeout(typingTimeoutRef.current[`${row.id}_${name}`]);
        }
        typingTimeoutRef.current[`${row.id}_${name}`] = setTimeout(() => {
            broadcastTyping(row.id, name, false);
        }, 999000);
    };

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

    const handleSubmit = async () => {
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
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['weather-modifications']);
            
            // Update local state with the response data from server
            if (response.data && response.data.reports) {
                setData({ ...data, reports: response.data.reports });
            }
            
            toast.success("Weather reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(
                "Failed to save. Please check the console for details."
            );
        } finally {
            setIsSaving(false);
            // Force a small delay to ensure state updates
            setTimeout(() => {
                queryClient.invalidateQueries(['weather-modifications']);
            }, 100);
        }
    };

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
                        onChange={(val) => {
                            setSearchTerm(val);
                            setCurrentPage(1);
                        }}
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
                            {paginatedReports.map((row, index) => {
                                const actualIndex =
                                    (currentPage - 1) * rowsPerPage + index;
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
                                            const fieldKey = `${row.id}_${field}`;
                                            const typingUser = typingUsers[fieldKey];
                                            
                                            return (
                                                <td
                                                    key={field}
                                                    className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                >
                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                        {formatFieldName(field)}
                                                    </label>
                                                    <div className="relative mt-1 md:mt-0">
                                                        {typingUser && (
                                                            <div className="absolute -top-6 left-0 flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs z-10">
                                                                <User className="w-3 h-3" />
                                                                <span className="font-medium">{typingUser.userName}</span>
                                                                <span className="text-blue-500">is typing...</span>
                                                            </div>
                                                        )}
                                                        <input
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
                                <span>Save Weather Report</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
