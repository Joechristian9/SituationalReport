import React, { useMemo, useRef, useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Search, Filter, Check } from "lucide-react";

// =================================================================================
// Reusable Sub-Components (No changes needed here)
// =================================================================================
const FilterDropdown = ({ options, selectedOption, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedLabel = options.find(
        (opt) => opt.value === selectedOption
    )?.label;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        onSelect(value);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full sm:w-48 p-2 bg-white border border-gray-300 rounded-lg shadow-sm text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                        {selectedLabel}
                    </span>
                </div>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center justify-between"
                        >
                            {option.label}
                            {selectedOption === option.value && (
                                <Check className="h-4 w-4 text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value.toLocaleString()}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// =================================================================================
// MAIN COMPONENT (WITH CORRECTIONS)
// =================================================================================
const EvacuationGraph = ({
    preEmptiveReports = [],
    evacuationType,
    onEvacuationTypeChange,
    searchQuery, // ✅ USE this prop from Dashboard
    onSearchChange, // ✅ USE this prop to notify Dashboard
}) => {
    // ❌ REMOVED: No longer need local state for the search query
    // const [searchQuery, setSearchQuery] = useState("");

    const aggregatedData = useMemo(() => {
        if (!Array.isArray(preEmptiveReports) || preEmptiveReports.length === 0)
            return [];

        const aggregator = preEmptiveReports.reduce((acc, report) => {
            const {
                barangay,
                persons,
                families,
                outside_persons,
                outside_families,
                total_persons,
                total_families,
            } = report;
            if (!barangay) return acc;

            if (!acc[barangay]) {
                acc[barangay] = {
                    barangay,
                    inside_persons: 0,
                    inside_families: 0,
                    outside_persons: 0,
                    outside_families: 0,
                    total_persons: 0,
                    total_families: 0,
                };
            }

            acc[barangay].inside_persons += parseInt(persons, 10) || 0;
            acc[barangay].inside_families += parseInt(families, 10) || 0;
            acc[barangay].outside_persons += parseInt(outside_persons, 10) || 0;
            acc[barangay].outside_families +=
                parseInt(outside_families, 10) || 0;
            acc[barangay].total_persons += parseInt(total_persons, 10) || 0;
            acc[barangay].total_families += parseInt(total_families, 10) || 0;
            return acc;
        }, {});

        return Object.values(aggregator);
    }, [preEmptiveReports]);

    const filteredGraphData = useMemo(() => {
        // This logic remains the same, but now `searchQuery` is a prop
        if (!searchQuery) return aggregatedData;
        return aggregatedData.filter((item) =>
            item.barangay.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [aggregatedData, searchQuery]);

    // This useEffect is optional for your primary goal, but good practice
    // It's not part of the fix, so no changes needed
    useEffect(() => {
        // This callback was named onFilteredReportsChange in your code,
        // which could be confusing. It doesn't affect the summary card.
    }, [filteredGraphData]);

    // This logic remains the same
    let personsDataKey, familiesDataKey, personsBarName, familiesBarName;
    switch (evacuationType) {
        case "inside":
            personsDataKey = "inside_persons";
            familiesDataKey = "inside_families";
            personsBarName = "Persons (Inside)";
            familiesBarName = "Families (Inside)";
            break;
        case "outside":
            personsDataKey = "outside_persons";
            familiesDataKey = "outside_families";
            personsBarName = "Persons (Outside)";
            familiesBarName = "Families (Outside)";
            break;
        default:
            personsDataKey = "total_persons";
            familiesDataKey = "total_families";
            personsBarName = "Total Persons";
            familiesBarName = "Total Families";
            break;
    }

    const filterOptions = [
        { value: "total", label: "Total Evacuated" },
        { value: "inside", label: "Inside Centers" },
        { value: "outside", label: "Outside Centers" },
    ];

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Evacuation Overview
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <FilterDropdown
                        options={filterOptions}
                        selectedOption={evacuationType}
                        onSelect={onEvacuationTypeChange}
                    />

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            // ✅ CHANGED: Use the props for value and onChange
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search Barangay..."
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                {/* The BarChart itself needs no changes */}
                <BarChart data={filteredGraphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="barangay"
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        interval={0}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        allowDecimals={false}
                        label={{
                            value: "Count",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                        }}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(239, 246, 255, 0.6)" }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                        dataKey={personsDataKey}
                        name={personsBarName}
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                    <Bar
                        dataKey={familiesDataKey}
                        name={familiesBarName}
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>

            {aggregatedData.length > 0 && filteredGraphData.length === 0 && (
                <div className="text-center text-gray-500 mt-4">
                    No barangays match your search for "{searchQuery}".
                </div>
            )}
            {aggregatedData.length === 0 && (
                <div className="text-center text-gray-500 py-16">
                    No pre-emptive evacuation data available to display.
                </div>
            )}
        </div>
    );
};

export default EvacuationGraph;
