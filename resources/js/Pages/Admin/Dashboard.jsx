import React, { useMemo } from "react";
import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import WeatherGraph from "@/Components/Graphs/WeatherGraph";
import EvacuationGraph from "@/Components/Graphs/EvacuationGraph";
import CasualtyGraph from "@/Components/Graphs/CasualtyGraph";
import InjuredGraph from "@/Components/Graphs/InjuredGraph"; // 1. Import InjuredGraph
import { Users, Home, Wind, CloudRain, UserX, UserPlus } from "lucide-react"; // 2. Import UserPlus icon

const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    borderColor = "border-gray-400",
}) => (
    <div
        className={`
        bg-white shadow-md rounded-xl p-6 flex items-center gap-6 
        border-l-4 transition-transform transform hover:-translate-y-1
        ${borderColor} 
    `}
    >
        <div className="bg-gray-100 text-gray-600 p-4 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
    </div>
);

// 3. Accept `injured` prop
export default function Dashboard({
    weatherReports = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
}) {
    // 4. Update summary stats to include total injured
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
        const totalInjured = injured.length; // Calculate total injured

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
            injured: totalInjured.toLocaleString(), // Add injured to stats
            wind:
                latestWeather.wind !== "N/A"
                    ? `${latestWeather.wind} km/h`
                    : "N/A",
            precipitation:
                latestWeather.precipitation !== "N/A"
                    ? `${latestWeather.precipitation} mm`
                    : "N/A",
        };
    }, [weatherReports, preEmptiveReports, casualties, injured]); // Add injured to dependency array

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-white sticky top-0 z-20">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="text-xl font-semibold text-gray-800">
                        Dashboard
                    </h1>
                </header>

                <main className="w-full p-6 space-y-6 bg-gray-50/50">
                    {/* 5. Updated Summary Grid with "Total Injured" card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        <StatCard
                            icon={<Users size={24} />}
                            title="Evacuated Persons"
                            value={summaryStats.persons}
                            borderColor="border-blue-500"
                        />
                        <StatCard
                            icon={<Home size={24} />}
                            title="Evacuated Families"
                            value={summaryStats.families}
                            borderColor="border-emerald-500"
                        />
                        <StatCard
                            icon={<UserX size={24} />}
                            title="Total Casualties"
                            value={summaryStats.casualties}
                            borderColor="border-red-500"
                        />
                        <StatCard
                            icon={<UserPlus size={24} />}
                            title="Total Injured"
                            value={summaryStats.injured}
                            borderColor="border-amber-500"
                        />
                        <StatCard
                            icon={<Wind size={24} />}
                            title="Latest Wind Speed"
                            value={summaryStats.wind}
                            borderColor="border-sky-500"
                        />
                        <StatCard
                            icon={<CloudRain size={24} />}
                            title="Latest Precipitation"
                            value={summaryStats.precipitation}
                            borderColor="border-indigo-500"
                        />
                    </div>

                    {/* 6. Improved Graphs Layout */}
                    <div className="space-y-6">
                        {/* Top Row: Weather and Evacuation */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                <WeatherGraph weatherReports={weatherReports} />
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                <EvacuationGraph
                                    preEmptiveReports={preEmptiveReports}
                                />
                            </div>
                        </div>

                        {/* Bottom Row: Casualties and Injured */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                <CasualtyGraph casualties={casualties} />
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden border border-gray-100">
                                <InjuredGraph injuredList={injured} />
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
