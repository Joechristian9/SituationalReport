import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import useTableFilter from "@/hooks/useTableFilter";

import { Users, History, Loader2, PlusCircle, Save } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import RowsPerPage from "../ui/RowsPerPage";
import Pagination from "../ui/Pagination";
import DownloadExcelButton from "../ui/DownloadExcelButton";
import AddRowButton from "../ui/AddRowButton";

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
    
    // Helper function to get field modification history
    const getFieldHistory = (rowId, fieldName) => {
        if (!modificationData?.history) return [];
        const historyKey = `${rowId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };
    
    // Helper component to display modification indicator
    const ModificationIndicator = ({ rowId, fieldName }) => {
        const fieldHistory = getFieldHistory(rowId, fieldName);
        const [isOpen, setIsOpen] = useState(false);
        const [isPinned, setIsPinned] = useState(false);
        const buttonRef = useRef(null);
        const [popoverStyle, setPopoverStyle] = useState({});
        
        // Only show icon if this specific field has been modified
        if (fieldHistory.length === 0) return null;
        
        // Get the latest (current) and previous updates
        const currentUpdate = fieldHistory[0];
        const previousUpdate = fieldHistory.length > 1 ? fieldHistory[1] : null;
        
        // Check if this field was updated in the most recent submit (within last 5 minutes)
        const wasJustUpdated = currentUpdate && (new Date() - new Date(currentUpdate.date)) < 5 * 60 * 1000;
        
        // Calculate popover position when opened
        useEffect(() => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const popoverWidth = 384;
                const popoverHeight = 400;
                
                let left = rect.right + 8;
                let top = rect.top;
                
                if (left + popoverWidth > window.innerWidth) {
                    left = rect.left - popoverWidth - 8;
                }
                
                if (top + popoverHeight > window.innerHeight) {
                    top = window.innerHeight - popoverHeight - 16;
                }
                
                if (top < 16) {
                    top = 16;
                }
                
                setPopoverStyle({
                    left: `${left}px`,
                    top: `${top}px`
                });
            }
        }, [isOpen]);
        
        const handleMouseEnter = () => {
            setIsOpen(true);
        };
        
        const handleMouseLeave = () => {
            if (!isPinned) {
                setIsOpen(false);
            }
        };
        
        const handleClick = (e) => {
            e.stopPropagation();
            setIsPinned(!isPinned);
            setIsOpen(true);
        };
        
        const handleClose = () => {
            setIsOpen(false);
            setIsPinned(false);
        };
        
        return (
            <>
                <div 
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {wasJustUpdated && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            New
                        </span>
                    )}
                    
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={handleClick}
                        className={`transition-colors relative ${
                            wasJustUpdated 
                                ? 'text-green-600 hover:text-green-800' 
                                : 'text-blue-600 hover:text-blue-800'
                        }`}
                        title="View modification history"
                    >
                        <History className="w-5 h-5" />
                        {wasJustUpdated && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                        )}
                    </button>
                </div>
                
                {isOpen && (
                    <>
                        {isPinned && (
                            <div 
                                className="fixed inset-0 z-[9998]" 
                                onClick={handleClose}
                            />
                        )}
                        
                        <div 
                            className="fixed bg-white rounded-lg shadow-2xl border-2 border-blue-300 z-[9999] w-96 max-h-[80vh] overflow-y-auto"
                            style={popoverStyle}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-semibold">
                                        Change History
                                    </span>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors flex-shrink-0"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="p-3 space-y-3">
                                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {currentUpdate.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                                                {currentUpdate.user?.name || 'Unknown User'}
                                                {wasJustUpdated && (
                                                    <span className="bg-green-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full uppercase">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-blue-600">
                                                {new Date(currentUpdate.date).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs pl-8">
                                        {currentUpdate.old !== null && currentUpdate.old !== undefined && (
                                            <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                                <div className="text-red-900 break-words">
                                                    {currentUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                                </div>
                                            </div>
                                        )}
                                        <div className="bg-green-50 border border-green-200 rounded p-2">
                                            <div className="font-semibold text-green-700 mb-0.5">Current:</div>
                                            <div className="text-green-900 break-words font-semibold">
                                                {currentUpdate.new || <span className="italic text-green-400">(empty)</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {previousUpdate && (
                                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                {previousUpdate.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-700 text-xs">
                                                    {previousUpdate.user?.name || 'Unknown User'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(previousUpdate.date).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-xs pl-8">
                                            <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                                <div className="text-red-900 break-words">
                                                    {previousUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                                <div className="font-semibold text-yellow-700 mb-0.5">Updated to:</div>
                                                <div className="text-yellow-900 break-words">
                                                    {previousUpdate.new || <span className="italic text-yellow-400">(empty)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </>
        );
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
                                
                                return (
                                <tr
                                    key={row.id}
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
                                                        disabled={disabled}
                                                        className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition ${isNumberField ? 'text-right' : ''} ${fieldHistory.length > 0 ? 'pr-12' : ''} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                                    />
                                                    <ModificationIndicator rowId={row.id} fieldName={field} />
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-right font-semibold text-blue-700">
                                        {row.total_families}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-blue-700">
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
                    )}
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
