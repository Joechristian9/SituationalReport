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
    ReferenceLine,
} from "recharts";
import { Filter, Droplet, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, ArrowUpDown } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import ModernSelect from "@/Components/ui/ModernSelect";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const currentLevel = payload.find(p => p.dataKey === 'current_level')?.value || 0;
        const alarmLevel = payload.find(p => p.dataKey === 'alarm_level')?.value || 0;
        const criticalLevel = payload.find(p => p.dataKey === 'critical_level')?.value || 0;
        
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
        
        // Calculate time ago (mock - you can make this dynamic)
        const timeAgo = '5 mins ago';
        
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
                <div className="mt-3 pt-2 border-t border-gray-200 flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    Updated: {timeAgo}
                </div>
            </div>
        );
    }
    return null;
};

const WaterLevelGraph = ({ waterLevels = [] }) => {
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
        const avgLevel = validCount > 0 ? (totalLevel / validCount).toFixed(2) : '0.00';
        const criticalPercent = total > 0 ? Math.round((critical / total) * 100) : 0;
        const warningPercent = total > 0 ? Math.round((warning / total) * 100) : 0;
        
        return { critical, warning, safe, total, highestStation, avgLevel, criticalPercent, warningPercent };
    }, [waterLevels]);

    const displayData = useMemo(() => {
        let data = selectedStation === "All" 
            ? [...waterLevels] 
            : waterLevels.filter(item => item.gauging_station === selectedStation);
        
        // Filter by status
        if (filterStatus !== "all") {
            data = data.filter(item => {
                if (filterStatus === "critical") return item.current_level >= item.critical_level;
                if (filterStatus === "warning") return item.current_level >= item.alarm_level && item.current_level < item.critical_level;
                if (filterStatus === "safe") return item.current_level < item.alarm_level;
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
        
        return selectedStation === "All" ? data.slice(0, 10) : data;
    }, [waterLevels, selectedStation, sortBy, filterStatus]);

    const stations = useMemo(() => stationOptions, [stationOptions]);

    const stationFilter = (
        <div className="flex items-center gap-2">
            <ModernSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'critical', label: '🔴 Critical' },
                    { value: 'warning', label: '🟡 Warning' },
                    { value: 'safe', label: '🟢 Safe' }
                ]}
                className="w-36"
            />
            <button
                onClick={() => setSortBy(sortBy === "highest" ? "lowest" : "highest")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sort by level"
            >
                <ArrowUpDown size={18} className="text-gray-600" />
            </button>
            <ModernSelect
                value={selectedStation}
                onChange={setSelectedStation}
                options={stations.map((s) => ({ value: s, label: s }))}
                className="w-44"
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
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => setFilterStatus('critical')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                        >
                            <span className="text-red-600 font-bold text-sm">{stats.critical}</span>
                            <span className="text-red-700 text-xs font-medium">Critical</span>
                            <span className="text-red-500 text-[10px]">({stats.criticalPercent}%)</span>
                        </div>
                        <div 
                            onClick={() => setFilterStatus('warning')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                        >
                            <span className="text-amber-600 font-bold text-sm">{stats.warning}</span>
                            <span className="text-amber-700 text-xs font-medium">Warning</span>
                            <span className="text-amber-500 text-[10px]">({stats.warningPercent}%)</span>
                        </div>
                        <div 
                            onClick={() => setFilterStatus('safe')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                        >
                            <span className="text-green-600 font-bold text-sm">{stats.safe}</span>
                            <span className="text-green-700 text-xs font-medium">Safe</span>
                        </div>
                        <div className="h-8 w-px bg-gray-300" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                            <span className="text-blue-600 font-bold text-sm">{stats.total}</span>
                            <span className="text-blue-700 text-xs font-medium">Total Stations</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase">Avg Level</div>
                            <div className="text-sm font-bold text-gray-700">{stats.avgLevel}m</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock size={14} />
                            <span>Updated 5 mins ago</span>
                        </div>
                    </div>
                </div>

                {/* Highest Station Alert */}
                {stats.highestStation && stats.highestStation.current_level >= stats.highestStation.alarm_level && (
                    <div className="mx-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-full">
                                    <TrendingUp size={18} className="text-orange-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-600">Highest Station:</span>
                                        <span className="text-sm font-bold text-gray-800">{stats.highestStation.gauging_station}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
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
                    <div className="mx-2 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-600" />
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
                    <Droplet size={48} className="mb-4 text-gray-400" />
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
