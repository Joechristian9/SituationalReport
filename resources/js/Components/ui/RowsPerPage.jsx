import React, { useRef, useState, useEffect } from "react";

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
        <div className="flex items-center gap-2 text-sm" ref={dropdownRef}>
            <label className="text-slate-600 font-medium whitespace-nowrap">Rows per page:</label>
            <div className="relative">
                <button
                    onClick={() => setShowDropdown((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-blue-200 bg-white rounded-md hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                    <span className="text-slate-700">{rowsPerPage}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 text-slate-500 transition-transform ${
                            showDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-blue-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        {rowsPerPageOptions.map((num) => (
                            <button
                                key={num}
                                onClick={() => {
                                    setRowsPerPage(num);
                                    setShowDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                    rowsPerPage === num
                                        ? "text-blue-600 font-semibold bg-blue-50"
                                        : "text-slate-700"
                                }`}
                            >
                                {num}
                                {rowsPerPage === num && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
