import React, { useState, useMemo, lazy, Suspense } from "react";
import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import { Separator } from "@/Components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sun, CloudSun, Loader2 } from "lucide-react";

// Lazy load heavy components - only load when needed
const WeatherDashboard = lazy(() => import("@/Components/Weather/WeatherDashboard"));
const WeatherGraph = lazy(() => import("@/Components/Graphs/WeatherGraph"));
const WaterLevelGraph = lazy(() => import("@/Components/Graphs/WaterLevelGraph"));
const EvacuationGraph = lazy(() => import("@/Components/Graphs/EvacuationGraph"));
const CasualtyGraph = lazy(() => import("@/Components/Graphs/CasualtyGraph"));
const InjuredGraph = lazy(() => import("@/Components/Graphs/InjuredGraph"));
const MissingGraph = lazy(() => import("@/Components/Graphs/MissingGraph"));

// Loading fallback component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

// Memoized Tab component to prevent unnecessary re-renders
const Tab = React.memo(({ label, icon, isActive, onClick }) => (
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
));

export default function Dashboard({
    weatherReports = [],
    waterLevels = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
    missing = [],
}) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState("environment");
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");

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
                        <SidebarTrigger className="-ml-2" />
                        <Separator
                            orientation="vertical"
                            className="h-6 mx-2"
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
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
                    <div className="flex p-1.5 bg-gray-100 rounded-full">
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
                        <Tab
                            label="Weather Forecast"
                            icon={<CloudSun size={16} />}
                            isActive={activeTab === "weather"}
                            onClick={() => setActiveTab("weather")}
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
                            <Suspense fallback={<LoadingSpinner />}>
                                {activeTab === "weather" && (
                                    <div>
                                        <WeatherDashboard />
                                    </div>
                                )}

                                {activeTab === "environment" && (
                                    <div className="space-y-6">
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
                                        <WaterLevelGraph waterLevels={waterLevels} />
                                    </div>
                                )}

                                {activeTab === "impact" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <CasualtyGraph casualties={casualties} />
                                        <InjuredGraph injuredList={injured} />
                                        <MissingGraph missingList={missing} />
                                    </div>
                                )}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
