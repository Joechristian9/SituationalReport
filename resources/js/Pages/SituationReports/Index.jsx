// resources/js/Pages/SituationReports/Index.jsx
import { useEffect, useState } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
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
    Route, // ✅ replaced Road with Route
    Landmark,
    Save,
    Loader2,
    SaveAll,
} from "lucide-react";

// ✅ Forms
import WeatherForm from "@/Components/SituationOverview/WeatherForm";
import WaterLevelForm from "@/Components/SituationOverview/WaterLevelForm";
import ElectricityForm from "@/Components/SituationOverview/ElectricityForm";
import WaterForm from "@/Components/SituationOverview/WaterForm";
import CommunicationForm from "@/Components/SituationOverview/CommunicationForm";
import RoadForm from "@/Components/SituationOverview/RoadForm";
import BridgeForm from "@/Components/SituationOverview/BridgeForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Stepper state
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

    // ✅ useForm defaults
    const { data, setData, post, processing, errors } = useForm({
        reports: [
            {
                id: 1,
                municipality: "",
                sky_condition: "",
                wind: "",
                precipitation: "",
                sea_condition: "",
            },
        ],
        waterLevels: [
            {
                id: 1,
                gauging_station: "",
                current_level: "",
                alarm_level: "",
                critical_level: "",
                affected_areas: "",
            },
        ],
        electricityServices: [
            { id: 1, status: "", barangays_affected: "", remarks: "" },
        ],
        waterServices: [
            {
                id: 1,
                source_of_water: "",
                barangays_served: "",
                status: "",
                remarks: "",
            },
        ],
        communications: [
            {
                id: 1,
                globe: "",
                smart: "",
                pldt_landline: "",
                pldt_internet: "",
                vhf: "",
                remarks: "",
            },
        ],
        roads: [
            {
                id: 1,
                road_classification: "",
                name_of_road: "",
                status: "",
                areas_affected: "",
                re_routing: "",
                remarks: "",
            },
        ],
        bridges: [
            {
                id: 1,
                road_classification: "",
                name_of_bridge: "",
                status: "",
                areas_affected: "",
                re_routing: "",
                remarks: "",
            },
        ],
    });

    // ✅ Restore saved form
    useEffect(() => {
        const saved = localStorage.getItem("situationReports");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved reports", e);
            }
        }
    }, []);

    // ✅ Save form state
    useEffect(() => {
        localStorage.setItem("situationReports", JSON.stringify(data));
    }, [data]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Create Situational Report" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("situation-reports.store"), { preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Create Situational Report</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                {/* ✅ ENHANCEMENT: Softer, neutral background */}
                <main className="w-full p-6 h-full bg-gray-50">
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">
                                        Step {step} of {steps.length}
                                    </span>
                                </CardTitle>

                                {/* ✅ ENHANCEMENT: Refined stepper UI with better colors */}
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
                                            const isCompleted =
                                                step > stepNumber;
                                            const isActive =
                                                step === stepNumber;

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
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 transition-all duration-300 ${
                                                            isCompleted
                                                                ? "border-emerald-500 bg-emerald-50 text-emerald-500"
                                                                : isActive
                                                                ? "border-blue-500 bg-blue-50 text-blue-500 shadow-lg scale-110"
                                                                : "border-gray-300 bg-white text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500"
                                                        }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2
                                                                size={22}
                                                            />
                                                        ) : (
                                                            item.icon
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`mt-2 text-xs transition-colors duration-300 ${
                                                            isCompleted
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
                                        <motion.div
                                            key="weather"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <WeatherForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 2 && (
                                        <motion.div
                                            key="water"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <WaterLevelForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 3 && (
                                        <motion.div
                                            key="electricity"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ElectricityForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 4 && (
                                        <motion.div
                                            key="waterService"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <WaterForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 5 && (
                                        <motion.div
                                            key="comm"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <CommunicationForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 6 && (
                                        <motion.div
                                            key="roads"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <RoadForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 7 && (
                                        <motion.div
                                            key="bridges"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <BridgeForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>

                            {/* ✅ ENHANCEMENT: Standardized button styles */}
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

                                {/* ✅ ENHANCEMENT: Consistent primary action button with icon */}
                                {step === steps.length && (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="relative flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                                <span className="animate-pulse">
                                                    Saving...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {" "}
                                                <SaveAll className="w-5 h-5" />{" "}
                                                <span>Save All Reports</span>{" "}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </form>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
