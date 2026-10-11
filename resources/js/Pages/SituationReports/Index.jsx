// resources/js/Pages/SituationReports/Index.jsx

import { useEffect, useState, lazy, Suspense } from "react";
import { usePage, Head, useForm, router } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";

import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import NoActiveTyphoonNotification from "@/Components/NoActiveDisasterNotification";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import FormPanel from "@/Components/forms/FormPanel";
import { Button } from "@/components/ui/button";
import {
    Cloud,
    Zap,
    Droplet,
    Phone,
    Route,
    Landmark,
    ClipboardList,
    MapPin,
    ArrowLeft,
    ChevronRight,
    Flame,
    Sprout,
    UserX,
    UserRound,
    UserSearch,
    CheckCircle2,
    Circle,
    Pause,
    CloudOff,
} from "lucide-react";
import { format } from "date-fns";
import { SkeletonForm } from "@/Components/ui/skeleton";
import { cn } from "@/lib/utils";

// Sections of the form list. Each has its own icon colour so a form is easy to find again.
const FORM_GROUPS = [
    { key: "overview", title: "Situation overview", tile: "bg-primary/10 text-primary" },
    { key: "response", title: "Evacuation & response", tile: "bg-chart-2/10 text-chart-2" },
    { key: "effects", title: "Effects", tile: "bg-warning/10 text-warning" },
    { key: "casualties", title: "Casualties", tile: "bg-destructive/10 text-destructive" },
];

const FORM_DESCRIPTIONS = {
    Weather: "Submit weather conditions and forecasts",
    Electricity: "Report electricity service status and outages",
    "Water Services": "Report water service status and disruptions",
    Communications: "Report communication network status",
    Roads: "Report road conditions and accessibility",
    Bridges: "Report bridge conditions and accessibility",
    "Pre-Emptive Reports": "Submit pre-emptive evacuation reports",
    "Pre-positioning": "Report deployment of response assets",
    "Incident Monitored": "Record details of incidents being monitored",
    Agriculture: "Report agricultural damage and crop losses",
    "Casualties - Dead": "Record the details for each deceased individual",
    "Casualties - Injured": "Record the details for each injured person",
    "Casualties - Missing": "Record the details for each missing individual",
};

// The page loads at most 100 records per form.
const RECORD_CAP = 100;

function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// Lazy load form components for better performance
const WeatherForm = lazy(() =>
    import("@/Components/SituationOverview/WeatherForm")
);
// const WaterLevelForm = lazy(() =>
//     import("@/Components/SituationOverview/WaterLevelForm")
// );
const ElectricityForm = lazy(() =>
    import("@/Components/SituationOverview/ElectricityForm")
);
const WaterForm = lazy(() =>
    import("@/Components/SituationOverview/WaterForm")
);
const CommunicationForm = lazy(() =>
    import("@/Components/SituationOverview/CommunicationForm")
);
const RoadForm = lazy(() => import("@/Components/SituationOverview/RoadForm"));
const BridgeForm = lazy(() =>
    import("@/Components/SituationOverview/BridgeForm")
);
const IncidentMonitoredForm = lazy(() =>
    import("@/Components/Effects/IncidentMonitoredForm")
);
const AgricultureForm = lazy(() =>
    import("@/Components/Agriculture/AgricultureForm")
);
const PreEmptiveForm = lazy(() =>
    import("@/Components/PreEmptiveEvacuation/PreEmptiveForm")
);
const CasualtyForm = lazy(() =>
    import("@/Components/Effects/CasualtyForm")
);
const InjuredForm = lazy(() =>
    import("@/Components/Effects/InjuredForm")
);
const MissingForm = lazy(() =>
    import("@/Components/Effects/MissingForm")
);

const FormLoader = () => <SkeletonForm className="py-2" />;

