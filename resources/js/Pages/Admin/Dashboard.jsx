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
import { Users, Sun, CloudSun, Loader2, TrendingUp, AlertTriangle, Filter } from "lucide-react";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";
import NoActiveTyphoonBadge from "@/Components/NoActiveTyphoonBadge";

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
    const { auth, typhoon } = usePage().props;
    const [activeTab, setActiveTab] = useState("environment");
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Human Impact filters
    const [impactTimeFilter, setImpactTimeFilter] = useState("all");
    const [impactSexFilter, setImpactSexFilter] = useState("All");
    const [impactAgeFilter, setImpactAgeFilter] = useState("All");
    
    // Calculate summary statistics
    const impactStats = useMemo(() => {
        return {
            totalCasualties: casualties.length,
            totalInjured: injured.length,
            totalMissing: missing.length,
            total: casualties.length + injured.length + missing.length,
        };
    }, [casualties, injured, missing]);

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
                    <ActiveTyphoonHeader
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
                    <NoActiveTyphoonBadge
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
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
                                    <div className="space-y-6">
                                        {/* Summary Stats Cards */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-red-600 mb-1">Casualties</p>
                                                        <p className="text-2xl font-bold text-red-700">{impactStats.totalCasualties}</p>
                                                    </div>
                                                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                            
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-amber-600 mb-1">Injured</p>
                                                        <p className="text-2xl font-bold text-amber-700">{impactStats.totalInjured}</p>
                                                    </div>
                                                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                            
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-orange-600 mb-1">Missing</p>
                                                        <p className="text-2xl font-bold text-orange-700">{impactStats.totalMissing}</p>
                                                    </div>
                                                    <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-orange-600" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                            
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-600 mb-1">Total Impact</p>
                                                        <p className="text-2xl font-bold text-slate-700">{impactStats.total}</p>
                                                    </div>
                                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                                        <TrendingUp className="w-6 h-6 text-slate-600" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                        
                                        {/* Detailed Graphs */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <CasualtyGraph casualties={casualties} />
                                            <InjuredGraph injuredList={injured} />
                                            <MissingGraph missingList={missing} />
                                        </div>
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
