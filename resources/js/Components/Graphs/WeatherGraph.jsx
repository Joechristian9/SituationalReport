import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { Cloud, Wind, CloudRain, Waves, CloudOff, MapPin } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import ModernSelect from "@/Components/ui/ModernSelect";

const WeatherGraph = ({ weatherReports = [] }) => {
    const [selectedMunicipality, setSelectedMunicipality] = useState("All");

    // Get unique municipalities
    const municipalities = useMemo(() => {
        if (!weatherReports || weatherReports.length === 0) return ["All"];
        
        const uniqueMunicipalities = [...new Set(
            weatherReports
                .filter(r => r.municipality && r.municipality.trim())
                .map(r => r.municipality)
        )].sort();
        
        return ["All", ...uniqueMunicipalities];
    }, [weatherReports]);

    // Filter reports by municipality
    const filteredReports = useMemo(() => {
        if (!weatherReports || weatherReports.length === 0) return [];
        
        const reports = selectedMunicipality === "All"
            ? weatherReports
            : weatherReports.filter(r => r.municipality === selectedMunicipality);
        
        return reports.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [weatherReports, selectedMunicipality]);

    // Get latest report
    const latestReport = filteredReports[0];

    const filterControl = (
        <ModernSelect
            value={selectedMunicipality}
            onChange={setSelectedMunicipality}
            options={municipalities.map(m => ({ value: m, label: m }))}
            className="w-44"
        />
    );

    return (
        <GraphCard
            title="Weather Conditions"
            icon={<Cloud size={24} />}
            actions={filterControl}
        >
            {!filteredReports || filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <CloudOff size={48} className="mb-4 text-gray-400" />
                    <p className="font-semibold">No Weather Data</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Latest Weather Card */}
                    {latestReport && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-bold text-gray-900 text-lg">
                                        {latestReport.municipality}
                                    </h4>
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Latest
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                                {dayjs(latestReport.updated_at).format("MMMM D, YYYY — HH:mm")}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Cloud className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-semibold text-gray-600">Sky Condition</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {latestReport.sky_condition || "N/A"}
                                    </p>
                                </div>
                                
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wind className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-semibold text-gray-600">Wind</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {latestReport.wind || "N/A"}
                                    </p>
                                </div>
                                
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CloudRain className="h-4 w-4 text-green-500" />
                                        <span className="text-xs font-semibold text-gray-600">Precipitation</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {latestReport.precipitation || "N/A"}
                                    </p>
                                </div>
                                
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Waves className="h-4 w-4 text-cyan-500" />
                                        <span className="text-xs font-semibold text-gray-600">Sea Condition</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {latestReport.sea_condition || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weather History Timeline */}
                    {filteredReports.length > 1 && (
                        <div className="space-y-1.5">
                            <h5 className="text-sm font-semibold text-gray-700 px-1">Recent Updates</h5>
                            <div className="space-y-2 pr-2">
                                {filteredReports.slice(1, 4).map((report, index) => (
                                    <div 
                                        key={report.id || index}
                                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs font-medium text-gray-700">
                                                    {report.municipality}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {dayjs(report.updated_at).format("MMM D, HH:mm")}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-500">Sky:</span>
                                                <span className="ml-1 text-gray-700 font-medium">
                                                    {report.sky_condition || "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Wind:</span>
                                                <span className="ml-1 text-gray-700 font-medium">
                                                    {report.wind || "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Rain:</span>
                                                <span className="ml-1 text-gray-700 font-medium">
                                                    {report.precipitation || "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Sea:</span>
                                                <span className="ml-1 text-gray-700 font-medium">
                                                    {report.sea_condition || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </GraphCard>
    );
};

export default WeatherGraph;
