import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Dot,
} from "recharts";
import dayjs from "dayjs";
import { Filter, Check } from "lucide-react"; // Search icon removed from imports

// =================================================================================
// Main WeatherGraph component
// =================================================================================
const WeatherGraph = ({ weatherReports = [] }) => {
    const [selectedMunicipality, setSelectedMunicipality] = useState("All");

    const municipalities = useMemo(() => {
        if (!Array.isArray(weatherReports)) return [];
        return [
            "All",
            ...new Set(weatherReports.map((report) => report.municipality)),
        ];
    }, [weatherReports]);

    const filteredReports = useMemo(() => {
        if (selectedMunicipality === "All") {
            return weatherReports;
        }
        return weatherReports.filter(
            (report) => report.municipality === selectedMunicipality
        );
    }, [weatherReports, selectedMunicipality]);

    const data = useMemo(() => {
        return filteredReports
            .map((report) => ({
                name: dayjs(report.updated_at).format("MMM D, HH:mm"),
                precipitation: report.precipitation
                    ? parseFloat(report.precipitation)
                    : 0,
                wind: report.wind ? parseFloat(report.wind) : 0,
                updated_at: report.updated_at,
                municipality: report.municipality,
            }))
            .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    }, [filteredReports]);

    const latest = data.length > 0 ? data[data.length - 1] : null;

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Weather Trend Overview
                </h2>
                <div className="flex w-full md:w-auto">
                    <FilterDropdown
                        options={municipalities}
                        selectedOption={selectedMunicipality}
                        onSelect={setSelectedMunicipality}
                    />
                </div>
            </div>

            {!data || data.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                    No weather data available for the selected municipality.
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={data}
                            margin={{ top: 20, right: 40, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-25}
                                textAnchor="end"
                                height={60}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                label={{
                                    value: "Measurement",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    borderRadius: "10px",
                                }}
                                formatter={(value, name) =>
                                    name === "precipitation"
                                        ? [`${value} mm`, "Precipitation (mm)"]
                                        : [`${value} km/h`, "Wind Speed (km/h)"]
                                }
                                labelFormatter={(label, payload) => {
                                    if (payload && payload.length > 0) {
                                        const dataPoint = payload[0].payload;
                                        const date = dayjs(
                                            dataPoint.updated_at
                                        ).format("MMM D, YYYY HH:mm");
                                        if (selectedMunicipality === "All") {
                                            return `${dataPoint.municipality} - ${date}`;
                                        }
                                        return date;
                                    }
                                    return label;
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="monotone"
                                dataKey="wind"
                                name="Wind Speed (km/h)"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                // ✅ FIX: Add a unique key to each Dot component
                                dot={({ cx, cy, payload }) =>
                                    latest &&
                                    payload.updated_at === latest.updated_at ? (
                                        <Dot
                                            key={`latest-wind-${payload.updated_at}`}
                                            cx={cx}
                                            cy={cy}
                                            r={6}
                                            fill="#1D4ED8"
                                        />
                                    ) : (
                                        <Dot
                                            key={`wind-${payload.updated_at}`}
                                            cx={cx}
                                            cy={cy}
                                            r={4}
                                            fill="#60A5FA"
                                        />
                                    )
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="precipitation"
                                name="Precipitation (mm)"
                                stroke="#22C55E"
                                strokeWidth={2}
                                // ✅ FIX: Add a unique key to each Dot component
                                dot={({ cx, cy, payload }) =>
                                    latest &&
                                    payload.updated_at === latest.updated_at ? (
                                        <Dot
                                            key={`latest-precip-${payload.updated_at}`}
                                            cx={cx}
                                            cy={cy}
                                            r={6}
                                            fill="#15803D"
                                        />
                                    ) : (
                                        <Dot
                                            key={`precip-${payload.updated_at}`}
                                            cx={cx}
                                            cy={cy}
                                            r={4}
                                            fill="#4ADE80"
                                        />
                                    )
                                }
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    {latest && (
                        <div className="text-sm text-gray-700 mt-4">
                            <p>
                                <strong>
                                    Latest Update ({latest.municipality}):
                                </strong>{" "}
                                {dayjs(latest.updated_at).format(
                                    "MMM D, YYYY — HH:mm:ss"
                                )}
                            </p>
                            <p>
                                <span className="text-blue-600 font-semibold">
                                    Wind Speed: {latest.wind} km/h
                                </span>
                                {" | "}
                                <span className="text-green-600 font-semibold">
                                    Precipitation: {latest.precipitation} mm
                                </span>
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// You need to include the FilterDropdown component definition here
// since it was removed for brevity. I am adding it back for a complete file.
const FilterDropdown = ({ options, selectedOption, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
                        {selectedOption}
                    </span>
                </div>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center justify-between"
                        >
                            {option}
                            {selectedOption === option && (
                                <Check className="h-4 w-4 text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeatherGraph;
