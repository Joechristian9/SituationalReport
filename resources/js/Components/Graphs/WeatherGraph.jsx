import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { Filter, Wind, CloudRain, CloudOff, Sun } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload || {};
        return (
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{data.municipality}</p>
                <p className="text-sm text-gray-500 mb-2">{label}</p>
                {payload.map((p, index) => (
                    <div key={index} className="flex items-center text-sm">
                        <span
                            className="w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: p.stroke }}
                        ></span>
                        <span className="text-gray-700">{`${p.name}: ${p.value}`}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const WeatherGraph = ({ weatherReports = [] }) => {
    const [selectedMunicipality, setSelectedMunicipality] = useState("All");
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    const [chartKey, setChartKey] = useState(0);

    // Handle window resize for responsive behavior (debounced)
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Force chart update when weatherReports changes
    useEffect(() => {
        if (weatherReports && weatherReports.length > 0) {
            setChartKey(prev => prev + 1);
        }
    }, [weatherReports]);

    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    // Memoize municipalities list with proper deep comparison
    const municipalities = useMemo(() => {
        if (!weatherReports || weatherReports.length === 0) return ["All"];
        const uniqueMunicipalities = new Set(
            weatherReports
                .filter(r => r.municipality)
                .map((r) => r.municipality)
        );
        return ["All", ...Array.from(uniqueMunicipalities).sort()];
    }, [weatherReports.length, JSON.stringify(weatherReports.map(r => r.municipality))]);

    // Optimized data processing with proper memoization
    const data = useMemo(() => {
        if (!weatherReports || weatherReports.length === 0) return [];

        const reports =
            selectedMunicipality === "All"
                ? weatherReports
                : weatherReports.filter(
                      (r) => r.municipality === selectedMunicipality
                  );

        if (reports.length === 0) return [];

        const aggregator = reports.reduce((acc, report) => {
            if (!report.updated_at) return acc;

            const timestamp = report.updated_at;
            if (!acc[timestamp]) {
                acc[timestamp] = {
                    windSum: 0,
                    precipSum: 0,
                    count: 0,
                    date: timestamp,
                    municipalities: new Set(),
                };
            }
            acc[timestamp].windSum += parseFloat(report.wind) || 0;
            acc[timestamp].precipSum += parseFloat(report.precipitation) || 0;
            acc[timestamp].count += 1;
            if (report.municipality) {
                acc[timestamp].municipalities.add(report.municipality);
            }
            return acc;
        }, {});

        return Object.values(aggregator)
            .map((d) => ({
                name: dayjs(d.date).format("MMM D, HH:mm"),
                wind: parseFloat((d.windSum / d.count).toFixed(2)),
                precipitation: parseFloat((d.precipSum / d.count).toFixed(2)),
                updated_at: d.date,
                municipality:
                    Array.from(d.municipalities).join(", ") || "Average",
            }))
            .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    }, [
        weatherReports.length,
        selectedMunicipality,
        JSON.stringify(weatherReports.map(r => ({
            id: r.id,
            wind: r.wind,
            precipitation: r.precipitation,
            updated_at: r.updated_at
        })))
    ]);

    // Get the actual latest updated reports (not aggregated by timestamp)
    const latest = useMemo(() => {
        if (!weatherReports || weatherReports.length === 0) return null;
        
        // Filter by selected municipality if not "All"
        const filteredReports = selectedMunicipality === "All"
            ? weatherReports
            : weatherReports.filter(r => r.municipality === selectedMunicipality);
        
        if (filteredReports.length === 0) return null;
        
        // Find the most recent update timestamp
        const latestTimestamp = filteredReports.reduce((max, report) => {
            const reportTime = new Date(report.updated_at).getTime();
            return reportTime > max ? reportTime : max;
        }, 0);
        
        // Get all reports with that timestamp (the actual latest updates)
        const latestReports = filteredReports.filter(
            r => new Date(r.updated_at).getTime() === latestTimestamp
        );
        
        // Calculate averages only from the latest updated reports
        const windSum = latestReports.reduce((sum, r) => sum + (parseFloat(r.wind) || 0), 0);
        const precipSum = latestReports.reduce((sum, r) => sum + (parseFloat(r.precipitation) || 0), 0);
        const municipalities = [...new Set(latestReports.map(r => r.municipality).filter(Boolean))];
        
        return {
            wind: parseFloat((windSum / latestReports.length).toFixed(2)),
            precipitation: parseFloat((precipSum / latestReports.length).toFixed(2)),
            updated_at: new Date(latestTimestamp).toISOString(),
            municipality: municipalities.join(", "),
        };
    }, [
        weatherReports.length,
        selectedMunicipality,
        JSON.stringify(weatherReports.map(r => ({
            id: r.id,
            municipality: r.municipality,
            updated_at: r.updated_at
        })))
    ]);

    const filterControl = (
        <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                className="w-full sm:w-auto text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
                {municipalities.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <GraphCard
            title="Weather Trend"
            icon={<Sun size={24} />}
            actions={filterControl}
        >
            {!data || data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <CloudOff size={48} className="mb-4 text-gray-400" />
                    <p className="font-semibold">No Weather Data</p>
                </div>
            ) : (
                <>
                    {latest && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200 text-sm">
                            <h4 className="font-bold text-gray-800">
                                Latest ({latest.municipality})
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                                {dayjs(latest.updated_at).format(
                                    "MMMM D, YYYY — HH:mm"
                                )}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Wind className="h-4 w-4 text-blue-500" />
                                    <span className="text-blue-600 font-semibold">
                                        {latest.wind} km/h
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CloudRain className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600 font-semibold">
                                        {latest.precipitation} mm
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <ResponsiveContainer
                        width="100%"
                        height={isMobile ? 280 : isTablet ? 320 : 350}
                        key={chartKey}
                    >
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 10,
                                left: -15,
                                bottom: 50,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis
                                label={{
                                    value: "Value",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: "40px" }} />
                            <Line
                                type="monotone"
                                dataKey="wind"
                                name="Wind (km/h)"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="precipitation"
                                name="Precipitation (mm)"
                                stroke="#22C55E"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
        </GraphCard>
    );
};

export default WeatherGraph;
