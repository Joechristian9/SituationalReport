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
    AlertTriangle,
    UserX,
    Loader2,
    Plane,
    SaveAll,
    School,
    HelpCircle,
} from "lucide-react";
import { LiaHouseDamageSolid } from "react-icons/lia";

import IncidentMonitoredForm from "@/Components/Effects/IncidentMonitoredForm";
import CasualtyForm from "@/Components/Effects/CasualtyForm";
import InjuredForm from "@/Components/Effects/InjuredForm";
import MissingForm from "@/Components/Effects/MissingForm";
import AffectedTouristsForm from "@/Components/Effects/AffectedTouristsForm";
import DamagedHousesForm from "@/Components/Effects/DamagedHousesForm";
import SuspensionOfClassesForm from "@/Components/Effects/SuspensionOfClassesForm";
import SuspensionOfWorkForm from "@/Components/Effects/SuspensionOfWorkForm";

import {
    Tabs as UITabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";

export default function Index() {
    const { flash } = usePage().props;
    const [step, setStep] = useState(1);
    const [activeCasualtyTab, setActiveCasualtyTab] = useState("dead");
    const [activeSuspensionTab, setActiveSuspensionTab] = useState("classes");

    const steps = [
        { label: "Incidents Monitored", icon: <AlertTriangle size={18} /> },
        { label: "Casualties", icon: <UserX size={18} /> },
        { label: "Affected Tourists", icon: <Plane size={18} /> },
        { label: "Damaged Houses", icon: <LiaHouseDamageSolid size={18} /> },
        { label: "Suspension of Classes & Work", icon: <School size={18} /> },
    ];

    const defaultState = {
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
        damaged_houses: [
            { id: 1, barangay: "", partially: "", totally: "", total: 0 },
        ],
        suspension_of_classes: [
            {
                id: 1,
                province_city_municipality: "",
                levels: "",
                date_of_suspension: "",
                remarks: "",
            },
        ],
        suspension_of_work: [
            {
                id: 1,
                province_city_municipality: "",
                date_of_suspension: "",
                remarks: "",
            },
        ],
    };

    const { data, setData, post, processing, errors } = useForm(defaultState);

    useEffect(() => {
        const saved = localStorage.getItem("effectsReport");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData({ ...defaultState, ...parsed });
            } catch (e) {
                console.error("Failed to parse saved report", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("effectsReport", JSON.stringify(data));
    }, [data]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("incident-monitored.store"), { preserveScroll: true });
        post(route("casualties.store"), { preserveScroll: true });
        post(route("injured.store"), { preserveScroll: true });
        post(route("missing.store"), { preserveScroll: true });
        post(route("affected-tourists.store"), { preserveScroll: true });
        post(route("damaged-houses.store"), { preserveScroll: true });
        post(route("suspension-of-classes.store"), { preserveScroll: true });
        post(route("suspension-of-works.store"), { preserveScroll: true });
    };

    const isStepEmpty = (stepNumber) => {
        switch (stepNumber) {
            case 1:
                return data.incidents.every(
                    (r) =>
                        !r.kinds_of_incident &&
                        !r.date_time &&
                        !r.location &&
                        !r.description &&
                        !r.remarks
                );

            case 2: {
                // --- DEAD ---
                const allDeadNamesEmpty = data.casualties.every(
                    (r) => !r.name?.trim()
                );

                // --- INJURED ---
                const allInjuredNamesEmpty = data.injured.every(
                    (r) => !r.name?.trim()
                );

                // --- MISSING ---
                const allMissingNamesEmpty = data.missing.every(
                    (r) => !r.name?.trim()
                );

                // Step 2 is empty if *all three tabs* have all empty names
                return (
                    allDeadNamesEmpty &&
                    allInjuredNamesEmpty &&
                    allMissingNamesEmpty
                );
            }

            case 3:
                return data.affected_tourists.every(
                    (r) =>
                        !r.province_city_municipality &&
                        !r.location &&
                        !r.local_tourists &&
                        !r.foreign_tourists &&
                        !r.remarks
                );

            case 4:
                return data.damaged_houses.every(
                    (r) => !r.barangay && !r.partially && !r.totally && !r.total
                );

            case 5:
                return (
                    data.suspension_of_classes.every(
                        (r) =>
                            !r.province_city_municipality &&
                            !r.levels &&
                            !r.date_of_suspension &&
                            !r.remarks
                    ) &&
                    data.suspension_of_work.every(
                        (r) =>
                            !r.province_city_municipality &&
                            !r.date_of_suspension &&
                            !r.remarks
                    )
                );

            default:
                return true;
        }
    };

    const user = usePage().props.auth.user;
    const isAdmin = user.roles?.some((r) => r.name?.toLowerCase() === "admin");
    const currentStepLabel = steps[step - 1]?.label || "Effects Report";

    let subLabel = "";
    if (step === 2) {
        if (activeCasualtyTab === "dead") subLabel = "Dead";
        if (activeCasualtyTab === "injured") subLabel = "Injured";
        if (activeCasualtyTab === "missing") subLabel = "Missing";
    } else if (step === 5) {
        if (activeSuspensionTab === "classes")
            subLabel = "Suspension of Classes";
        if (activeSuspensionTab === "work") subLabel = "Suspension of Work";
    }

    const crumbs = isAdmin
        ? [
              { href: route("admin.dashboard"), label: "Dashboard" },
              { label: "Effects Report" },
              { label: currentStepLabel },
              ...(subLabel ? [{ label: subLabel }] : []),
          ]
        : [
              { label: "Effects Report" },
              { label: currentStepLabel },
              ...(subLabel ? [{ label: subLabel }] : []),
          ];

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
                        <Breadcrumbs crumbs={crumbs} />
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

                                {/* ---------- STEPPER ---------- */}
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
                                            const wasVisited =
                                                step > stepNumber;
                                            const isActive =
                                                step === stepNumber;
                                            const empty =
                                                wasVisited &&
                                                isStepEmpty(stepNumber);

                                            let icon;
                                            if (empty) {
                                                icon = (
                                                    <HelpCircle
                                                        size={20}
                                                        className="text-gray-400"
                                                    />
                                                );
                                            } else if (wasVisited) {
                                                icon = (
                                                    <CheckCircle2
                                                        size={22}
                                                        className="text-green-500"
                                                    />
                                                );
                                            } else {
                                                icon = item.icon;
                                            }

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
                                                                : wasVisited
                                                                ? "border-green-500 bg-green-50 text-green-500"
                                                                : isActive
                                                                ? "border-blue-600 bg-blue-50 text-blue-600 shadow-lg scale-110"
                                                                : "border-gray-300 bg-white text-gray-500 group-hover:border-blue-400"
                                                        }`}
                                                    >
                                                        {icon}
                                                    </div>
                                                    <span
                                                        className={`mt-2 text-xs ${
                                                            empty
                                                                ? "text-gray-400"
                                                                : wasVisited
                                                                ? "text-green-600 font-medium"
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

                            {/* ---------- CONTENT ---------- */}
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
                                            <UITabs
                                                value={activeCasualtyTab}
                                                onValueChange={
                                                    setActiveCasualtyTab
                                                }
                                                className="w-full"
                                            >
                                                <TabsList className="grid grid-cols-3 w-full mb-6">
                                                    <TabsTrigger value="dead">
                                                        Dead (
                                                        {data.casualties.length}
                                                        )
                                                    </TabsTrigger>
                                                    <TabsTrigger value="injured">
                                                        Injured (
                                                        {data.injured.length})
                                                    </TabsTrigger>
                                                    <TabsTrigger value="missing">
                                                        Missing (
                                                        {data.missing.length})
                                                    </TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="dead">
                                                    <CasualtyForm
                                                        data={data}
                                                        setData={setData}
                                                        errors={errors}
                                                    />
                                                </TabsContent>
                                                <TabsContent value="injured">
                                                    <InjuredForm
                                                        data={data}
                                                        setData={setData}
                                                        errors={errors}
                                                    />
                                                </TabsContent>
                                                <TabsContent value="missing">
                                                    <MissingForm
                                                        data={data}
                                                        setData={setData}
                                                        errors={errors}
                                                    />
                                                </TabsContent>
                                            </UITabs>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="tourists"
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

                                    {step === 4 && (
                                        <motion.div
                                            key="houses"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <DamagedHousesForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        </motion.div>
                                    )}

                                    {step === 5 && (
                                        <motion.div
                                            key="suspension"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <UITabs
                                                value={activeSuspensionTab}
                                                onValueChange={
                                                    setActiveSuspensionTab
                                                }
                                                className="w-full"
                                            >
                                                <TabsList className="grid grid-cols-2 w-full mb-6">
                                                    <TabsTrigger value="classes">
                                                        Suspension of Classes (
                                                        {
                                                            data
                                                                .suspension_of_classes
                                                                .length
                                                        }
                                                        )
                                                    </TabsTrigger>
                                                    <TabsTrigger value="work">
                                                        Suspension of Work (
                                                        {
                                                            data
                                                                .suspension_of_work
                                                                .length
                                                        }
                                                        )
                                                    </TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="classes">
                                                    <SuspensionOfClassesForm
                                                        data={data}
                                                        setData={setData}
                                                        errors={errors}
                                                    />
                                                </TabsContent>
                                                <TabsContent value="work">
                                                    <SuspensionOfWorkForm
                                                        data={data}
                                                        setData={setData}
                                                        errors={errors}
                                                    />
                                                </TabsContent>
                                            </UITabs>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>

                            {/* ---------- FOOTER ---------- */}
                            <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-2xl">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={step === 1}
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </Button>

                                {step < steps.length && (
                                    <Button
                                        type="button"
                                        onClick={() => setStep(step + 1)}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Next <ChevronRight size={16} />
                                    </Button>
                                )}
                                {step === steps.length && (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SaveAll className="w-5 h-5" />
                                                <span>Save All Reports</span>
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
