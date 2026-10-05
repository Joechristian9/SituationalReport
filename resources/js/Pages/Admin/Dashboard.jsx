import React, { useEffect, useState, lazy, Suspense } from "react";
import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import useLiveRefresh from "@/hooks/useLiveRefresh";
import LiveIndicator from "@/Components/LiveIndicator";
import LiveImpactFeed from "@/Components/LiveImpactFeed";
import useNewImpactReports from "@/hooks/useNewImpactReports";
import { Toaster } from "sonner";
import { Separator } from "@/Components/ui/separator";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Users, Sun, CloudSun, Loader2, Radio } from "lucide-react";
import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import NoActiveTyphoonBadge from "@/Components/NoActiveDisasterBadge";
import ImpactFilters from "@/Components/Graphs/ImpactFilters";
import ImpactStatCards from "@/Components/Graphs/ImpactStatCards";
import DisasterContextBar from "@/Components/DisasterContextBar";

// Lazy load heavy components - only load when needed
const PagasaPanel = lazy(() => import("@/Components/Weather/PagasaPanel"));
const WeatherGraph = lazy(() => import("@/Components/Graphs/WeatherGraph"));
const WaterLevelGraph = lazy(() => import("@/Components/Graphs/WaterLevelGraph"));
const EvacuationGraph = lazy(() => import("@/Components/Graphs/EvacuationGraph"));
const CasualtyGraph = lazy(() => import("@/Components/Graphs/CasualtyGraph"));
const InjuredGraph = lazy(() => import("@/Components/Graphs/InjuredGraph"));
const MissingGraph = lazy(() => import("@/Components/Graphs/MissingGraph"));
const ImpactTrendChart = lazy(() => import("@/Components/Graphs/ImpactTrendChart"));
const BarangayImpactChart = lazy(() => import("@/Components/Graphs/BarangayImpactChart"));
const ImpactHourlyChart = lazy(() => import("@/Components/Graphs/ImpactHourlyChart"));

// Loading fallback component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

// Memoized Tab component to prevent unnecessary re-renders
const Tab = React.memo(({ label, icon, isActive, onClick, count = 0 }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={count > 0 ? `${label}, ${count} new` : label}
        aria-pressed={isActive}
        className={`flex min-h-[40px] items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isActive
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-200"
        }`}
    >
        {icon} <span className="hidden sm:inline">{label}</span>
        {count > 0 && (
            <span className="rounded-full bg-destructive px-1.5 text-xs font-bold tabular-nums text-destructive-foreground" aria-hidden="true">
                {count > 99 ? "99+" : count}
            </span>
        )}
    </button>
));

// App-style notification badge showing how many new reports came in
const NotificationBadge = ({ count }) => (
    <AnimatePresence>
        {count > 0 && (
            <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow-md ring-2 ring-white"
                title={`${count} new report${count === 1 ? "" : "s"}`}
            >
                {count > 99 ? "99+" : count}
                <span className="absolute inset-0 -z-10 rounded-full bg-red-500 motion-safe:animate-ping opacity-60" />
            </motion.span>
        )}
    </AnimatePresence>
);

