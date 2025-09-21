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
import { motion, AnimatePresence, m } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    UserX,
    Loader2,
    UserPlus,
    UserSearch,
    Plane,
    SaveAll,
} from "lucide-react";

// ✅ Forms
import IncidentMonitoredForm from "@/Components/Effects/IncidentMonitoredForm";
import CasualtyForm from "@/Components/Effects/CasualtyForm";
import InjuredForm from "@/Components/Effects/InjuredForm";
import MissingForm from "@/Components/Effects/MissingForm";
import AffectedTouristsForm from "@/Components/Effects/AffectedTouristsForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Stepper state
    const [step, setStep] = useState(1);
    const steps = [
        { label: "Incidents Monitored", icon: <AlertTriangle size={18} /> },
        { label: "Casualties", icon: <UserX size={18} /> },
        { label: "Injured", icon: <UserPlus size={18} /> },
        { label: "Missing", icon: <UserSearch size={18} /> },
        { label: "Affected Tourists", icon: <Plane size={18} /> },
    ];

    // ✅ Form State for both forms
    const { data, setData, post, processing, errors } = useForm({
        incidents: [
            {
                id: 1,
                kinds_of_incident: "",
                date_time: "",
                location: "",
                description: "",
                remarks: "",
            },
        ],
        casualties: [
            {
                id: 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                cause_of_death: "",
                date_died: "",
                place_of_incident: "",
            },
        ],
        injured: [
            {
                id: 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                diagnosis: "",
                date_admitted: "",
                place_of_incident: "",
                remarks: "",
            },
        ],
        missing: [
            {
                id: 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                cause: "",
                remarks: "",
            },
        ],
        affected_tourists: [
            {
                id: 1,
                province_city_municipality: "",
                location: "",
                local_tourists: "",
                foreign_tourists: "",
                remarks: "",
            },
        ],
    });

    // ✅ Restore saved form from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("effectsReport");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved effects report", e);
            }
        }
    }, []);

    // ✅ Save form state to localStorage
    useEffect(() => {
        localStorage.setItem("effectsReport", JSON.stringify(data));
    }, [data]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Effects Report" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("casualties.store"), { preserveScroll: true });
        post(route("incident-monitored.store"), { preserveScroll: true });
        post(route("injured.store"), { preserveScroll: true });
        post(route("missing.store"), { preserveScroll: true });
        post(route("affected-tourists.store"), { preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Effects Report</title>
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

                <main className="w-full p-6 h-full bg-gray-50">
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">
                                        Step {step} of {steps.length}
                                    </span>
                                </CardTitle>

                                {/* ✅ Stepper UI */}
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
                                                                ? "border-green-600 bg-green-100 text-green-600"
                                                                : isActive
                                                                ? "border-blue-600 bg-blue-100 text-blue-600 shadow-md scale-110"
                                                                : "border-gray-300 bg-white text-gray-400 group-hover:border-blue-400"
                                                        }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2
                                                                size={22}
                                                                className="text-green-600 group-hover:scale-110 transition-transform"
                                                            />
                                                        ) : (
                                                            item.icon
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`mt-2 text-xs transition-colors duration-300 ${
                                                            isCompleted
                                                                ? "text-green-600"
                                                                : isActive
                                                                ? "text-blue-600 font-semibold"
                                                                : "text-gray-400 group-hover:text-blue-400"
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

                            <CardContent className="space-y-8">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="incidents"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <IncidentMonitoredForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 2 && (
                                        <motion.div
                                            key="casualties"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <CasualtyForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 3 && (
                                        <motion.div
                                            key="injured"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <InjuredForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 4 && (
                                        <motion.div
                                            key="missing"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <MissingForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}
                                    {step === 5 && (
                                        <motion.div
                                            key="affected_tourists"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <AffectedTouristsForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
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
