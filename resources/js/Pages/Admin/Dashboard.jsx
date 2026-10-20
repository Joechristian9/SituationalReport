import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import AppLayout from "@/Layouts/AppLayout";
import PageTitle from "@/Components/PageTitle";
import { router, usePage } from "@inertiajs/react";
import useLiveRefresh from "@/hooks/useLiveRefresh";
import LiveIndicator from "@/Components/LiveIndicator";
import LiveImpactFeed from "@/Components/LiveImpactFeed";
import useNewImpactReports from "@/hooks/useNewImpactReports";
import { Toaster } from "sonner";
import { m as motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Users, Sun, CloudSun, Radio } from "lucide-react";
import SectionNav from "@/Components/SectionNav";
import { SkeletonChart } from "@/Components/ui/skeleton";
import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import NoActiveTyphoonBadge from "@/Components/NoActiveDisasterBadge";
import ImpactStatCards from "@/Components/Graphs/ImpactStatCards";
import DisasterContextBar from "@/Components/DisasterContextBar";

// Lazy load heavy components - only load when needed
const PagasaPanel = lazy(() => import("@/Components/Weather/PagasaPanel"));
const WeatherGraph = lazy(() => import("@/Components/Graphs/WeatherGraph"));
const WaterLevelGraph = lazy(() => import("@/Components/Graphs/WaterLevelGraph"));
const EvacuationGraph = lazy(() => import("@/Components/Graphs/EvacuationGraph"));
const PersonBreakdownGraph = lazy(() => import("@/Components/Graphs/PersonBreakdownGraph"));
const AgeSexTable = lazy(() => import("@/Components/Graphs/AgeSexTable"));
const ImpactTrendChart = lazy(() => import("@/Components/Graphs/ImpactTrendChart"));
const BarangayImpactChart = lazy(() => import("@/Components/Graphs/BarangayImpactChart"));
const ImpactHourlyChart = lazy(() => import("@/Components/Graphs/ImpactHourlyChart"));
const DisasterHistory = lazy(() => import("@/Components/Graphs/DisasterHistory"));

const SECTIONS = [
    { key: "impact", label: "Human Impact", shortLabel: "Impact", icon: Users },
    { key: "live", label: "Live Feed", shortLabel: "Live", icon: Radio },
    { key: "environment", label: "Environment Graphs", shortLabel: "Weather", icon: Sun },
    { key: "pagasa", label: "PAGASA", icon: CloudSun },
];

// Polled on every tab: the stat cards, the live feed and its tab badge, the disaster itself.
const LIVE_PROPS = ["impactSummary", "recentImpact", "newReportCounts", "typhoon"];
// Polled only while their tab is open, and fetched again when it is reopened.
const TAB_PROPS = {
    impact: ["casualties", "injured", "missing"],
    environment: ["weatherReports", "waterLevels", "preEmptiveReports"],
};

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

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
            </motion.span>
        )}
    </AnimatePresence>
);

