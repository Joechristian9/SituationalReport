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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { UserX } from "lucide-react";

// Colors for the Sex (Male/Female) Pie Chart
const COLORS = ["#3B82F6", "#EC4899"]; // Blue for Male, Pink for Female

const CasualtyGraph = ({ casualties = [] }) => {
    // Memoize data processing for efficiency
    const { causeData, sexData } = useMemo(() => {
        if (!Array.isArray(casualties) || casualties.length === 0) {
            return { causeData: [], sexData: [] };
        }

        // 1. Aggregate data by Cause of Death
        const causeAggregator = casualties.reduce((acc, casualty) => {
            const cause = casualty.cause_of_death?.trim() || "Unknown";
            if (!acc[cause]) {
                acc[cause] = { cause: cause, count: 0 };
            }
            acc[cause].count += 1;
            return acc;
        }, {});

        // 2. Aggregate data by Sex
        const sexAggregator = casualties.reduce(
            (acc, casualty) => {
                const sex = casualty.sex || "Unknown";
                if (!acc[sex]) {
                    acc[sex] = { name: sex, value: 0 };
                }
                acc[sex].value += 1;
                return acc;
            },
            {
                Male: { name: "Male", value: 0 },
                Female: { name: "Female", value: 0 },
            }
        );

        // Sort causes by count for a cleaner chart
        const sortedCauseData = Object.values(causeAggregator).sort(
            (a, b) => b.count - a.count
        );

        return {
            causeData: sortedCauseData,
            sexData: Object.values(sexAggregator).filter((s) => s.value > 0), // Only show sexes with counts
        };
    }, [casualties]);

    // Handle the case where there's no data
    if (casualties.length === 0) {
        return (
            <div className="w-full bg-white rounded-2xl shadow p-4 text-center text-gray-500">
                No casualty data has been recorded.
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Casualty Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Cause of Death Bar Chart (taking up 2/3 of the space) */}
                <div className="lg:col-span-2 h-full">
                    <h3 className="font-semibold text-center text-gray-700 mb-2">
                        By Cause of Death
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            layout="vertical" // Horizontal bar chart
                            data={causeData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey="cause"
                                width={120} // Give space for long labels
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(239, 246, 255, 0.6)" }}
                            />
                            <Bar
                                dataKey="count"
                                name="Casualties"
                                fill="#EF4444"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Sex Breakdown Pie Chart (taking up 1/3 of the space) */}
                <div className="lg:col-span-1 h-full">
                    <h3 className="font-semibold text-center text-gray-700 mb-2">
                        By Sex
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={sexData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60} // This makes it a donut chart
                                outerRadius={100}
                                paddingAngle={5}
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {sexData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CasualtyGraph;
