// resources/js/Pages/SituationReports/Index.jsx

import React, { useEffect, useState, lazy, Suspense } from "react";
import { usePage, Head, useForm, router } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";

import TyphoonStatusAlert from "@/Components/TyphoonStatusAlert";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";
import NoActiveTyphoonNotification from "@/Components/NoActiveTyphoonNotification";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Cloud,
    Waves,
    Zap,
    Droplet,
    Phone,
    Route,
    Landmark,
    HelpCircle,
    Loader2,
    ClipboardList,
    MapPin,
} from "lucide-react";

// Lazy load form components for better performance
const WeatherForm = lazy(() => import("@/Components/SituationOverview/WeatherForm"));
const WaterLevelForm = lazy(() => import("@/Components/SituationOverview/WaterLevelForm"));
const ElectricityForm = lazy(() => import("@/Components/SituationOverview/ElectricityForm"));
const WaterForm = lazy(() => import("@/Components/SituationOverview/WaterForm"));
const CommunicationForm = lazy(() => import("@/Components/SituationOverview/CommunicationForm"));
const RoadForm = lazy(() => import("@/Components/SituationOverview/RoadForm"));
const BridgeForm = lazy(() => import("@/Components/SituationOverview/BridgeForm"));
const PreEmptiveReportsForm = lazy(() => import("@/Components/SituationOverview/PreEmptiveReportsForm"));
const PrePositioningReportsForm = lazy(() => import("@/Components/SituationOverview/PrePositioningReportsForm"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

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
        typhoon,
        auth,
    } = usePage().props;

    // Check if forms should be disabled (no active typhoon, ended, or paused)
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended' || typhoon?.active?.status === 'paused';

    // Poll for typhoon status changes - using localStorage to prevent spam
    useEffect(() => {
        // Get the last known state from localStorage
        const getLastKnownState = () => {
            try {
                const stored = localStorage.getItem('lastTyphoonState');
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
                timestamp: Date.now()
            };
            localStorage.setItem('lastTyphoonState', JSON.stringify(currentState));
        };

        const checkTyphoonStatus = async () => {
            try {
                const response = await fetch('/api/typhoon/active', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
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
                    localStorage.setItem('lastTyphoonState', JSON.stringify({
                        status: newStatus,
                        hasActive: newHasActive,
                        typhoonId: newTyphoonId,
                        timestamp: Date.now()
                    }));
                    
                    // Reload the page
                    router.reload({ 
                        preserveScroll: true,
                        onSuccess: () => {
                            if (newStatus === 'paused' && lastKnown.status === 'active') {
                                toast.error('Typhoon report has been paused. Forms are now disabled.');
                            } else if (newStatus === 'active' && lastKnown.status === 'paused') {
                                toast.success('Typhoon report has been resumed. Forms are now enabled.');
                            } else if (!newHasActive && lastKnown.hasActive) {
                                toast.error('Typhoon report has been ended. Forms are now disabled.');
                            } else if (newHasActive && !lastKnown.hasActive) {
                                toast.success('New typhoon report created!');
                            }
                        }
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
    const userPermissions = auth?.user?.permissions?.map(p => p.name) || [];
    const isAdmin = auth?.user?.roles?.some(r => r.name === 'admin');

    // Helper function to check if user has permission
    const hasPermission = (permission) => {
        return isAdmin || userPermissions.includes(permission);
    };

    // Define all possible steps with their permissions
    const allSteps = [
        { label: "Weather", icon: <Cloud size={18} />, permission: "access-weather-form" },
        { label: "Water Level", icon: <Waves size={18} />, permission: "access-water-level-form" },
        { label: "Electricity", icon: <Zap size={18} />, permission: "access-electricity-form" },
        { label: "Water Services", icon: <Droplet size={18} />, permission: "access-water-service-form" },
        { label: "Communications", icon: <Phone size={18} />, permission: "access-communication-form" },
        { label: "Roads", icon: <Route size={18} />, permission: "access-road-form" },
        { label: "Bridges", icon: <Landmark size={18} />, permission: "access-bridge-form" },
        { label: "Pre-Emptive Reports", icon: <ClipboardList size={18} />, permission: "access-pre-emptive-form" },
        { label: "Pre-positioning", icon: <MapPin size={18} />, permission: "access-pre-positioning-form" },
    ];

    // Filter steps based on user permissions
    const steps = allSteps.filter(step => hasPermission(step.permission));

    // Initialize step: 0 for card selection (2-4 forms), 1 for direct form (1 form or 5+ forms)
    const [step, setStep] = useState(!isAdmin && steps.length >= 2 && steps.length <= 4 ? 0 : 1);

    const { data, setData, errors } = useForm({
        reports:
            weatherReports && weatherReports.length > 0
                ? weatherReports
                : [
                      {
                          id: null,
                          municipality: "",
                          sky_condition: "",
                          wind: "",
                          precipitation: "",
                          sea_condition: "",
                      },
                  ],
        preEmptiveReports: [
            {
                id: null,
                barangay: '',
                evacuation_center: '',
                families: '',
                persons: '',
                outside_center: '',
                outside_families: '',
                outside_persons: '',
                total_families: 0,
                total_persons: 0,
            },
        ],
        prePositioning: [
            {
                id: null,
                asset_type: '',
                description: '',
                quantity: '',
                location: '',
                deployed_by: '',
                remarks: '',
            },
        ],
        waterLevels:
            waterLevels && waterLevels.length > 0
                ? waterLevels
                : [
                      {
                          id: null,
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
                          id: null,
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
                          id: null,
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
                          id: null,
                          globe: "",
                          smart: "",
                          pldt_landline: "",
                          pldt_internet: "",
                          vhf: "",
                          remarks: "",
                      },
                  ],
        roads:
            roads && roads.length > 0
                ? roads
                : [
                      {
                          id: null,
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
                          id: null,
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

    // CORRECTED: 'key' is removed from this object
    const motionProps = {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
        transition: { duration: 0.3 },
    };

    // Render form based on step number
    const renderForm = (stepNumber) => {
        const stepLabel = steps[stepNumber - 1]?.label;
        
        switch(stepLabel) {
            case "Weather":
                return <WeatherForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Water Level":
                return <WaterLevelForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Electricity":
                return <ElectricityForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Water Services":
                return <WaterForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Communications":
                return <CommunicationForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Roads":
                return <RoadForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Bridges":
                return <BridgeForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Pre-Emptive Reports":
                return <PreEmptiveReportsForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
            case "Pre-positioning":
                return <PrePositioningReportsForm data={data} setData={setData} errors={errors} disabled={formsDisabled} />;
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
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        {(() => {
                            const user = usePage().props.auth.user;
                            const isAdmin = user.roles?.some(
                                (r) => r.name?.toLowerCase() === "admin"
                            );

                            const currentStepLabel =
                                steps[step - 1]?.label || "Situational Report";

                            const crumbs = isAdmin
                                ? [
                                      {
                                          href: route("admin.dashboard"),
                                          label: "Dashboard",
                                      },
                                      { label: "Situational Report" },
                                      { label: currentStepLabel },
                                  ]
                                : [
                                      { label: "Situational Report" },
                                      { label: currentStepLabel },
                                  ];

                            return <Breadcrumbs crumbs={crumbs} />;
                        })()}
                    </div>
                    <div className="flex items-center gap-3">
                        <NoActiveTyphoonNotification 
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        {typhoon?.hasActive && typhoon?.active?.status === 'active' && (
                            <ActiveTyphoonHeader 
                                typhoon={typhoon?.active}
                                hasActive={typhoon?.hasActive}
                            />
                        )}
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    {/* Welcome message for users with limited access (1-4 forms) */}
                    {!isAdmin && steps.length >= 1 && steps.length <= 4 && (
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                        {steps.length === 1 ? (
                                            React.cloneElement(steps[0].icon, { size: 24 })
                                        ) : (
                                            <CheckCircle2 size={24} />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Welcome, {auth.user.name}!
                                    </h3>
                                    <p className="text-gray-600 mb-3">
                                        You have access to <span className="font-semibold text-blue-600">{steps.length}</span> {steps.length === 1 ? 'form' : 'forms'}. Select a form below to submit and manage your reports during active typhoon events.
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span>Your submissions will be included in the consolidated situational report</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card selection for users with 2-4 forms (CDRRMO) */}
                    {!isAdmin && steps.length >= 2 && steps.length <= 4 && step === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {steps.map((formStep, index) => {
                                const descriptions = {
                                    'Weather': 'Submit weather conditions',
                                    'Communications': 'Report communication status',
                                    'Pre-Emptive Reports': 'Submit pre-emptive evacuation reports',
                                    'Pre-positioning': 'Report deployment of response assets'
                                };
                                
                                return (
                                    <Card 
                                        key={index}
                                        className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                                        onClick={() => setStep(index + 1)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-100 rounded-lg">
                                                    {React.cloneElement(formStep.icon, { size: 24, className: "text-blue-600" })}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{formStep.label}</CardTitle>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {descriptions[formStep.label] || `Click to submit ${formStep.label.toLowerCase()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Show selected form for users with 1-4 forms */}
                    {!isAdmin && steps.length >= 1 && steps.length <= 4 && step > 0 && (
                        <Card className="shadow-lg rounded-2xl border">
                            <CardContent className="p-6">
                                <Suspense fallback={<FormLoader />}>
                                    <AnimatePresence mode="wait">
                                        <motion.div {...motionProps} key={step}>
                                            {renderForm(step)}
                                        </motion.div>
                                    </AnimatePresence>
                                </Suspense>
                            </CardContent>
                            {steps.length >= 2 && steps.length <= 4 && (
                                <div className="p-4 border-t bg-gray-50">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(0)}
                                        className="flex items-center gap-2"
                                    >
                                        <ChevronLeft size={16} />
                                        Back to Form Selection
                                    </Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Show stepper for users with 5+ forms (admins) */}
                    {(isAdmin || steps.length > 4) && (
                    <Card className="shadow-lg rounded-2xl border">
                        {steps.length > 4 && (
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">
                                        Report {step} of {steps.length}
                                    </span>
                                </CardTitle>
                            
                                <div className="relative w-full mt-8">
                                    <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 z-0">
                                        <div
                                            className="h-0.5 bg-blue-600 transition-all duration-500"
                                            style={{
                                                width: `${
                                                    ((step - 1) /
                                                        (steps.length - 1)) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="relative flex justify-between z-10">
                                    {steps.map((item, index) => {
                                        const stepNumber = index + 1;
                                        const isActive = step === stepNumber;
                                        const isPast = step > stepNumber;
                                        const wasVisited = step > stepNumber;
                                        const empty =
                                            wasVisited &&
                                            isStepEmpty(stepNumber);
                                        const renderIcon = () => {
                                            if (empty)
                                                return (
                                                    <HelpCircle
                                                        size={20}
                                                        className="text-gray-400"
                                                    />
                                                );
                                            if (wasVisited && !empty)
                                                return (
                                                    <CheckCircle2
                                                        size={22}
                                                        className="text-emerald-500"
                                                    />
                                                );
                                            return item.icon;
                                        };
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() =>
                                                    setStep(stepNumber)
                                                }
                                                className="flex flex-col items-center focus:outline-none group transition"
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                        empty
                                                            ? "border-gray-300 bg-gray-50 text-gray-400"
                                                            : wasVisited &&
                                                              !empty
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-500"
                                                            : isActive
                                                            ? "border-blue-500 bg-blue-50 text-blue-500 shadow-lg scale-110"
                                                            : "border-gray-300 bg-white text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500"
                                                    }`}
                                                >
                                                    {renderIcon()}
                                                </div>
                                                <span
                                                    className={`mt-2 text-xs transition-colors duration-300 ${
                                                        empty
                                                            ? "text-gray-400"
                                                            : wasVisited &&
                                                              !empty
                                                            ? "text-emerald-600 font-medium"
                                                            : isActive
                                                            ? "text-blue-600 font-semibold"
                                                            : "text-gray-500 group-hover:text-blue-500"
                                                    }`}
                                                >
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            </CardHeader>
                        )}

                        <CardContent className="space-y-8 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {steps[step - 1]?.label === "Weather" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <WeatherForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Water Level" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <WaterLevelForm
                                                data={{ reports: data.waterLevels }}
                                                setData={(updater) => {
                                                    const newReports = updater({
                                                        reports: data.waterLevels,
                                                    }).reports;
                                                    setData(
                                                        "waterLevels",
                                                        newReports
                                                    );
                                                }}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Electricity" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <ElectricityForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Water Services" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <WaterForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Communications" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <CommunicationForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Roads" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <RoadForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {steps[step - 1]?.label === "Bridges" && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <BridgeForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                disabled={formsDisabled}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        {steps.length > 2 && (
                            <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-2xl">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={step === 1}
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </Button>

                                {step < steps.length && (
                                    <Button
                                        type="button"
                                        onClick={() => setStep(step + 1)}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
