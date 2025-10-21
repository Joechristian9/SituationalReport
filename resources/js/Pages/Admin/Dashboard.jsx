import React, { useState, useMemo } from "react";
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
import InjuredGraph from "@/Components/Graphs/InjuredGraph";
import MissingGraph from "@/Components/Graphs/MissingGraph";

import {
    Users,
    Home,
    UserX,
    UserPlus,
    UserCheck,
    UserSearch,
} from "lucide-react";

// ============================================================
// Reusable Stat Card
// ============================================================
const StatCard = ({ icon, title, value, description, themeColor = "gray" }) => {
    const themes = {
        red: {
            bg: "bg-red-100",
            text: "text-red-600",
            border: "border-red-500",
        },
        amber: {
            bg: "bg-amber-100",
            text: "text-amber-600",
            border: "border-amber-500",
        },
        orange: {
            bg: "bg-orange-100",
            text: "text-orange-600",
            border: "border-orange-500",
        },
        gray: {
            bg: "bg-gray-100",
            text: "text-gray-600",
            border: "border-gray-500",
        },
    };
    const theme = themes[themeColor];
    return (
        <div
            className={`bg-white shadow-lg rounded-2xl p-6 border-l-4 ${theme.border}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                        {value}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{description}</p>
                </div>
                <div className={`p-4 rounded-xl ${theme.bg}`}>
                    <div className={theme.text}>{icon}</div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Evacuation Summary Card (unchanged logic)
// ============================================================
const EvacuationSummaryCard = ({ reports = [], activeFilter = "total" }) => {
    const { persons, families, title } = useMemo(() => {
        let personCount = 0;
        let familyCount = 0;
        let cardTitle = "Evacuation Summary";

        const personKey =
            activeFilter === "inside"
                ? "persons"
                : activeFilter === "outside"
                ? "outside_persons"
                : "total_persons";
        const familyKey =
            activeFilter === "inside"
                ? "families"
                : activeFilter === "outside"
                ? "outside_families"
                : "total_families";

        if (Array.isArray(reports)) {
            personCount = reports.reduce(
                (sum, report) => sum + (parseInt(report[personKey], 10) || 0),
                0
            );
            familyCount = reports.reduce(
                (sum, report) => sum + (parseInt(report[familyKey], 10) || 0),
                0
            );
        }

        if (activeFilter === "inside") cardTitle = "Evacuated (Inside Centers)";
        else if (activeFilter === "outside")
            cardTitle = "Evacuated (Outside Centers)";
        else cardTitle = "Total Evacuated";

        return {
            persons: personCount.toLocaleString(),
            families: familyCount.toLocaleString(),
            title: cardTitle,
        };
    }, [reports, activeFilter]);

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center gap-6 border-l-4 border-blue-500">
            <div className="p-4 rounded-xl bg-blue-100 text-blue-600">
                <Users size={28} />
            </div>
            <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">{title}</p>
                <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            <UserCheck size={16} className="text-blue-500" />
                            <span>Persons</span>
                        </div>
                        <p className="font-semibold text-gray-700">{persons}</p>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Home size={16} className="text-emerald-500" />
                            <span>Families</span>
                        </div>
                        <p className="font-semibold text-gray-700">
                            {families}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function Dashboard({
    weatherReports = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
    missing = [],
}) {
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");

    // ✅ Filter reports based on search (barangay)
    const filteredReports = useMemo(() => {
        if (!searchQuery) return preEmptiveReports;
        return preEmptiveReports.filter((report) =>
            report.barangay?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [preEmptiveReports, searchQuery]);

    const summaryStats = useMemo(
        () => ({
            casualties: casualties.length.toLocaleString(),
            injured: injured.length.toLocaleString(),
            missing: missing.length.toLocaleString(),
        }),
        [casualties, injured, missing]
    );

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard" />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 px-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2">
                            <EvacuationSummaryCard
                                reports={filteredReports} // ✅ shows only barangay search results
                                activeFilter={evacuationType}
                            />
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                icon={<UserX size={24} />}
                                title="Dead"
                                value={summaryStats.casualties}
                                description="Total recorded fatalities."
                                themeColor="red"
                            />
                            <StatCard
                                icon={<UserPlus size={24} />}
                                title="Injured"
                                value={summaryStats.injured}
                                description="Individuals needing medical care."
                                themeColor="amber"
                            />
                            <StatCard
                                icon={<UserSearch size={24} />}
                                title="Missing"
                                value={summaryStats.missing}
                                description="Persons currently unaccounted for."
                                themeColor="orange"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">
                            Live Situational Overview
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <WeatherGraph weatherReports={weatherReports} />
                            <EvacuationGraph
                                preEmptiveReports={preEmptiveReports}
                                evacuationType={evacuationType}
                                onEvacuationTypeChange={setEvacuationType}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery} // ✅ pass control down
                            />
                        </div>

                        <h2 className="text-xl font-bold text-gray-700 mb-4">
                            Human Impact Analysis
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CasualtyGraph casualties={casualties} />
                            <InjuredGraph injuredList={injured} />
                            <div className="lg:col-span-2">
                                <MissingGraph missingList={missing} />
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
