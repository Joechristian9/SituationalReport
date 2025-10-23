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
} from "recharts";
import dayjs from "dayjs";
import { Filter, Check, Wind, CloudRain, CloudOff } from "lucide-react";

// =================================================================================
// Reusable Sub-Components
// =================================================================================

/**
 * A reusable dropdown for filtering.
 */
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
                className="flex items-center justify-between w-full sm:w-52 p-2 bg-white border border-gray-300 rounded-lg shadow-sm text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 truncate">
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

/**
 * A beautifully styled custom tooltip for the chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload || {};
        const municipality = data.municipality || "Unknown Municipality"; // fallback in case it's missing

        return (
            <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                {/* Municipality */}
                <p className="font-bold text-gray-800">
                    {data.municipality || "Unknown Municipality"}
                </p>

                {/* Label (e.g., date or x-axis label) */}
                <p className="text-sm text-gray-500 mb-2">{label}</p>

                {/* Tooltip content for each data series */}
                {payload.map((p, index) => (
                    <div key={index} className="flex items-center">
                        <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: p.stroke }}
                        ></span>
                        <span className="text-sm text-gray-700">
                            {`${p.name}: ${p.value}`}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// =================================================================================
// Main WeatherGraph Component
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

    // This is the core logic for processing data.
    // It now handles the "All" case by averaging the data.
    const data = useMemo(() => {
        const reportsToProcess =
            selectedMunicipality === "All"
                ? weatherReports
                : weatherReports.filter(
                      (report) => report.municipality === selectedMunicipality
                  );

        if (selectedMunicipality === "All") {
            // Aggregate data for the "All" view
            const aggregator = reportsToProcess.reduce((acc, report) => {
                const timestamp = report.updated_at;
                if (!acc[timestamp]) {
                    acc[timestamp] = {
                        windSum: 0,
                        precipSum: 0,
                        count: 0,
                        date: timestamp,
                        municipalities: new Set(), // ✅ initialize a Set to collect names
                    };
                }

                acc[timestamp].windSum += parseFloat(report.wind) || 0;
                acc[timestamp].precipSum +=
                    parseFloat(report.precipitation) || 0;
                acc[timestamp].count += 1;
                acc[timestamp].municipalities.add(report.municipality); // ✅ collect municipality name
                return acc;
            }, {});

            return Object.values(aggregator)
                .map((data) => ({
                    name: dayjs(data.date).format("MMM D, HH:mm"),
                    wind: (data.windSum / data.count).toFixed(2),
                    precipitation: (data.precipSum / data.count).toFixed(2),
                    updated_at: data.date,
                    municipality:
                        Array.from(data.municipalities).join(", ") ||
                        "Average of All", // ✅ safe conversion
                }))
                .sort(
                    (a, b) => new Date(a.updated_at) - new Date(b.updated_at)
                );
        }

        // Process data for a single selected municipality
        return reportsToProcess
            .map((report) => ({
                name: dayjs(report.updated_at).format("MMM D, HH:mm"),
                precipitation: parseFloat(report.precipitation) || 0,
                wind: parseFloat(report.wind) || 0,
                updated_at: report.updated_at,
                municipality: report.municipality,
            }))
            .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    }, [weatherReports, selectedMunicipality]);

    const latest = data.length > 0 ? data[data.length - 1] : null;

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Weather Trend Overview
                </h2>
                <FilterDropdown
                    options={municipalities}
                    selectedOption={selectedMunicipality}
                    onSelect={setSelectedMunicipality}
                />
            </div>

            {!data || data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center text-gray-500">
                    <CloudOff size={48} className="mb-4 text-gray-400" />
                    <p className="font-semibold text-gray-700">
                        No Weather Data Available
                    </p>
                    <p className="text-sm">
                        There are no reports for the selected municipality.
                    </p>
                </div>
            ) : (
                <>
                    {latest && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-2">
                                Latest Update ({latest.municipality})
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                {dayjs(latest.updated_at).format(
                                    "MMMM D, YYYY — HH:mm:ss"
                                )}
                            </p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <Wind className="h-5 w-5 text-blue-500" />
                                    <span className="text-blue-600 font-semibold">
                                        {latest.wind} km/h
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CloudRain className="h-5 w-5 text-green-500" />
                                    <span className="text-green-600 font-semibold">
                                        {latest.precipitation} mm
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={data}
                            margin={{ top: 20, right: 40, left: 0, bottom: 20 }}
                        >
                            {/* Defining gradients for the lines */}
                            <defs>
                                <linearGradient
                                    id="colorWind"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="colorPrecip"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#22C55E"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#22C55E"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
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
                            <Tooltip content={CustomTooltip} />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="monotone"
                                dataKey="wind"
                                name="Wind Speed (km/h)"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="precipitation"
                                name="Precipitation (mm)"
                                stroke="#22C55E"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default WeatherGraph;
