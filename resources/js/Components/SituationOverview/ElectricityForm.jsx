// resources/js/Components/SituationOverview/ElectricityForm.jsx

import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
/* import DownloadPDFButton from "../ui/DownloadPDFButton"; */
import AddRowButton from "../ui/AddRowButton";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { Zap, History, Loader2, PlusCircle, Save, User } from "lucide-react";
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

export default function ElectricityForm({ data, setData, errors }) {
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

    // Real-time typing indicator
    useEffect(() => {
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
        
        const channel = window.Echo.private('electricity-form-typing');
        channelRef.current = channel;
        
        channel.listen('.typing', (data) => {
            const { userId, userName, fieldKey, isTyping } = data;
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
                window.Echo.leave('electricity-form-typing');
            }
            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        };
    }, [auth.user.id]);

    const broadcastTyping = async (rowId, field, isTyping) => {
        try {
            const fieldKey = `${rowId}_${field}`;
            await axios.post(`${APP_URL}/broadcast-typing`, {
                userId: auth.user.id,
                userName: auth.user.name,
                fieldKey,
                isTyping,
                channel: 'electricity-form-typing'
            });
        } catch (error) {
            console.error('Failed to broadcast typing:', error);
        }
    };

    // Using a safe default for data.electricityServices
    const services = data.electricityServices ?? [];

    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["electricity-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/electricity`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newServices = [...services];
        newServices[index][name] = value;
        setData("electricityServices", newServices);
        
        // Broadcast typing event
        const row = newServices[index];
        broadcastTyping(row.id, name, true);
        
        // Clear typing indicator after user stops typing
        const fieldKey = `${row.id}_${name}`;
        if (typingTimeoutRef.current[fieldKey]) {
            clearTimeout(typingTimeoutRef.current[fieldKey]);
        }
        typingTimeoutRef.current[fieldKey] = setTimeout(() => {
            broadcastTyping(row.id, name, false);
        }, 1000);
    };

    const handleAddRow = () => {
        setData("electricityServices", [
            ...services,
            {
                id: `new-${Date.now()}`,
                status: "",
                barangays_affected: "",
                remarks: "",
            },
        ]);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Clean string IDs for new rows
            const cleanedServices = services.map(service => ({
                ...service,
                id: typeof service.id === 'string' ? null : service.id
            }));
            
            const response = await axios.post(`${APP_URL}/electricity-reports`, {
                electricityServices: cleanedServices,
            });
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['electricity-modifications']);
            
            // Update local state with server response if available
            if (response.data && response.data.electricityServices) {
                setData("electricityServices", response.data.electricityServices);
            }
            
            toast.success("Electricity services saved successfully!");
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
                queryClient.invalidateQueries(['electricity-modifications']);
            }, 100);
        }
    };

    const filteredServices = services.filter((service) =>
        service.barangays_affected
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredServices.length / rowsPerPage);
    const paginatedServices = filteredServices.slice(
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
            <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                            Electricity Services Monitoring
                        </h3>
                        <p className="text-sm text-slate-500">
                            Enter the status of electricity services and
                            affected areas.
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
                        placeholder="Search affected barangays..."
                    />
                    <div className="flex items-center gap-3">
                        <RowsPerPage
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                        />
                        <DownloadExcelButton
                            data={services}
                            fileName="Electricity_Services_Report"
                            sheetName="Electricity Services"
                        />
                        {/* <DownloadPDFButton
                            data={services}
                            fileName="Electricity_Services_Report"
                            title="Electricity Services Report"
                        /> */}
                    </div>
                </div>

                {/* Table */}
                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="hidden md:table-header-group bg-blue-500">
                            <tr className="text-left text-white font-semibold">
                                <th className="p-3 border-r">Status</th>
                                <th className="p-3 border-r">
                                    Barangays Affected
                                </th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                            {paginatedServices.map((row, index) => {
                                const actualIndex =
                                    (currentPage - 1) * rowsPerPage + index;
                                const fields = [
                                    "status",
                                    "barangays_affected",
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
                    {errors.electricityServices && (
                        <div className="text-red-500 text-sm mt-2 px-3">
                            {errors.electricityServices}
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
                                <span>Save Report</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
