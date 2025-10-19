import React, { useMemo } from "react";
import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";

// Import all the graph components
import WeatherGraph from "@/Components/Graphs/WeatherGraph";
import EvacuationGraph from "@/Components/Graphs/EvacuationGraph";
import CasualtyGraph from "@/Components/Graphs/CasualtyGraph";
import InjuredGraph from "@/Components/Graphs/InjuredGraph";

// Import all necessary icons
import {
    Users,
    Home,
    Wind,
    CloudRain,
    UserX,
    UserPlus,
    HeartPulse,
    CloudSun,
    UserCheck,
} from "lucide-react";

// =================================================================================
// Reusable Sub-Components for the Dashboard UI
// =================================================================================

/**
 * A reusable card for displaying a single statistic.
 */
const StatCard = ({ icon, title, value, themeColor = "gray" }) => {
    const colorVariants = {
        blue: {
            border: "border-blue-500",
            bg: "bg-blue-100",
            text: "text-blue-600",
        },
        emerald: {
            border: "border-emerald-500",
            bg: "bg-emerald-100",
            text: "text-emerald-600",
        },
    };
    const theme = colorVariants[themeColor] || {
        border: "border-gray-500",
        bg: "bg-gray-100",
        text: "text-gray-600",
    };

    return (
        <div
            className={`bg-white shadow-md rounded-xl p-6 flex items-center gap-6 border-l-4 transition-transform transform hover:-translate-y-1 ${theme.border}`}
        >
            <div className={`p-4 rounded-full ${theme.bg}`}>
                <div className={theme.text}>{icon}</div>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

/**
 * A reusable card for displaying two related statistics.
 */
const CombinedStatCard = ({
    icon,
    title,
    metric1_icon,
    metric1_title,
    metric1_value,
    metric2_icon,
    metric2_title,
    metric2_value,
    themeColor = "gray",
}) => {
    const colorVariants = {
        red: {
            border: "border-red-500",
            bg: "bg-red-100",
            text: "text-red-600",
        },
        sky: {
            border: "border-sky-500",
            bg: "bg-sky-100",
            text: "text-sky-600",
        },
    };
    const theme = colorVariants[themeColor] || {
        border: "border-gray-500",
        bg: "bg-gray-100",
        text: "text-gray-600",
    };

    return (
        <div
            className={`bg-white shadow-md rounded-xl p-6 flex items-center gap-6 border-l-4 transition-transform transform hover:-translate-y-1 ${theme.border}`}
        >
            <div className={`p-4 rounded-full ${theme.bg}`}>
                <div className={theme.text}>{icon}</div>
            </div>
            <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">{title}</p>
                <div className="mt-2 space-y-2">
                    {/* Metric 1 */}
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            {metric1_icon}
                            <span>{metric1_title}</span>
                        </div>
                        <p className="font-semibold text-gray-700">
                            {metric1_value}
                        </p>
                    </div>
                    <hr />
                    {/* Metric 2 */}
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            {metric2_icon}
                            <span>{metric2_title}</span>
                        </div>
                        <p className="font-semibold text-gray-700">
                            {metric2_value}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
// Main Dashboard Component
// =================================================================================
export default function Dashboard({
    weatherReports = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
}) {
    // Memoized calculation for all summary statistics
    const summaryStats = useMemo(() => {
        const totalEvacuatedPersons = preEmptiveReports.reduce(
            (sum, report) => sum + (parseInt(report.total_persons, 10) || 0),
            0
        );
        const totalEvacuatedFamilies = preEmptiveReports.reduce(
            (sum, report) => sum + (parseInt(report.total_families, 10) || 0),
            0
        );
        const totalCasualties = casualties.length;
        const totalInjured = injured.length;
        const latestWeather =
            weatherReports.length > 0
                ? [...weatherReports].sort(
                      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
                  )[0]
                : { wind: "N/A", precipitation: "N/A" };

        return {
            persons: totalEvacuatedPersons.toLocaleString(),
            families: totalEvacuatedFamilies.toLocaleString(),
            casualties: totalCasualties.toLocaleString(),
            injured: totalInjured.toLocaleString(),
            wind:
                latestWeather.wind !== "N/A"
                    ? `${latestWeather.wind} km/h`
                    : "N/A",
            precipitation:
                latestWeather.precipitation !== "N/A"
                    ? `${latestWeather.precipitation} mm`
                    : "N/A",
        };
    }, [weatherReports, preEmptiveReports, casualties, injured]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-white sticky top-0 z-20">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">
                            Dashboard
                        </h1>
                        <p className="text-xs text-gray-500">
                            Welcome back, here is your situational overview.
                        </p>
                    </div>
                </header>

                <main className="w-full p-6 space-y-8 bg-gradient-to-br from-gray-50 to-slate-100">
                    {/* Summary Stats Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CombinedStatCard
                            icon={<CloudSun size={24} />}
                            title="Weather Conditions"
                            metric1_icon={
                                <Wind size={16} className="text-sky-500" />
                            }
                            metric1_title="Wind Speed"
                            metric1_value={summaryStats.wind}
                            metric2_icon={
                                <CloudRain
                                    size={16}
                                    className="text-indigo-500"
                                />
                            }
                            metric2_title="Precipitation"
                            metric2_value={summaryStats.precipitation}
                            themeColor="sky"
                        />
                        <CombinedStatCard
                            icon={<Users size={24} />}
                            title="Evacuation Summary"
                            metric1_icon={
                                <UserCheck
                                    size={16}
                                    className="text-blue-500"
                                />
                            }
                            metric1_title="Evacuated Persons"
                            metric1_value={summaryStats.persons}
                            metric2_icon={
                                <Home size={16} className="text-emerald-500" />
                            }
                            metric2_title="Evacuated Families"
                            metric2_value={summaryStats.families}
                            themeColor="blue"
                        />

                        <CombinedStatCard
                            icon={<HeartPulse size={24} />}
                            title="Human Impact"
                            metric1_icon={
                                <UserX size={16} className="text-red-500" />
                            }
                            metric1_title="Casualties"
                            metric1_value={summaryStats.casualties}
                            metric2_icon={
                                <UserPlus
                                    size={16}
                                    className="text-amber-500"
                                />
                            }
                            metric2_title="Injured"
                            metric2_value={summaryStats.injured}
                            themeColor="red"
                        />
                    </div>

                    {/* Graphs Section */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-700 mb-4">
                                Live Situational Overview
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                    <WeatherGraph
                                        weatherReports={weatherReports}
                                    />
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                    <EvacuationGraph
                                        preEmptiveReports={preEmptiveReports}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-700 mb-4">
                                Human Impact Analysis
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                    <CasualtyGraph casualties={casualties} />
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                    <InjuredGraph injuredList={injured} />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
