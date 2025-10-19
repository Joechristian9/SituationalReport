import React, { useState, useMemo } from "react";
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

// ✅ Custom Tooltip updated to show multiple data points (Persons and Families)
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{label}</p>
                {/* Map over the payload to display a line for each bar */}
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

const EvacuationGraph = ({ preEmptiveReports = [] }) => {
    // ✅ State is now ONLY for the evacuation type
    const [evacuationType, setEvacuationType] = useState("total"); // 'total', 'inside', or 'outside'

    // Data aggregation logic remains the same and is highly efficient
    const graphData = useMemo(() => {
        if (
            !Array.isArray(preEmptiveReports) ||
            preEmptiveReports.length === 0
        ) {
            return [];
        }

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
                    barangay: barangay,
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

    if (graphData.length === 0) {
        return (
            <div className="w-full bg-white rounded-2xl shadow p-4 text-center text-gray-500">
                No pre-emptive evacuation data available to display.
            </div>
        );
    }

    // ✅ Define data keys and names for BOTH bars based on the single filter
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
        default: // 'total'
            personsDataKey = "total_persons";
            familiesDataKey = "total_families";
            personsBarName = "Total Persons";
            familiesBarName = "Total Families";
            break;
    }

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Evacuation Overview by Barangay
                </h2>
                {/* ✅ Simplified Filter UI */}
                <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setEvacuationType("total")}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            evacuationType === "total"
                                ? "bg-indigo-500 text-white shadow"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Total
                    </button>
                    <button
                        onClick={() => setEvacuationType("inside")}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            evacuationType === "inside"
                                ? "bg-indigo-500 text-white shadow"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Inside Centers
                    </button>
                    <button
                        onClick={() => setEvacuationType("outside")}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            evacuationType === "outside"
                                ? "bg-indigo-500 text-white shadow"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Outside Centers
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={graphData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
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

                    {/* ✅ Two <Bar> components for the grouped chart */}
                    <Bar
                        dataKey={personsDataKey}
                        name={personsBarName}
                        fill="#3B82F6" // Blue for Persons
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                    <Bar
                        dataKey={familiesDataKey}
                        name={familiesBarName}
                        fill="#10B981" // Emerald for Families
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EvacuationGraph;
