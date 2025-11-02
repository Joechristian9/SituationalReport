// resources/js/Components/ui/Pagination.jsx
import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-5 text-sm text-slate-700">
            <span className="text-slate-600">
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-300 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition"
                >
                    ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onPageChange(i + 1)}
                        className={`w-8 h-8 rounded-full border transition ${
                            currentPage === i + 1
                                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                : "border-slate-300 text-slate-700 hover:bg-blue-50"
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-slate-300 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition"
                >
                    Next ›
                </button>
            </div>
        </div>
    );
}
