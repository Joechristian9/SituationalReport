import SearchBar from "@/Components/ui/SearchBar";
import RowsPerPage from "@/Components/ui/RowsPerPage";
import Pagination from "@/Components/ui/Pagination";
import DownloadExcelButton from "@/Components/ui/DownloadExcelButton";
import AddRowButton from "@/Components/ui/AddRowButton";
import TyphoonStatusAlert from "@/Components/TyphoonStatusAlert";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";

import { useState, useEffect, useMemo } from "react";
import { usePage, Head } from "@inertiajs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import useTableFilter from "@/hooks/useTableFilter";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Save, History, ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";
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

export default function Index() {
    const { flash, operations, typhoon } = usePage().props;
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    
    // Initialize responses from backend or default
    const [responses, setResponses] = useState(
        operations && operations.length > 0
            ? operations
            : [
                {
                    id: `new-${Date.now()}`,
                    team_unit: "",
                    incident: "",
                    datetime: "",
                    location: "",
                    actions: "",
                    remarks: "",
                },
            ]
    );

    // Enhanced search and filtering
    const {
        paginatedData: paginatedResponses,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(responses, ['team_unit', 'incident', 'location'], 5);

    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["response-operations-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/response-operations`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    // Update from backend when data changes
    useEffect(() => {
        if (operations && operations.length > 0) {
            setResponses(operations);
        }
    }, [operations]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Response Operations" },
    ];

    const addRow = () => {
        setResponses([
            ...responses,
            {
                id: `new-${Date.now()}`,
                team_unit: "",
                incident: "",
                datetime: "",
                location: "",
                actions: "",
                remarks: "",
            },
        ]);
    };

    const handleChange = (index, field, value) => {
        const updatedResponses = [...responses];
        updatedResponses[index][field] = value;
        setResponses(updatedResponses);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Clean the data: convert string IDs to null for new rows
            const cleanedResponses = responses.map(response => ({
                ...response,
                id: typeof response.id === 'string' ? null : response.id
            }));
            
            console.log("Submitting data:", { responses: cleanedResponses });
            
            const response = await axios.post(`${APP_URL}/response-operations-reports`, {
                responses: cleanedResponses,
            });
            
            // Invalidate and refetch modification history
            await queryClient.invalidateQueries(['response-operations-modifications']);
            
            // Update local state with the response data from server
            // Only overwrite if the server actually returns at least one response
            if (response.data && Array.isArray(response.data.responses) && response.data.responses.length > 0) {
                setResponses(response.data.responses);
            }
            
            toast.success("Response operations saved successfully!");
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
            setTimeout(() => {
                queryClient.invalidateQueries(['response-operations-modifications']);
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
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Response Operations</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                {/* ✅ Header with breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />

                        {(() => {
                            const user = usePage().props.auth.user;
                            const isAdmin = user.roles?.some(
                                (r) => r.name?.toLowerCase() === "admin"
                            );

                            return isAdmin ? (
                                <Breadcrumbs
                                    crumbs={[
                                        {
                                            href: route("admin.dashboard"),
                                            label: "Dashboard",
                                        },
                                        { label: "Response Operations" },
                                    ]}
                                    Response
                                    Operations
                                />
                            ) : (
                                <Breadcrumbs
                                    crumbs={[{ label: "Response Operations" }]}
                                />
                            );
                        })()}
                    </div>
                    <ActiveTyphoonHeader 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    
                    <TooltipProvider>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            Response Operations
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Record details of emergency response operations.
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                {/* Filter Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                                    <SearchBar
                                        value={searchTerm}
                                        onChange={setSearchTerm}
                                        placeholder="Search team, incident, location..."
                                    />

                                    <div className="flex items-center gap-3">
                                        <RowsPerPage
                                            rowsPerPage={rowsPerPage}
                                            setRowsPerPage={setRowsPerPage}
                                        />
                                        <DownloadExcelButton
                                            data={responses}
                                            fileName="Response_Operations"
                                            sheetName="Response Operations"
                                        />
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="hidden md:table-header-group bg-blue-500">
                                            <tr className="text-left text-white font-semibold">
                                                <th className="p-3 border-r">Team/Unit</th>
                                                <th className="p-3 border-r">Incident Responded</th>
                                                <th className="p-3 border-r">Time & Date</th>
                                                <th className="p-3 border-r">Location</th>
                                                <th className="p-3 border-r">Actions Taken</th>
                                                <th className="p-3 border-r">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="flex flex-col md:table-row-group gap-4 md:gap-0">
                                            {paginatedResponses.length === 0 && searchTerm ? (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <div className="bg-slate-100 text-slate-400 p-4 rounded-full">
                                                                <ActivitySquare size={48} />
                                                            </div>
                                                            <p className="text-lg font-semibold text-slate-700">
                                                                No results found
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                No response operation matches "<strong>{searchTerm}</strong>"
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
                                            ) : paginatedResponses.map((row, index) => {
                                                const actualIndex = (currentPage - 1) * rowsPerPage + index;
                                                const fields = [
                                                    "team_unit",
                                                    "incident",
                                                    "datetime",
                                                    "location",
                                                    "actions",
                                                    "remarks",
                                                ];
                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className="block md:table-row border border-slate-200 rounded-lg md:border-0 md:border-t"
                                                    >
                                                        {fields.map((field) => {
                                                            const historyKey = `${row.id}_${field}`;
                                                            const fieldHistory = modificationData?.history?.[historyKey] || [];
                                                            const latestChange = fieldHistory[0];
                                                            const previousChange = fieldHistory.length > 1 ? fieldHistory[1] : null;
                                                            
                                                            const isTextarea = field === 'actions' || field === 'remarks';
                                                            const isDatetime = field === 'datetime';
                                                            
                                                            return (
                                                                <td
                                                                    key={field}
                                                                    className="block md:table-cell p-3 md:p-3 border-b border-slate-200 last:border-b-0 md:border-b-0"
                                                                >
                                                                    <label className="text-xs font-semibold text-slate-600 md:hidden">
                                                                        {formatFieldName(field)}
                                                                    </label>
                                                                    <div className="relative mt-1 md:mt-0">
                                                                        {isTextarea ? (
                                                                            <textarea
                                                                                name={field}
                                                                                rows={2}
                                                                                value={row[field] ?? ""}
                                                                                onChange={(e) =>
                                                                                    handleChange(actualIndex, field, e.target.value)
                                                                                }
                                                                                placeholder="Enter value..."
                                                                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10 resize-none"
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type={isDatetime ? "datetime-local" : "text"}
                                                                                name={field}
                                                                                value={row[field] ?? ""}
                                                                                onChange={(e) =>
                                                                                    handleChange(actualIndex, field, e.target.value)
                                                                                }
                                                                                placeholder="Enter value..."
                                                                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition pr-10"
                                                                            />
                                                                        )}
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
                                                                                                    {new Date(latestChange.date).toLocaleString()}
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
                                                                                                        {new Date(previousChange.date).toLocaleString()}
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
                                        onClick={addRow}
                                        className="flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
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
                                                <span>Save Response Operations</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </CardContent>

                        </Card>
                    </TooltipProvider>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