export default function Dashboard({
    // The environment data is sent only when its tab asks (undefined until then).
    weatherReports,
    waterLevels,
    preEmptiveReports,
    casualties = [],
    injured = [],
    missing = [],
    impactSummary = null,
    recentImpact = [],
    newReportCounts = { casualties: 0, injured: 0, missing: 0 },
    history = null,
}) {
    const { auth, typhoon } = usePage().props;
    const [activeTab, setActiveTab] = useState("impact");

    // Live only while a disaster is active or paused. `typhoon` is refreshed too, so polling
    // stops on its own when the disaster ends while this page is open. Each poll carries only
    // what the open tab shows, so the full casualty lists are not re-sent from other tabs.
    const live = useLiveRefresh({
        only: [...LIVE_PROPS, ...(TAB_PROPS[activeTab] ?? [])],
        enabled: Boolean(typhoon?.hasActive),
    });

    // A tab's own data is not polled while another tab is open: fetch it when the tab opens
    // (the first time for the environment graphs, otherwise to catch up).
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const props = TAB_PROPS[activeTab];
        const notLoaded = activeTab === "environment" && weatherReports === undefined;
        if (props && (notLoaded || typhoon?.hasActive)) router.reload({ only: props });
    }, [activeTab]);
    // The disaster ended while this page was open: fetch the history it now shows instead.
    useEffect(() => {
        if (!typhoon?.hasActive && !history) router.reload({ only: ["history"] });
    }, [typhoon?.hasActive, history]);
    const freshReports = useNewImpactReports(recentImpact);
    // New reports stay tagged in the feed; the tab badge only counts ones not yet looked at.
    const [viewedReports, setViewedReports] = useState(() => new Set());
    const unseenReports = [...freshReports].filter((key) => !viewedReports.has(key)).length;

    const totalNewReports =
        newReportCounts.casualties + newReportCounts.injured + newReportCounts.missing;
    useEffect(() => {
        if (activeTab === "live") setViewedReports(new Set(freshReports));
    }, [activeTab, freshReports]);
    const [evacuationType, setEvacuationType] = useState("total");
    const [searchQuery, setSearchQuery] = useState("");
    
    return (
        <MotionConfig reducedMotion="user">
        <AppLayout
            title="Dashboard"
            header={
                // Phones get a short title; the greeting was always cut to "Welcome, Ad…".
                <PageTitle subtitle="Glad to have you back! Here’s what’s happening right now.">
                    <span className="sm:hidden">Dashboard</span>
                    <span className="hidden sm:inline">Welcome, {auth.user.name}!</span>
                </PageTitle>
            }
            actions={
                <>
                    {/* Phones: the disaster name is in the context bar below, so the header keeps only the Live dot. */}
                    <div className="hidden min-w-0 items-center gap-3 sm:flex">
                        <ActiveTyphoonHeader
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        <NoActiveTyphoonBadge
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                    </div>
                    <LiveIndicator live={live} />
                </>
            }
        >
                <Toaster position="top-right" richColors />

                {/* Phones: bottom padding keeps the last card clear of the section bar. */}
                <main className="min-h-dvh w-full space-y-4 p-4 max-sm:pb-[calc(6rem+env(safe-area-inset-bottom))] sm:space-y-8 sm:p-6 lg:p-8">
                    <DisasterContextBar disaster={typhoon?.active} updatedAt={impactSummary?.generatedAt} />
                    {/* Fixed to the bottom on phones, below dialogs, sheets and the offline card. */}
                    <SectionNav
                        tabs={SECTIONS}
                        active={activeTab}
                        onChange={setActiveTab}
                        counts={{ live: unseenReports }}
                        liveStates={live.enabled ? { live: live.paused ? "paused" : "live" } : {}}
                    />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={{ duration: 0.3 }}
                        >
                            <Suspense fallback={<SkeletonChart />}>
                                {activeTab === "pagasa" && <PagasaPanel />}

                                {activeTab === "live" && (
                                    // The feed is what this tab is for, so it comes first; wide screens put the 24-hour chart beside it.
                                    <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                                        <LiveImpactFeed
                                            items={recentImpact}
                                            totals={impactSummary?.totals}
                                            fresh={freshReports}
                                            paused={live.paused}
                                            disaster={typhoon?.active}
                                            barangaysToday={impactSummary?.barangays24h?.ranking.filter((r) => !r.office).length}
                                        />
                                        {/* Stays in view while the feed scrolls (below the 4rem header); scrolls itself if taller than the screen.
                                            The wrapper also stops the card's h-full from stretching to the feed's height. */}
                                        <div className="min-w-0 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7.5rem)] xl:overflow-y-auto">
                                            <ImpactHourlyChart
                                                hourly={impactSummary?.hourly || []}
                                                byBarangay={impactSummary?.barangays24h}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "environment" && weatherReports === undefined && (
                                    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2" aria-busy="true">
                                        <SkeletonChart />
                                        <SkeletonChart />
                                    </div>
                                )}

                                {activeTab === "environment" && weatherReports !== undefined && (
                                    // Danger first: rivers, then evacuees, then weather. Wide screens: rivers and weather
                                    // side by side, evacuation full width below.
                                    <div className="grid grid-cols-1 items-start gap-4 md:gap-6 xl:grid-cols-2">
                                        <div className="min-w-0">
                                            <WaterLevelGraph waterLevels={waterLevels} />
                                        </div>
                                        <div className="min-w-0 xl:col-span-2 xl:row-start-2">
                                            <EvacuationGraph
                                                preEmptiveReports={preEmptiveReports}
                                                evacuationType={evacuationType}
                                                onEvacuationTypeChange={setEvacuationType}
                                                searchQuery={searchQuery}
                                                onSearchChange={setSearchQuery}
                                            />
                                        </div>
                                        <div className="min-w-0 xl:col-start-2 xl:row-start-1">
                                            <WeatherGraph weatherReports={weatherReports} />
                                        </div>
                                    </div>
                                )}

                                {/* Nothing active: the server sends past-disaster history instead of empty charts. */}
                                {activeTab === "impact" && history && <DisasterHistory history={history} />}

                                {activeTab === "impact" && !history && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Stat cards: current totals from the database */}
                                        <ImpactStatCards
                                            summary={impactSummary}
                                            renderBadge={(key) => (
                                                <NotificationBadge count={key === "total" ? totalNewReports : newReportCounts[key]} />
                                            )}
                                        />

                                        {/* Trend over time gets the width; the top-5 barangay list sits beside it. */}
                                        <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-3">
                                            <div className="min-w-0 xl:col-span-2">
                                                <ImpactTrendChart trend={impactSummary?.trend || []} />
                                            </div>
                                            <BarangayImpactChart rows={impactSummary?.byBarangay || []} />
                                        </div>

                                        {/* Who is affected: one type at a time, with its own Sex / Age filters. */}
                                        <PersonBreakdownGraph casualties={casualties} injured={injured} missing={missing} />
                                        <AgeSexTable casualties={casualties} injured={injured} missing={missing} />
                                    </div>
                                )}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>
        </AppLayout>
        </MotionConfig>
    );
}
