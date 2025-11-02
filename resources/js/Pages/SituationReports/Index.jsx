// resources/js/Pages/SituationReports/Index.jsx

import { useEffect, useState, lazy, Suspense } from "react";
import { usePage, Head, useForm, router } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
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
} from "lucide-react";

// Lazy load form components for better performance
const WeatherForm = lazy(() => import("@/Components/SituationOverview/WeatherForm"));
const WaterLevelForm = lazy(() => import("@/Components/SituationOverview/WaterLevelForm"));
const ElectricityForm = lazy(() => import("@/Components/SituationOverview/ElectricityForm"));
const WaterForm = lazy(() => import("@/Components/SituationOverview/WaterForm"));
const CommunicationForm = lazy(() => import("@/Components/SituationOverview/CommunicationForm"));
const RoadForm = lazy(() => import("@/Components/SituationOverview/RoadForm"));
const BridgeForm = lazy(() => import("@/Components/SituationOverview/BridgeForm"));

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
    } = usePage().props;

    const [step, setStep] = useState(1);
    const steps = [
        { label: "Weather", icon: <Cloud size={18} /> },
        { label: "Water Level", icon: <Waves size={18} /> },
        { label: "Electricity", icon: <Zap size={18} /> },
        { label: "Water Services", icon: <Droplet size={18} /> },
        { label: "Communications", icon: <Phone size={18} /> },
        { label: "Roads", icon: <Route size={18} /> },
        { label: "Bridges", icon: <Landmark size={18} /> },
    ];

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

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Situational Report</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
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
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <Card className="shadow-lg rounded-2xl border">
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

                        <CardContent className="space-y-8 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    // CORRECTED: 'key' prop is now passed directly
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <WeatherForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 2 && (
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
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 3 && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <ElectricityForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 4 && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <WaterForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 5 && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <CommunicationForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 6 && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <RoadForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                                {step === 7 && (
                                    <motion.div key={step} {...motionProps}>
                                        <Suspense fallback={<FormLoader />}>
                                            <BridgeForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

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
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