export default function Index() {
    const {
        flash,
        weatherReports,
        waterLevels,
        electricity,
        waterServices,
        communications,
        roads,
        bridges,
        preEmptiveReports,
        agriculture,
        casualties,
        injured,
        missing,
        typhoon,
        auth,
    } = usePage().props;
    
    // Check if forms should be disabled (no active disaster, ended, or paused)
    const formsDisabled =
        !typhoon?.hasActive ||
        typhoon?.active?.status === "ended" ||
        typhoon?.active?.status === "paused";

    // Poll for typhoon status changes - using localStorage to prevent spam
    useEffect(() => {
        // Get the last known state from localStorage
        const getLastKnownState = () => {
            try {
                const stored = localStorage.getItem("lastTyphoonState");
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        };

        // Save current state to localStorage
        const saveCurrentState = () => {
            const currentState = {
                status: typhoon?.active?.status,
                hasActive: typhoon?.hasActive,
                typhoonId: typhoon?.active?.id,
                timestamp: Date.now(),
            };
            localStorage.setItem(
                "lastTyphoonState",
                JSON.stringify(currentState)
            );
        };

        const checkTyphoonStatus = async () => {
            try {
                const response = await fetch("/api/disaster/active", {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const lastKnown = getLastKnownState();

                // If no last known state, save current and return
                if (!lastKnown) {
                    saveCurrentState();
                    return;
                }

                const newStatus = data.currentTyphoon?.status;
                const newHasActive = data.hasActiveTyphoon;
                const newTyphoonId = data.currentTyphoon?.id;

                // Check if anything actually changed
                const statusChanged = lastKnown.status !== newStatus;
                const hasActiveChanged = lastKnown.hasActive !== newHasActive;
                const typhoonIdChanged = lastKnown.typhoonId !== newTyphoonId;

                // Only reload if there's a real change
                if (statusChanged || hasActiveChanged || typhoonIdChanged) {
                    // Save the new state BEFORE reloading
                    localStorage.setItem(
                        "lastTyphoonState",
                        JSON.stringify({
                            status: newStatus,
                            hasActive: newHasActive,
                            typhoonId: newTyphoonId,
                            timestamp: Date.now(),
                        })
                    );

                    // Reload the page
                    router.reload({
                        preserveScroll: true,
                        onSuccess: () => {
                            if (
                                newStatus === "paused" &&
                                lastKnown.status === "active"
                            ) {
                                toast.error(
                                    "Typhoon report has been paused. Forms are now disabled."
                                );
                            } else if (
                                newStatus === "active" &&
                                lastKnown.status === "paused"
                            ) {
                                toast.success(
                                    "Typhoon report has been resumed. Forms are now enabled."
                                );
                            } else if (!newHasActive && lastKnown.hasActive) {
                                toast.error(
                                    "Typhoon report has been ended. Forms are now disabled."
                                );
                            } else if (newHasActive && !lastKnown.hasActive) {
                                toast.success("New typhoon report created!");
                            }
                        },
                    });
                }
            } catch (error) {
                // Silently fail
            }
        };

        // Save initial state
        saveCurrentState();

        // Wait 3 seconds before starting polling to ensure page is fully loaded
        const startDelay = setTimeout(() => {
            // Check every 5 seconds
            const interval = setInterval(checkTyphoonStatus, 5000);

            return () => clearInterval(interval);
        }, 3000);

        return () => clearTimeout(startDelay);
    }, []); // Empty deps - only run once

    // Get user permissions
    const userPermissions = auth?.user?.permissions?.map((p) => p.name) || [];
    const isAdmin = auth?.user?.roles?.some((r) => r.name === "admin");

    // Helper function to check if user has permission
    const hasPermission = (permission) => {
        return isAdmin || userPermissions.includes(permission);
    };

    // Define all possible steps with their permissions. `records` is what this page
    // loaded for the form (undefined when it loads none), used for the saved count.
    const allSteps = [
        { label: "Weather", icon: <Cloud size={18} />, permission: "access-weather-form", group: "overview", records: weatherReports },
        { label: "Electricity", icon: <Zap size={18} />, permission: "access-electricity-form", group: "overview", records: electricity },
        { label: "Water Services", icon: <Droplet size={18} />, permission: "access-water-service-form", group: "overview", records: waterServices },
        { label: "Communications", icon: <Phone size={18} />, permission: "access-communication-form", group: "overview", records: communications },
        { label: "Roads", icon: <Route size={18} />, permission: "access-road-form", group: "overview", records: roads },
        { label: "Bridges", icon: <Landmark size={18} />, permission: "access-bridge-form", group: "overview", records: bridges },
        { label: "Pre-Emptive Reports", icon: <ClipboardList size={18} />, permission: "access-pre-emptive-form", group: "response", records: preEmptiveReports },
        // Has its own page with the saved records; this page does not load them.
        { label: "Pre-positioning", icon: <MapPin size={18} />, permission: "access-pre-positioning-form", group: "response", href: "pre-positioning.index" },
        { label: "Incident Monitored", icon: <Flame size={18} />, permission: "access-incident-form", group: "effects" },
        { label: "Agriculture", icon: <Sprout size={18} />, permission: "access-agriculture-form", group: "effects", records: agriculture },
        { label: "Casualties - Dead", icon: <UserX size={18} />, permission: "access-casualty-form", group: "casualties", records: casualties },
        { label: "Casualties - Injured", icon: <UserRound size={18} />, permission: "access-injured-form", group: "casualties", records: injured },
        { label: "Casualties - Missing", icon: <UserSearch size={18} />, permission: "access-missing-form", group: "casualties", records: missing },
    ];

    // Filter steps based on user permissions
    const steps = allSteps.filter((step) => hasPermission(step.permission));

    // Without an active disaster the records are not scoped to one, so counts would mislead.
    const disaster = typhoon?.hasActive ? typhoon?.active : null;
    const tracked = disaster ? steps.filter((step) => step.records !== undefined) : [];
    const withEntries = tracked.filter((step) => step.records?.length > 0).length;

    // No stepper - show all forms directly
    // Auto-select the form if user only has access to one form
    const [activeForm, setActiveForm] = useState(
        steps.length === 1 ? steps[0].label : null
    );

    const { data, setData, errors } = useForm({
        reports:
            weatherReports && weatherReports.length > 0
                ? weatherReports
                : [
                      {
                          id: "new-0",
                          municipality: "City of Ilagan",
                          sky_condition: "",
                          wind: "",
                          precipitation: "",
                          sea_condition: "",
                      },
                  ],
        preEmptiveReports:
            preEmptiveReports && preEmptiveReports.length > 0
                ? preEmptiveReports
                : [
                      {
                          id: "new-0",
                          barangay: "",
                          evacuation_center: "",
                          families: "",
                          persons: "",
                          outside_center: "",
                          outside_families: "",
                          outside_persons: "",
                          total_families: 0,
                          total_persons: 0,
                      },
                  ],
        incidents: [
            {
                id: "new-0",
                kinds_of_incident: "",
                date_time: "",
                location: "",
                description: "",
                remarks: "",
            },
        ],
        agriculture:
            agriculture && agriculture.length > 0
                ? agriculture
                : [
                      {
                          id: "new-0",
                          crops_affected: "",
                          standing_crop_ha: "",
                          stage_of_crop: "",
                          total_area_affected_ha: "",
                          total_production_loss: "",
                          remarks: "",
                      },
                  ],
        casualties:
            casualties && casualties.length > 0
                ? casualties
                : [
                      {
                          id: "new-0",
                          name: "",
                          age: "",
                          sex: "",
                          address: "",
                          cause_of_death: "",
                          date_died: "",
                          place_of_incident: "",
                      },
                  ],
        injured:
            injured && injured.length > 0
                ? injured
                : [
                      {
                          id: "new-0",
                          name: "",
                          age: "",
                          sex: "",
                          address: "",
                          cause: "",
                          remarks: "",
                      },
                  ],
        missing:
            missing && missing.length > 0
                ? missing
                : [
                      {
                          id: "new-0",
                          name: "",
                          age: "",
                          sex: "",
                          address: "",
                          cause: "",
                          remarks: "",
                      },
                  ],
        waterLevels:
            waterLevels && waterLevels.length > 0
                ? waterLevels
                : [
                      {
                          id: "new-0",
                          gauging_station: "",
                          current_level: "",
                          alarm_level: "",
                          critical_level: "",
                          affected_areas: "",
                      },
                  ],
        electricityServices:
            electricity && electricity.length > 0
                ? electricity
                : [
                      {
                          id: "new-0",
                          status: "",
                          barangays_affected: "",
                          remarks: "",
                      },
                  ],
        waterServices:
            waterServices && waterServices.length > 0
                ? waterServices
                : [
                      {
                          id: "new-0",
                          source_of_water: "",
                          barangays_served: "",
                          status: "",
                          remarks: "",
                      },
                  ],
        communications:
            communications && communications.length > 0
                ? communications
                : [
                      {
                          id: "new-0",
                          globe: "",
                          smart: "",
                          pldt_landline: "",
                          pldt_internet: "",
                          vhf: "",
                          remarks: "",
                      },
                  ],
        // Starter rows use a "new-" id: rows are edited by id, and saving sends it as null.
        roads:
            roads && roads.length > 0
                ? roads
                : [
                      {
                          id: "new-0",
                          road_classification: "",
                          name_of_road: "",
                          status: "",
                          areas_affected: "",
                          re_routing: "",
                          remarks: "",
                      },
                  ],
        bridges:
            bridges && bridges.length > 0
                ? bridges
                : [
                      {
                          id: "new-0",
                          road_classification: "",
                          name_of_bridge: "",
                          status: "",
                          areas_affected: "",
                          re_routing: "",
                          remarks: "",
                      },
                  ],
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Helper function to check if a step’s form data is empty
    const isStepEmpty = (stepNumber) => {
        switch (stepNumber) {
            case 1:
                return !data.reports.some(
                    (r) =>
                        r.municipality ||
                        r.sky_condition ||
                        r.wind ||
                        r.precipitation ||
                        r.sea_condition
                );
            case 2:
                return !data.waterLevels.some(
                    (r) =>
                        r.gauging_station ||
                        r.current_level ||
                        r.alarm_level ||
                        r.critical_level ||
                        r.affected_areas
                );
            case 3:
                return !data.electricityServices.some(
                    (r) => r.status || r.barangays_affected || r.remarks
                );
            case 4:
                return !data.waterServices.some(
                    (r) =>
                        r.source_of_water ||
                        r.barangays_served ||
                        r.status ||
                        r.remarks
                );
            case 5:
                return !data.communications.some(
                    (r) =>
                        r.globe ||
                        r.smart ||
                        r.pldt_landline ||
                        r.pldt_internet ||
                        r.vhf ||
                        r.remarks
                );
            case 6:
                return !data.roads.some(
                    (r) =>
                        r.road_classification ||
                        r.name_of_road ||
                        r.status ||
                        r.areas_affected ||
                        r.re_routing ||
                        r.remarks
                );
            case 7:
                return !data.bridges.some(
                    (r) =>
                        r.road_classification ||
                        r.name_of_bridge ||
                        r.status ||
                        r.areas_affected ||
                        r.re_routing ||
                        r.remarks
                );
            default:
                return true;
        }
    };

    // Render form based on step number
    const renderForm = (formLabel) => {
        switch (formLabel) {
            case "Weather":
                return (
                    <WeatherForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            // case "Water Level":
            //     return (
            //         <WaterLevelForm
            //             data={data}
            //             setData={setData}
            //             errors={errors}
            //             disabled={formsDisabled}
            //         />
            //     );
            case "Electricity":
                return (
                    <ElectricityForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Water Services":
                return (
                    <WaterForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Communications":
                return (
                    <CommunicationForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Roads":
                return (
                    <RoadForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Bridges":
                return (
                    <BridgeForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Pre-Emptive Reports":
                return (
                    <PreEmptiveForm
                        data={{ reports: data.preEmptiveReports }}
                        setData={(key, value) => setData('preEmptiveReports', value)}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Incident Monitored":
                return (
                    <IncidentMonitoredForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Agriculture":
                return (
                    <AgricultureForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Casualties - Dead":
                return (
                    <CasualtyForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Casualties - Injured":
                return (
                    <InjuredForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            case "Casualties - Missing":
                return (
                    <MissingForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        disabled={formsDisabled}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Situational Report</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        {/* Phones: the page title already says where you are; leave the room to the disaster name. */}
                        <Separator
                            orientation="vertical"
                            className="mx-2 hidden h-6 sm:block"
                        />
                        <div className="hidden min-w-0 sm:block">
                        {(() => {
                            const user = usePage().props.auth.user;
                            const isAdmin = user.roles?.some(
                                (r) => r.name?.toLowerCase() === "admin"
                            );

                            // Build breadcrumbs based on whether a form is selected
                            const crumbs = isAdmin
                                ? activeForm
                                    ? [
                                          {
                                              href: route("admin.dashboard"),
                                              label: "Dashboard",
                                          },
                                          {
                                              href: route(
                                                  "situation-reports.index"
                                              ),
                                              label: "Situational Report",
                                          },
                                          { label: activeForm },
                                      ]
                                    : [
                                          {
                                              href: route("admin.dashboard"),
                                              label: "Dashboard",
                                          },
                                          { label: "Situational Report" },
                                      ]
                                : activeForm
                                  ? [
                                        {
                                            href: route(
                                                "situation-reports.index"
                                            ),
                                            label: "Situational Report",
                                        },
                                        { label: activeForm },
                                    ]
                                  : [{ label: "Situational Report" }];

                            return <Breadcrumbs crumbs={crumbs} />;
                        })()}
                        </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                        <NoActiveTyphoonNotification
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        {typhoon?.hasActive &&
                            typhoon?.active?.status === "active" && (
                                <ActiveTyphoonHeader
                                    typhoon={typhoon?.active}
                                    hasActive={typhoon?.hasActive}
                                />
                            )}
                    </div>
                </header>

                <main className="h-full w-full bg-background p-4 sm:p-6">
                    {/* Form selection */}
                    {!activeForm && (
                        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                            {/* Who is reporting, for which disaster, and how far along */}
                            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="p-4 sm:p-6">
                                    <p className="text-sm font-medium text-muted-foreground">{greeting()},</p>
                                    <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-3xl">
                                        {auth.user.name}
                                    </h1>
                                    <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                                        Choose a form. What you save goes into the consolidated situational report.
                                    </p>
                                </div>

                                <div className="border-t border-border bg-muted/40 p-4 sm:px-6">
                                    {disaster ? (
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
                                                    <Cloud className="h-5 w-5" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reporting for</p>
                                                    <p className="font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{disaster.name}</p>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                        {disaster.status === "paused" ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-medium text-warning">
                                                                <Pause className="h-3 w-3" aria-hidden="true" />
                                                                Paused, view only
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-medium text-success">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                                                                Active
                                                            </span>
                                                        )}
                                                        {disaster.started_at && (
                                                            <span className="tabular-nums">
                                                                Since {format(new Date(disaster.started_at), "MMM d, h:mm a")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {tracked.length > 0 && (
                                                <div className="w-full sm:w-56">
                                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                                        <span className="text-muted-foreground">Forms with entries</span>
                                                        <span className="font-semibold tabular-nums text-foreground">
                                                            {withEntries} of {tracked.length}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                                                        role="progressbar"
                                                        aria-label="Forms with entries"
                                                        aria-valuemin={0}
                                                        aria-valuemax={tracked.length}
                                                        aria-valuenow={withEntries}
                                                    >
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                                                            style={{ width: `${(withEntries / tracked.length) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
                                                <CloudOff className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="font-semibold text-foreground">No active disaster</p>
                                                <p className="text-sm text-muted-foreground">Forms open for saving once CDRRMO starts a disaster report.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {FORM_GROUPS.map((group) => {
                                const groupSteps = steps.filter((step) => step.group === group.key);
                                if (groupSteps.length === 0) return null;

                                return (
                                    <section key={group.key} aria-labelledby={`forms-${group.key}`}>
                                        <h2
                                            id={`forms-${group.key}`}
                                            className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                        >
                                            {group.title}
                                            <span className="rounded-full bg-muted px-2 py-0.5 tabular-nums">{groupSteps.length}</span>
                                        </h2>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {groupSteps.map((formStep) => {
                                                const count = formStep.records?.length ?? 0;
                                                const showCount = disaster && formStep.records !== undefined;

                                                return (
                                                    <button
                                                        key={formStep.label}
                                                        type="button"
                                                        onClick={() =>
                                                            formStep.href
                                                                ? router.visit(route(formStep.href))
                                                                : setActiveForm(formStep.label)
                                                        }
                                                        className="group flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] motion-reduce:transition-none sm:p-4"
                                                    >
                                                        <span
                                                            className={cn(
                                                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5",
                                                                group.tile,
                                                            )}
                                                            aria-hidden="true"
                                                        >
                                                            {formStep.icon}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block font-semibold leading-tight text-foreground">
                                                                {formStep.label}
                                                            </span>
                                                            <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                                                                {FORM_DESCRIPTIONS[formStep.label] ?? `Open the ${formStep.label.toLowerCase()} form`}
                                                            </span>
                                                            {showCount && (
                                                                <span
                                                                    className={cn(
                                                                        "mt-2 inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                                                                        count > 0 ? "text-success" : "text-muted-foreground",
                                                                    )}
                                                                >
                                                                    {count > 0 ? (
                                                                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    ) : (
                                                                        <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    )}
                                                                    {count > 0
                                                                        ? `${count >= RECORD_CAP ? `${RECORD_CAP}+` : count} ${count === 1 ? "entry" : "entries"} saved`
                                                                        : "No entries yet"}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <ChevronRight
                                                            className="h-5 w-5 shrink-0 text-muted-foreground transition-[color,transform] duration-200 group-hover:text-primary motion-safe:group-hover:translate-x-0.5"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {/* The open form */}
                    {activeForm && (
                        <div className="mx-auto max-w-7xl">
                            {/* Only show back button if user has access to multiple forms */}
                            {steps.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setActiveForm(null)}
                                    className="-ml-3 mb-3 min-h-11 text-muted-foreground hover:text-foreground sm:min-h-9"
                                >
                                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                    All forms
                                </Button>
                            )}
                            <FormPanel>
                                <Suspense fallback={<FormLoader />}>
                                    {renderForm(activeForm)}
                                </Suspense>
                            </FormPanel>
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
