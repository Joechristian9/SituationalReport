import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";
import ModificationIndicator from "@/Components/shared/ModificationIndicator";

import { Users, Loader2, PlusCircle, Save } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import TablePagination from "@/Components/ui/TablePagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";
import { savedMessage } from "@/lib/offline/queue";
import { CELL_LABEL, STACKED_TABLE } from "@/lib/responsiveTable";

const formatFieldName = (field) => {
    return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PreEmptiveForm({ data, setData, errors, disabled = false }) {
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
        pagination,
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
        if (disabled) {
            toast.error("Forms are currently disabled. Please wait for an active typhoon report.");
            return;
        }
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
            
            // Only overwrite if the server actually returns at least one report
            if (response.data && Array.isArray(response.data.reports) && response.data.reports.length > 0) {
                setData("reports", response.data.reports);
            }
            
            toast.success(savedMessage(response, "Pre-emptive evacuation reports saved successfully!"));
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
    
    // Helper function to get field modification history
    const getFieldHistory = (rowId, fieldName) => {
        if (!modificationData?.history) return [];
        const historyKey = `${rowId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };
    
    
    return (
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
                    <DownloadExcelButton
                        data={data.reports}
                        fileName="Pre_Emptive_Evacuation_Reports"
                        sheetName="Pre-Emptive Evacuation"
                    />
                </div>
            </div>
            {/* Table */}
            <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200 md:shadow-sm">
                <table className={`w-full text-sm border-collapse ${STACKED_TABLE} md:min-w-[72rem]`}>
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
                            {paginatedReports.length === 0 && searchTerm ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-100 text-slate-400 p-4 rounded-full">
                                                <Users size={48} />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700">
                                                No results found
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                No barangay or evacuation center matches "<strong>{searchTerm}</strong>"
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
                            ) : paginatedReports.map((row, index) => {
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
                                const labels = {"barangay":"Barangay","evacuation_center":"Evacuation center","families":"Families (in center)","persons":"Persons (in center)","outside_center":"Outside center","outside_families":"Families (outside center)","outside_persons":"Persons (outside center)","total_families":"Total families","total_persons":"Total persons"};
                                
                                return (
                                <tr
                                    key={row.id}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/60 transition-colors"
                                >
                                    {fields.map((field) => {
                                        
                                        const isNumberField = ['families', 'persons', 'outside_families', 'outside_persons'].includes(field);
                                        
                                        return (
                                            <td key={field} className="p-2">
                                                <span className={CELL_LABEL}>{labels[field]}</span>
                                                <div className="relative">
                                                    <input
                                                        type={isNumberField ? "number" : "text"}
                                                        name={field}
                                                        aria-label={labels[field]}
                                                        value={row[field] ?? ""}
                                                        onChange={(e) => handleInputChange(actualIndex, e)}
                                                        placeholder={isNumberField ? "0" : `Enter ${formatFieldName(field)}`}
                                                        disabled={disabled}
                                                        className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition ${isNumberField ? 'text-right' : ''} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                                    />
                                                    <ModificationIndicator 
                                                        recordId={row.id} 
                                                        fieldName={field}
                                                        getFieldHistory={getFieldHistory}
                                                        currentValue={row[field]}
                                                        showLastModified={true}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-right font-semibold text-blue-700 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                        <span className={CELL_LABEL}>Total families</span>
                                        {row.total_families}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-blue-700 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                        <span className={CELL_LABEL}>Total persons</span>
                                        {row.total_persons}
                                    </td>
                                </tr>
                            );})}
                    </tbody>
                    {/* Table Footer - Only show when there are results */}
                    {(paginatedReports.length > 0 || !searchTerm) && (
                    <tfoot className="bg-gray-100 font-bold text-gray-800">
                        <tr>
                            <td className="p-2 text-center" colSpan={2}>
                                Grand Total
                            </td>
                            <td className="p-2 text-right text-blue-600 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Families (in center)</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Persons (in center)</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 max-md:hidden"></td>
                            <td className="p-2 text-right text-blue-600 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Families (outside center)</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Persons (outside center)</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Total families</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800 max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-3">
                                <span className={CELL_LABEL}>Total persons</span>
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_persons || 0),
                                    0
                                )}
                            </td>
                        </tr>
                    </tfoot>
                    )}
                </table>
                {errors.reports && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.reports}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <TablePagination {...pagination} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <AddRowButton
                        onClick={handleAddRow}
                        disabled={disabled}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSaving || disabled}
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
                            <span>{disabled ? 'Forms Disabled' : 'Save Pre-Emptive Reports'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
