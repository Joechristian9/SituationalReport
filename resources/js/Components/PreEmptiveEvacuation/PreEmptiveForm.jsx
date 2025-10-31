import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import { Users, History, Loader2, PlusCircle, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const formatFieldName = (field) => {
    return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PreEmptiveForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const queryClient = useQueryClient();
    const { auth } = usePage().props;
    const [isSaving, setIsSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    
    // Enhanced search and filtering - search by barangay or evacuation center
    const {
        paginatedData: paginatedReports,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
    } = useTableFilter(data.reports, ['barangay', 'evacuation_center'], 5);

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
        queryKey: ["pre-emptive-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/pre-emptive`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;

        // Auto-calculate totals
        const famInside = parseInt(newReports[index].families || 0);
        const personsInside = parseInt(newReports[index].persons || 0);
        const famOutside = parseInt(newReports[index].outside_families || 0);
        const personsOutside = parseInt(newReports[index].outside_persons || 0);

        newReports[index].total_families = famInside + famOutside;
        newReports[index].total_persons = personsInside + personsOutside;

        setData("reports", newReports);
    };

    const handleAddRow = () => {
        setData("reports", [
            ...data.reports,
            {
                id: `new-${Date.now()}`,
                barangay: "",
                evacuation_center: "",
                families: "",
                persons: "",
                outside_center: "",
                outside_families: "",
                outside_persons: "",
                total_families: 0,
                total_persons: 0,
            },
        ]);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const cleanedReports = data.reports.map(report => ({
                ...report,
                id: typeof report.id === 'string' ? null : report.id
            }));
            
            const response = await axios.post(`${APP_URL}/pre-emptive-reports`, {
                reports: cleanedReports,
            });
            
            await queryClient.invalidateQueries(['pre-emptive-modifications']);
            
            if (response.data && response.data.reports) {
                setData("reports", response.data.reports);
            }
            
            toast.success("Pre-emptive evacuation reports saved successfully!");
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 422) {
                toast.error("Validation failed. Please check the form for errors.");
                console.error("Validation Errors:", err.response.data.errors);
            } else {
                toast.error("Failed to save. Please check the console for details.");
            }
        } finally {
            setIsSaving(false);
            setTimeout(() => {
                queryClient.invalidateQueries(['pre-emptive-modifications']);
            }, 100);
        }
    };

    // Don't block the form if modification history fails
    if (isError) {
        console.error('Error fetching modification data:', error);
    }

    return (
        <TooltipProvider>
        <div className="space-y-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                        Pre-Emptive Evacuation
                    </h3>
                    <p className="text-sm text-slate-500">
                        Enter evacuation center details and displaced families.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by barangay or evacuation center..."
                />

                <div className="flex items-center gap-3">
                    <RowsPerPage
                        rowsPerPage={rowsPerPage}
                        setRowsPerPage={setRowsPerPage}
                    />
                    <DownloadExcelButton
                        data={data.reports}
                        fileName="Pre_Emptive_Evacuation_Reports"
                        sheetName="Pre-Emptive Evacuation"
                    />
                </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3 border-r">Barangay</th>
                            <th className="p-3 border-r">Evacuation Center</th>
                            <th className="p-3 text-right border-r">
                                Families
                            </th>
                            <th className="p-3 text-right border-r">Persons</th>
                            <th className="p-3 border-r">Outside Center</th>
                            <th className="p-3 text-right border-r">
                                Families
                            </th>
                            <th className="p-3 text-right border-r">Persons</th>
                            <th className="p-3 text-right border-r">
                                Total Families
                            </th>
                            <th className="p-3 text-right border-r">
                                Total Persons
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {paginatedReports.map((row, index) => {
                                const actualIndex = (currentPage - 1) * rowsPerPage + index;
                                const fields = [
                                    "barangay",
                                    "evacuation_center",
                                    "families",
                                    "persons",
                                    "outside_center",
                                    "outside_families",
                                    "outside_persons",
                                ];
                                
                                return (
                                <motion.tr
                                    key={row.id}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/60 transition-colors"
                                >
                                    {fields.map((field) => {
                                        const historyKey = `${row.id}_${field}`;
                                        const fieldHistory = modificationData?.history?.[historyKey] || [];
                                        const latestChange = fieldHistory[0];
                                        const previousChange = fieldHistory.length > 1 ? fieldHistory[1] : null;
                                        
                                        const isNumberField = ['families', 'persons', 'outside_families', 'outside_persons'].includes(field);
                                        
                                        return (
                                            <td key={field} className="p-2">
                                                <div className="relative">
                                                    <input
                                                        type={isNumberField ? "number" : "text"}
                                                        name={field}
                                                        value={row[field] ?? ""}
                                                        onChange={(e) => handleInputChange(actualIndex, e)}
                                                        placeholder={isNumberField ? "0" : `Enter ${formatFieldName(field)}`}
                                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${isNumberField ? 'text-right' : ''} ${fieldHistory.length > 0 ? 'pr-10' : ''}`}
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
                                                {latestChange && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Last modified by{" "}
                                                        <span className="font-medium text-blue-700">
                                                            {latestChange.user?.name}
                                                        </span>
                                                    </p>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-right font-semibold text-blue-700">
                                        {row.total_families}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-blue-700">
                                        {row.total_persons}
                                    </td>
                                </motion.tr>
                            );})}
                        </AnimatePresence>
                    </tbody>
                    {/* Table Footer */}
                    <tfoot className="bg-gray-100 font-bold text-gray-800">
                        <tr>
                            <td className="p-2 text-center" colSpan={2}>
                                Grand Total
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_persons || 0),
                                    0
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                {errors.reports && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.reports}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <AddRowButton onClick={handleAddRow} label="Add Row" />
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Save Reports</span>
                        </>
                    )}
                </button>
            </div>
        </div>
        </TooltipProvider>
    );
}