export default function Dashboard({
    weatherReports = [],
    waterLevels = [],
    preEmptiveReports = [],
    casualties = [],
    injured = [],
    missing = [],
    impactSummary = null,
    recentImpact = [],
    newReportCounts = { casualties: 0, injured: 0, missing: 0 },
}) {
    const { auth, typhoon } = usePage().props;

    const live = useLiveRefresh({
        only: ["casualties", "injured", "missing", "impactSummary", "recentImpact", "newReportCounts"],
    });
    const freshReports = useNewImpactReports(recentImpact);
    // New reports stay tagged in the feed; the tab badge only counts ones not yet looked at.
    const [viewedReports, setViewedReports] = useState(() => new Set());
    const unseenReports = [...freshReports].filter((key) => !viewedReports.has(key)).length;

    const totalNewReports =
        newReportCounts.casualties + newReportCounts.injured + newReportCounts.missing;
    const [activeTab, setActiveTab] = useState("impact");
    useEffect(() => {
        if (activeTab === "live") setViewedReports(new Set(freshReports));
    }, [activeTab, freshReports]);
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Human Impact graph filters (one row scopes all three graphs)
    const [impactSex, setImpactSex] = useState("all");
    const [impactAge, setImpactAge] = useState("all");
    
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 },
    };

    return (
        <MotionConfig reducedMotion="user">
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard" />
            <SidebarInset>
                <Toaster position="top-right" richColors />
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="-ml-2 shrink-0" />
                        <Separator
                            orientation="vertical"
                            className="mx-1 h-6 shrink-0 sm:mx-2"
                        />
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-semibold text-blue-700 sm:text-xl">
                                Welcome, {auth.user.name}!
                            </h1>
                            <p className="hidden truncate text-xs text-gray-500 sm:block">
                                Glad to have you back! Here’s what’s happening
                                right now.
                            </p>
                        </div>
                    </div>
                    {/* Status on the right, together; the title truncates first on narrow screens. */}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <ActiveTyphoonHeader
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        <NoActiveTyphoonBadge
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        <LiveIndicator live={live} />
                    </div>
                </header>

                <main className="w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
                    <DisasterContextBar disaster={typhoon?.active} updatedAt={impactSummary?.generatedAt} />
                    <div className="flex p-1.5 bg-gray-100 rounded-full">
                        <Tab
                            label="Human Impact"
                            icon={<Users size={16} />}
                            isActive={activeTab === "impact"}
                            onClick={() => setActiveTab("impact")}
                        />
                        <Tab
                            label="Live Feed"
                            icon={<Radio size={16} />}
                            isActive={activeTab === "live"}
                            onClick={() => setActiveTab("live")}
                            count={unseenReports}
                        />
                        <Tab
                            label="Environment Graphs"
                            icon={<Sun size={16} />}
                            isActive={activeTab === "environment"}
                            onClick={() => setActiveTab("environment")}
                        />
                        <Tab
                            label="PAGASA"
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
                                        <PagasaPanel />
                                    </div>
                                )}

                                {activeTab === "live" && (
                                    <div className="space-y-6">
                                        <ImpactHourlyChart
                                            hourly={impactSummary?.hourly || []}
                                            byBarangay={impactSummary?.barangays24h}
                                        />
                                        <LiveImpactFeed
                                            items={recentImpact}
                                            totals={impactSummary?.totals}
                                            fresh={freshReports}
                                            paused={live.paused}
                                            disaster={typhoon?.active}
                                        />
                                    </div>
                                )}

                                {activeTab === "environment" && (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                                        {/* Weather + Evacuation side by side on wide screens; Water Level spans the full width */}
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
                                        <div className="xl:col-span-2 min-w-0">
                                            <WaterLevelGraph waterLevels={waterLevels} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "impact" && (
                                    <div className="space-y-6">
                                        {/* Stat cards: current totals from the database */}
                                        <ImpactStatCards
                                            summary={impactSummary}
                                            renderBadge={(key) => (
                                                <NotificationBadge count={key === "total" ? totalNewReports : newReportCounts[key]} />
                                            )}
                                        />

                                        {/* Trend over time + comparison by barangay */}
                                        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                                            <ImpactTrendChart trend={impactSummary?.trend || []} />
                                            <BarangayImpactChart rows={impactSummary?.byBarangay || []} />
                                        </div>

                                        {/* Detailed Graphs */}
                                        <ImpactFilters
                                            sex={impactSex}
                                            age={impactAge}
                                            onSexChange={setImpactSex}
                                            onAgeChange={setImpactAge}
                                        />
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                            <CasualtyGraph casualties={casualties} sex={impactSex} age={impactAge} />
                                            <InjuredGraph injuredList={injured} sex={impactSex} age={impactAge} />
                                            <MissingGraph missingList={missing} sex={impactSex} age={impactAge} />
                                        </div>
                                    </div>
                                )}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </SidebarInset>
        </SidebarProvider>
        </MotionConfig>
    );
}
