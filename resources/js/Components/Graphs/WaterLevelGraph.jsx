import React, { useState, useMemo, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from "recharts";
import { Filter, Droplet, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import GraphCard from "@/Components/ui/GraphCard";
import ModernSelect from "@/Components/ui/ModernSelect";

const timeAgo = (value) => {
    if (!value) return null;
    try {
        return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch {
        return null;
    }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Ensure numeric comparison by parsing values
        const currentLevel = parseFloat(payload.find(p => p.dataKey === 'current_level')?.value) || 0;
        const alarmLevel = parseFloat(payload.find(p => p.dataKey === 'alarm_level')?.value) || 0;
        const criticalLevel = parseFloat(payload.find(p => p.dataKey === 'critical_level')?.value) || 0;
        
        // Determine status
        let status = '🟢 SAFE';
        let statusColor = 'text-green-600';
        if (currentLevel >= criticalLevel) {
            status = '🔴 CRITICAL';
            statusColor = 'text-red-600';
        } else if (currentLevel >= alarmLevel) {
            status = '🟡 WARNING';
            statusColor = 'text-amber-600';
        }
        
        const updated = timeAgo(payload[0]?.payload?.updated_at);

        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border-2 border-gray-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                <div className={`font-bold text-sm mb-2 ${statusColor}`}>
                    {status}
                </div>
                <div className="space-y-1.5 text-sm">
                    {payload.map((p, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <span
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: p.fill }}
                                ></span>
                                <span className="text-gray-600">{p.name}:</span>
                            </div>
                            <span className="font-semibold text-gray-800 ml-4">
                                {p.value}m
                            </span>
                        </div>
                    ))}
                </div>
                {updated && (
                    <div className="mt-3 pt-2 border-t border-gray-200 flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        Updated {updated}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const WaterLevelGraph = React.memo(({ waterLevels = [] }) => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    
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
    
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;
    const [selectedStation, setSelectedStation] = useState("All");
    const [sortBy, setSortBy] = useState("highest"); // highest, lowest, alphabetical
    const [filterStatus, setFilterStatus] = useState("all"); // all, critical, warning, safe
    
    const stationOptions = useMemo(
        () => [
            "All",
            ...new Set(waterLevels.map((item) => item.gauging_station)),
        ],
        [waterLevels]
    );

    // Calculate statistics
    const stats = useMemo(() => {
        let critical = 0, warning = 0, safe = 0;
        let highestStation = null;
        let highestLevel = -Infinity;
        let totalLevel = 0;
        let validCount = 0;
        
        waterLevels.forEach(item => {
            // Safely parse current_level as a number
            const currentLevel = parseFloat(item.current_level) || 0;
            const alarmLevel = parseFloat(item.alarm_level) || 0;
            const criticalLevel = parseFloat(item.critical_level) || 0;
            
            if (currentLevel >= criticalLevel) critical++;
            else if (currentLevel >= alarmLevel) warning++;
            else safe++;
            
            // Track highest station
            if (currentLevel > highestLevel) {
                highestLevel = currentLevel;
                highestStation = { ...item, current_level: currentLevel };
            }
            
            // Only add valid numbers to total
            if (!isNaN(currentLevel) && currentLevel > 0) {
                totalLevel += currentLevel;
                validCount++;
            }
        });
        
        const total = waterLevels.length;
        const latestUpdate = waterLevels.reduce(
            (latest, item) => (item.updated_at && (!latest || new Date(item.updated_at) > new Date(latest)) ? item.updated_at : latest),
            null
        );
        const avgLevel = validCount > 0 ? (totalLevel / validCount).toFixed(2) : '0.00';
        const criticalPercent = total > 0 ? Math.round((critical / total) * 100) : 0;
        const warningPercent = total > 0 ? Math.round((warning / total) * 100) : 0;
        
        return { critical, warning, safe, total, highestStation, avgLevel, criticalPercent, warningPercent, latestUpdate };
    }, [waterLevels]);

    const displayData = useMemo(() => {
        let data = selectedStation === "All" 
            ? [...waterLevels] 
            : waterLevels.filter(item => item.gauging_station === selectedStation);
        
        // Filter by status
        if (filterStatus !== "all") {
            data = data.filter(item => {
                // Ensure numeric comparison
                const currentLevel = parseFloat(item.current_level) || 0;
                const alarmLevel = parseFloat(item.alarm_level) || 0;
                const criticalLevel = parseFloat(item.critical_level) || 0;
                
                if (filterStatus === "critical") return currentLevel >= criticalLevel;
                if (filterStatus === "warning") return currentLevel >= alarmLevel && currentLevel < criticalLevel;
                if (filterStatus === "safe") return currentLevel < alarmLevel;
                return true;
            });
        }
        
        // Sort data
        if (sortBy === "highest") {
            data.sort((a, b) => b.current_level - a.current_level);
        } else if (sortBy === "lowest") {
            data.sort((a, b) => a.current_level - b.current_level);
        } else if (sortBy === "alphabetical") {
            data.sort((a, b) => a.gauging_station.localeCompare(b.gauging_station));
        }
        
        // Add color based on status
        const coloredData = data.map(item => {
            // Ensure numeric comparison
            const currentLevel = parseFloat(item.current_level) || 0;
            const alarmLevel = parseFloat(item.alarm_level) || 0;
            const criticalLevel = parseFloat(item.critical_level) || 0;
            
            let fillColor = '#3b82f6'; // Blue (safe)
            if (currentLevel >= criticalLevel) {
                fillColor = '#ef4444'; // Red (critical)
            } else if (currentLevel >= alarmLevel) {
                fillColor = '#f59e0b'; // Amber (warning)
            }
            return { ...item, fillColor };
        });
        
        return selectedStation === "All" ? coloredData.slice(0, 10) : coloredData;
    }, [waterLevels, selectedStation, sortBy, filterStatus]);

    const stations = useMemo(() => stationOptions, [stationOptions]);

    const stationFilter = (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ModernSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'critical', label: '🔴 Critical' },
                    { value: 'warning', label: '🟡 Warning' },
                    { value: 'safe', label: '🟢 Safe' }
                ]}
                className="flex-1 min-w-[8rem] sm:flex-none sm:w-36"
            />
            <button
                type="button"
                onClick={() => setSortBy(sortBy === "highest" ? "lowest" : "highest")}
                className="shrink-0 p-2 rounded-lg border border-slate-300 bg-white hover:bg-gray-100 transition-colors"
                title={sortBy === "highest" ? "Showing highest first" : "Showing lowest first"}
                aria-label="Toggle sort order"
            >
                <ArrowUpDown size={18} className="text-gray-600" />
            </button>
            <ModernSelect
                value={selectedStation}
                onChange={setSelectedStation}
                options={stations.map((s) => ({ value: s, label: s }))}
                className="flex-1 min-w-[8rem] sm:flex-none sm:w-44"
            />
        </div>
    );

    return (
        <GraphCard
            title="Water Level"
            icon={<Droplet size={24} />}
            actions={stationFilter}
        >
            {/* Enhanced Status Dashboard */}
            <div className="mb-4 space-y-3">
                {/* Top Row: Status Badges and Quick Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid grid-cols-2 min-[480px]:flex min-[480px]:flex-wrap items-center gap-2 w-full min-[480px]:w-auto">
                        <button
                            type="button"
                            onClick={() => setFilterStatus('critical')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
                        >
                            <span className="text-red-600 font-bold text-sm">{stats.critical}</span>
                            <span className="text-red-700 text-xs font-medium">Critical</span>
                            <span className="text-red-500 text-[10px]">({stats.criticalPercent}%)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('warning')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                            <span className="text-amber-600 font-bold text-sm">{stats.warning}</span>
                            <span className="text-amber-700 text-xs font-medium">Warning</span>
                            <span className="text-amber-500 text-[10px]">({stats.warningPercent}%)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('safe')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap"
                        >
                            <span className="text-green-600 font-bold text-sm">{stats.safe}</span>
                            <span className="text-green-700 text-xs font-medium">Safe</span>
                        </button>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 whitespace-nowrap">
                            <span className="text-blue-600 font-bold text-sm">{stats.total}</span>
                            <span className="text-blue-700 text-xs font-medium">Stations</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 whitespace-nowrap">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Level</div>
                            <div className="text-sm font-bold text-gray-700">{stats.avgLevel}m</div>
                        </div>
                        {stats.latestUpdate && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500" title={new Date(stats.latestUpdate).toLocaleString()}>
                                <Clock size={14} />
                                <span>Updated {timeAgo(stats.latestUpdate)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Highest Station Alert */}
                {stats.highestStation && stats.highestStation.current_level >= stats.highestStation.alarm_level && (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-orange-100 rounded-full shrink-0">
                                    <TrendingUp size={18} className="text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2">
                                        <span className="text-xs font-medium text-gray-600">Highest Station:</span>
                                        <span className="text-sm font-bold text-gray-800">{stats.highestStation.gauging_station}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-600">Current Level:</span>
                                        <span className="text-sm font-bold text-orange-600">{stats.highestStation.current_level}m</span>
                                        {stats.highestStation.current_level >= stats.highestStation.critical_level ? (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">CRITICAL</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">WARNING</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStation(stats.highestStation.gauging_station)}
                                className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Critical Alert Banner */}
                {stats.critical > 0 && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                                <div>
                                    <span className="text-sm font-semibold text-red-800">ATTENTION NEEDED</span>
                                    <p className="text-xs text-red-700 mt-0.5">
                                        {stats.critical} station{stats.critical > 1 ? 's' : ''} above critical level • Immediate action required
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setFilterStatus('critical')}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                View Critical
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedStation === "All" && (
                <p className="text-xs text-center text-gray-500 -mt-2 mb-2">
                    Showing Top 10 {sortBy === "highest" ? "Highest" : sortBy === "lowest" ? "Lowest" : ""} Stations
                </p>
            )}
            {!displayData || displayData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Droplet size={48} className="mb-4 mt-8 text-gray-400" />
                    <p className="font-semibold">No Water Level Data</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 280 : isTablet ? 320 : 350}>
                    <BarChart
                        data={displayData}
                        margin={{ 
                            top: 20, 
                            right: isMobile ? 10 : 20, 
                            left: isMobile ? -15 : -10, 
                            bottom: isMobile ? 60 : 50 
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="gauging_station"
                            angle={isMobile ? -60 : -45}
                            textAnchor="end"
                            height={isMobile ? 80 : 70}
                            interval={0}
                            tick={{ fontSize: isMobile ? 9 : 11 }}
                        />
                        <YAxis
                            label={{
                                value: "Level (m)",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: isMobile ? 11 : 12 }
                            }}
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(235, 248, 255, 0.5)" }}
                        />
                        
                        {/* Reference lines for average alarm and critical levels */}
                        {displayData.length > 0 && (
                            <>
                                <ReferenceLine 
                                    y={displayData[0].alarm_level} 
                                    stroke="#f59e0b" 
                                    strokeDasharray="5 5" 
                                    strokeWidth={2}
                                    label={{ 
                                        value: 'Alarm Level', 
                                        position: 'insideTopRight',
                                        fill: '#f59e0b',
                                        fontSize: isMobile ? 10 : 11,
                                        fontWeight: 600
                                    }}
                                />
                                <ReferenceLine 
                                    y={displayData[0].critical_level} 
                                    stroke="#ef4444" 
                                    strokeDasharray="5 5" 
                                    strokeWidth={2}
                                    label={{ 
                                        value: 'Critical Level', 
                                        position: 'insideTopRight',
                                        fill: '#ef4444',
                                        fontSize: isMobile ? 10 : 11,
                                        fontWeight: 600
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Single bar with dynamic color */}
                        <Bar
                            dataKey="current_level"
                            name="Current Level"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={isMobile ? 25 : 35}
                        >
                            {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fillColor} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </GraphCard>
    );
});

WaterLevelGraph.displayName = 'WaterLevelGraph';

export default WaterLevelGraph;
