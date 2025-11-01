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
import { Filter, Droplet, TrendingUp } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import ModernSelect from "@/Components/ui/ModernSelect";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{label}</p>
                <div className="mt-2 space-y-1">
                    {payload.map((p, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                        >
                            <div className="flex items-center">
                                <span
                                    className="w-2.5 h-2.5 rounded-full mr-2"
                                    style={{ backgroundColor: p.fill }}
                                ></span>
                                <span className="text-gray-600">{p.name}:</span>
                            </div>
                            <span className="font-semibold text-gray-700 ml-4">
                                {p.value}m
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const WaterLevelGraph = ({ waterLevels = [] }) => {
    const [selectedStation, setSelectedStation] = useState("All");
    const stationOptions = useMemo(
        () => [
            "All",
            ...new Set(waterLevels.map((item) => item.gauging_station)),
        ],
        [waterLevels]
    );

    const displayData = useMemo(() => {
        if (selectedStation === "All") {
            return [...waterLevels]
                .sort((a, b) => b.current_level - a.current_level)
                .slice(0, 10);
        }
        return waterLevels.filter(
            (item) => item.gauging_station === selectedStation
        );
    }, [waterLevels, selectedStation]);

    const stations = useMemo(() => stationOptions, [stationOptions]);

    const stationFilter = (
        <ModernSelect
            value={selectedStation}
            onChange={setSelectedStation}
            options={stations.map((s) => ({ value: s, label: s }))}
            className="w-44"
        />
    );

    return (
        <GraphCard
            title="Water Level"
            icon={<Droplet size={24} />}
            actions={stationFilter}
        >
            {selectedStation === "All" && (
                <p className="text-xs text-center text-gray-500 -mt-2 mb-2">
                    Showing Top 10 Highest Stations
                </p>
            )}
            {!displayData || displayData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Waves size={48} className="mb-4 text-gray-400" />
                    <p className="font-semibold">No Water Level Data</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={displayData}
                        margin={{ top: 5, right: 10, left: -15, bottom: 50 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="gauging_station"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            interval={0}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            label={{
                                value: "Level (m)",
                                angle: -90,
                                position: "insideLeft",
                            }}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(235, 248, 255, 0.5)" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "40px" }} />
                        <Bar
                            dataKey="current_level"
                            name="Current"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey="alarm_level"
                            name="Alarm"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey="critical_level"
                            name="Critical"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </GraphCard>
    );
};
export default WaterLevelGraph;
