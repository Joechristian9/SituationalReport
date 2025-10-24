import React, { useMemo } from "react";
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
import { Search, Filter, Users } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";

// The CustomTooltip component remains unchanged.
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p
                        key={`item-${index}`}
                        style={{ color: entry.fill }}
                        className="text-sm"
                    >
                        {`${entry.name}: ${entry.value.toLocaleString()}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const EvacuationGraph = ({
    preEmptiveReports = [],
    evacuationType,
    onEvacuationTypeChange,
    searchQuery,
    onSearchChange,
}) => {
    const aggregatedData = useMemo(() => {
        if (!Array.isArray(preEmptiveReports) || preEmptiveReports.length === 0)
            return [];
        return Object.values(
            preEmptiveReports.reduce((acc, report) => {
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
                acc[barangay].outside_persons +=
                    parseInt(outside_persons, 10) || 0;
                acc[barangay].outside_families +=
                    parseInt(outside_families, 10) || 0;
                acc[barangay].total_persons += parseInt(total_persons, 10) || 0;
                acc[barangay].total_families +=
                    parseInt(total_families, 10) || 0;
                return acc;
            }, {})
        );
    }, [preEmptiveReports]);

    const filteredGraphData = useMemo(() => {
        if (!searchQuery) return aggregatedData;
        return aggregatedData.filter((item) =>
            item.barangay.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [aggregatedData, searchQuery]);

    const { personsDataKey, familiesDataKey, personsBarName, familiesBarName } =
        useMemo(() => {
            switch (evacuationType) {
                case "inside":
                    return {
                        personsDataKey: "inside_persons",
                        familiesDataKey: "inside_families",
                        personsBarName: "Persons (Inside)",
                        familiesBarName: "Families (Inside)",
                    };
                case "outside":
                    return {
                        personsDataKey: "outside_persons",
                        familiesDataKey: "outside_families",
                        personsBarName: "Persons (Outside)",
                        familiesBarName: "Families (Outside)",
                    };
                default:
                    return {
                        personsDataKey: "total_persons",
                        familiesDataKey: "total_families",
                        personsBarName: "Total Persons",
                        familiesBarName: "Total Families",
                    };
            }
        }, [evacuationType]);

    const filterOptions = [
        { value: "total", label: "Total" },
        { value: "inside", label: "Inside" },
        { value: "outside", label: "Outside" },
    ];

    // ✅ ENHANCED: A single, responsive flex container for controls.
    const graphActions = (
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm overflow-hidden">
                <div className="pl-2 pr-1 text-gray-500">
                    <Filter size={16} />
                </div>
                <select
                    value={evacuationType}
                    onChange={(e) => onEvacuationTypeChange(e.target.value)}
                    className="text-sm border-0 focus:ring-0 focus:outline-none py-1"
                >
                    {filterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="relative flex-grow">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full p-2 pl-8 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
        </div>
    );

    return (
        <GraphCard
            title="Evacuation"
            icon={<Users size={24} />}
            actions={graphActions}
        >
            {filteredGraphData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Users size={48} className="mb-4 text-gray-400" />
                    <p className="font-semibold">
                        {aggregatedData.length > 0
                            ? `No results for "${searchQuery}"`
                            : "No Evacuation Data"}
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={filteredGraphData}
                        margin={{ top: 5, right: 10, left: -15, bottom: 50 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="barangay"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            interval={0}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            allowDecimals={false}
                            label={{
                                value: "Count",
                                angle: -90,
                                position: "insideLeft",
                            }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(239, 246, 255, 0.6)" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "40px" }} />
                        <Bar
                            dataKey={familiesDataKey}
                            name={familiesBarName}
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey={personsDataKey}
                            name={personsBarName}
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </GraphCard>
    );
};

export default EvacuationGraph;
