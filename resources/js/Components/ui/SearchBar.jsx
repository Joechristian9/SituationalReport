// resources/js/Components/ui/SearchBar.jsx
import React from "react";

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
}) {
    return (
        <div className="relative w-full sm:w-1/2">
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-full shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition"
            />
        </div>
    );
}
