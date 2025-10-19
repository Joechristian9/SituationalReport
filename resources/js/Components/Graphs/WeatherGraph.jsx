import React, { useState, useMemo } from "react";
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

const WeatherGraph = ({ weatherReports = [] }) => {
    // State to hold the currently selected municipality
    const [selectedMunicipality, setSelectedMunicipality] = useState("All");

    // Memoize the list of unique municipalities
    const municipalities = useMemo(() => {
        if (!Array.isArray(weatherReports)) return [];
        return [
            "All",
            ...new Set(weatherReports.map((report) => report.municipality)),
        ];
    }, [weatherReports]);

    // Memoize the filtered data
    const filteredReports = useMemo(() => {
        if (selectedMunicipality === "All") {
            return weatherReports;
        }
        return weatherReports.filter(
            (report) => report.municipality === selectedMunicipality
        );
    }, [weatherReports, selectedMunicipality]);

    // Format and sort data using the filtered reports
    const data = useMemo(() => {
        return filteredReports
            .map((report) => ({
                // ✅ FIX: This now consistently formats the label without the municipality name
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

    if (!data || data.length === 0) {
        return (
            <div className="w-full bg-white rounded-2xl shadow p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-semibold">
                        Weather Trend Overview:{" "}
                        <span className="text-blue-600">
                            {selectedMunicipality}
                        </span>
                    </h2>
                    <div>
                        <label
                            htmlFor="municipality-select"
                            className="sr-only"
                        >
                            Filter by Municipality
                        </label>
                        <select
                            id="municipality-select"
                            value={selectedMunicipality}
                            onChange={(e) =>
                                setSelectedMunicipality(e.target.value)
                            }
                            className="p-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                        >
                            {municipalities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="text-center text-gray-500 py-16">
                    No weather data available for the selected municipality.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl shadow p-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-lg font-semibold">
                    Weather Trend Overview:{" "}
                    <span className="text-blue-600">
                        {selectedMunicipality}
                    </span>
                </h2>
                <div>
                    <label htmlFor="municipality-select" className="sr-only">
                        Filter by Municipality
                    </label>
                    <select
                        id="municipality-select"
                        value={selectedMunicipality}
                        onChange={(e) =>
                            setSelectedMunicipality(e.target.value)
                        }
                        className="p-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        {municipalities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

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
                                const date = dayjs(dataPoint.updated_at).format(
                                    "MMM D, YYYY HH:mm"
                                );
                                // Tooltip will still show the municipality when "All" is selected
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
                        dot={({ cx, cy, payload }) =>
                            latest &&
                            payload.updated_at === latest.updated_at ? (
                                <Dot cx={cx} cy={cy} r={6} fill="#1D4ED8" />
                            ) : (
                                <Dot cx={cx} cy={cy} r={4} fill="#60A5FA" />
                            )
                        }
                    />
                    <Line
                        type="monotone"
                        dataKey="precipitation"
                        name="Precipitation (mm)"
                        stroke="#22C55E"
                        strokeWidth={2}
                        dot={({ cx, cy, payload }) =>
                            latest &&
                            payload.updated_at === latest.updated_at ? (
                                <Dot cx={cx} cy={cy} r={6} fill="#15803D" />
                            ) : (
                                <Dot cx={cx} cy={cy} r={4} fill="#4ADE80" />
                            )
                        }
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* This summary section remains unchanged as requested */}
            {latest && (
                <div className="text-sm text-gray-700 mt-4">
                    <p>
                        <strong>Latest Update ({latest.municipality}):</strong>{" "}
                        {dayjs(latest.updated_at).format(
                            "MMM D, YYYY — HH:mm:ss"
                        )}
                    </p>
                    <p>
                        <span className="text-blue-600 font-semibold">
                            Wind Speed: {latest.wind} km/h
                        </span>{" "}
                        |{" "}
                        <span className="text-green-600 font-semibold">
                            Precipitation: {latest.precipitation} mm
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default WeatherGraph;
