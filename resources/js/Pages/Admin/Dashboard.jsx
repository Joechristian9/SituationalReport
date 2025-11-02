import React, { useState, useMemo } from "react";
import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import { Separator } from "@/Components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

// Import the Weather Dashboard
import WeatherDashboard from "@/Components/Weather/WeatherDashboard";

// Import Graph Components
import WeatherGraph from "@/Components/Graphs/WeatherGraph";
import WaterLevelGraph from "@/Components/Graphs/WaterLevelGraph";
import EvacuationGraph from "@/Components/Graphs/EvacuationGraph";
import CasualtyGraph from "@/Components/Graphs/CasualtyGraph";
import InjuredGraph from "@/Components/Graphs/InjuredGraph";
import MissingGraph from "@/Components/Graphs/MissingGraph";

// --- 1. IMPORT THE NEW ICON FOR THE WEATHER TAB ---
import {
    Users,
    Home,
    UserX,
    UserPlus,
    UserCheck,
    UserSearch,
    Sun,
    CloudSun,
} from "lucide-react";

// (Your StatCard and EvacuationSummaryCard components remain here, unchanged)
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
    };
    const theme = themes[themeColor];
    return (
        <div
            className={`bg-white shadow-lg rounded-2xl p-6 border-l-4 ${theme.border} transition-transform duration-300 hover:scale-105`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                        {value}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{description}</p>
                </div>
                <div className={`p-3 rounded-xl ${theme.bg}`}>{icon}</div>
            </div>
        </div>
    );
};
const EvacuationSummaryCard = ({ reports = [], activeFilter = "total" }) => {
    const { persons, families, title } = useMemo(() => {
        let personCount = 0,
            familyCount = 0;
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
                (sum, r) => sum + (parseInt(r[personKey], 10) || 0),
                0
            );
            familyCount = reports.reduce(
                (sum, r) => sum + (parseInt(r[familyKey], 10) || 0),
                0
            );
        }
        const cardTitle =
            activeFilter === "inside"
                ? "Evacuated (Inside)"
                : activeFilter === "outside"
                ? "Evacuated (Outside)"
                : "Total Evacuated";
        return {
            persons: personCount.toLocaleString(),
            families: familyCount.toLocaleString(),
            title: cardTitle,
        };
    }, [reports, activeFilter]);

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center gap-6 border-l-4 border-blue-500 h-full">
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
                    <div className="border-t my-1"></div>
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
const Tab = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
            isActive
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200"
        }`}
    >
        {icon} <span className="hidden sm:inline">{label}</span>
    </button>
);

export default function Dashboard({
    weatherReports = [],
    waterLevels = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
    missing = [],
}) {
    const { auth } = usePage().props;
    // --- 2. SET THE DEFAULT ACTIVE TAB TO "weather" ---
    const [activeTab, setActiveTab] = useState("weather");
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredReports = useMemo(() => {
        if (!searchQuery) return preEmptiveReports;
        return preEmptiveReports.filter((r) =>
            r.barangay?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [preEmptiveReports, searchQuery]);

    const summaryStats = useMemo(
        () => ({
            casualties: casualties.length,
            injured: injured.length,
            missing: missing.length,
        }),
        [casualties, injured, missing]
    );

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 },
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="lg:hidden -ml-2" />
                        <Separator
                            orientation="vertical"
                            className="h-6 mx-2 hidden lg:block"
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                                Welcome, {auth.user.name}!
                            </h1>
                            <p className="text-xs text-gray-500">
                                Glad to have you back! Here’s what’s happening
                                right now.
                            </p>
                        </div>
                    </div>
                </header>

                <main className="w-full p-4 sm:p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-2">
                            <EvacuationSummaryCard
                                reports={filteredReports}
                                activeFilter={evacuationType}
                            />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatCard
                                icon={<UserX size={24} />}
                                title="Dead"
                                value={summaryStats.casualties}
                                description="Total fatalities."
                                themeColor="red"
                            />
                            <StatCard
                                icon={<UserPlus size={24} />}
                                title="Injured"
                                value={summaryStats.injured}
                                description="Needing medical care."
                                themeColor="amber"
                            />
                            <StatCard
                                icon={<UserSearch size={24} />}
                                title="Missing"
                                value={summaryStats.missing}
                                description="Currently unaccounted for."
                                themeColor="orange"
                            />
                        </div>
                    </div>
                    <div className="flex p-1.5 bg-gray-100 rounded-full">
                        {/* --- 3. ADD THE NEW TAB FOR THE WEATHER FORECAST --- */}
                        <Tab
                            label="Weather Forecast"
                            icon={<CloudSun size={16} />}
                            isActive={activeTab === "weather"}
                            onClick={() => setActiveTab("weather")}
                        />
                        <Tab
                            label="Environment Graphs"
                            icon={<Sun size={16} />}
                            isActive={activeTab === "environment"}
                            onClick={() => setActiveTab("environment")}
                        />
                        <Tab
                            label="Human Impact"
                            icon={<Users size={16} />}
                            isActive={activeTab === "impact"}
                            onClick={() => setActiveTab("impact")}
                        />
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={{ duration: 0.3 }}
                        >
                            {/* --- 4. CREATE A NEW CONTENT PANE FOR THE WEATHER TAB --- */}
                            {activeTab === "weather" && (
                                <div>
                                    <WeatherDashboard />
                                </div>
                            )}

                            {/* Environment Graphs - Optimized Layout */}
                            {activeTab === "environment" && (
                                <div className="space-y-6">
                                    {/* Top Row - Weather & Evacuation */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <WeatherGraph
                                            weatherReports={weatherReports}
                                        />
                                        <EvacuationGraph
                                            preEmptiveReports={preEmptiveReports}
                                            evacuationType={evacuationType}
                                            onEvacuationTypeChange={
                                                setEvacuationType
                                            }
                                            searchQuery={searchQuery}
                                            onSearchChange={setSearchQuery}
                                        />
                                    </div>
                                    {/* Bottom Row - Full Width Water Level */}
                                    <div className="grid grid-cols-1">
                                        <WaterLevelGraph
                                            waterLevels={waterLevels}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Human Impact - Balanced 3-Column Layout */}
                            {activeTab === "impact" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <CasualtyGraph casualties={casualties} />
                                    <InjuredGraph injuredList={injured} />
                                    <MissingGraph missingList={missing} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
