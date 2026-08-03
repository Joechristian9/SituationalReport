import React, { useRef, useState, useEffect } from "react";
import { Rows3, ChevronDown, Check } from "lucide-react";

export default function RowsPerPage({
    rowsPerPage,
    setRowsPerPage,
    totalRows,
}) {
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

    const generateRowsPerPageOptions = () => {
        const defaultOptions = [5, 10, 20];
        const dynamicOptions = new Set(defaultOptions); // Use a Set to avoid duplicates

        if (totalRows > 20) {
            for (let i = 25; i <= totalRows; i += 5) {
                dynamicOptions.add(i);
            }
        }

        // Add the totalRows as an option if it's not already included
        if (totalRows > 0) {
            dynamicOptions.add(totalRows);
        }

        return Array.from(dynamicOptions).sort((a, b) => a - b);
    };

    const rowsPerPageOptions = generateRowsPerPageOptions();

    return (
        <div className="flex items-center gap-3 text-sm" ref={dropdownRef}>
            <div className="flex items-center gap-2">
                <Rows3 className="w-4 h-4 text-slate-500" />
                <label className="text-slate-600 font-medium whitespace-nowrap">
                    Rows per page:
                </label>
            </div>
            <div className="relative">
                <button
                    onClick={() => setShowDropdown((s) => !s)}
                    className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold border-2 border-slate-200 bg-white rounded-lg hover:border-blue-400 hover:bg-blue-50/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <span className="text-slate-700 group-hover:text-blue-600 transition-colors min-w-[20px] text-center">
                        {rowsPerPage}
                    </span>
                    <ChevronDown 
                        className={`w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-all duration-300 ${
                            showDropdown ? "rotate-180" : "rotate-0"
                        }`}
                    />
                </button>

                {showDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="py-1 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
                            {rowsPerPageOptions.map((num, index) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setRowsPerPage(num);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-all duration-150 ${
                                        rowsPerPage === num
                                            ? "text-blue-600 font-bold bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-blue-600 border-l-4 border-transparent hover:border-blue-300"
                                    } ${index !== 0 ? "border-t border-slate-100" : ""}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`transition-transform duration-200 ${
                                            rowsPerPage === num ? "scale-110" : "group-hover:scale-105"
                                        }`}>
                                            {num}
                                        </span>
                                        {num === totalRows && (
                                            <span className="text-xs text-slate-500 font-normal">
                                                (All)
                                            </span>
                                        )}
                                    </span>
                                    {rowsPerPage === num && (
                                        <Check className="w-4 h-4 text-blue-600 animate-in zoom-in duration-200" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
