import { useEffect, useState, lazy, Suspense } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import FormPanel from "@/Components/forms/FormPanel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    UserX,
    Plane,
    School,
    HelpCircle,
    Home,
} from "lucide-react";
import { SkeletonForm } from "@/Components/ui/skeleton";

import {
    Tabs as UITabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";

// Lazy load heavy form components to improve performance
const IncidentMonitoredForm = lazy(() => import("@/Components/Effects/IncidentMonitoredForm"));
const CasualtyForm = lazy(() => import("@/Components/Effects/CasualtyForm"));
const InjuredForm = lazy(() => import("@/Components/Effects/InjuredForm"));
const MissingForm = lazy(() => import("@/Components/Effects/MissingForm"));
const AffectedTouristsForm = lazy(() => import("@/Components/Effects/AffectedTouristsForm"));
const DamagedHousesForm = lazy(() => import("@/Components/Effects/DamagedHousesForm"));
const SuspensionOfClassesForm = lazy(() => import("@/Components/Effects/SuspensionOfClassesForm"));
const SuspensionOfWorkForm = lazy(() => import("@/Components/Effects/SuspensionOfWorkForm"));

const FormLoader = () => <SkeletonForm className="py-2" />;

export default function Index() {
    const { flash, incidents, casualties, injured, missing, affectedTourists, damagedHouses, suspensionOfClasses, suspensionOfWork, typhoon } = usePage().props;
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';
    const [step, setStep] = useState(1);
    const [activeCasualtyTab, setActiveCasualtyTab] = useState("dead");
    const [activeSuspensionTab, setActiveSuspensionTab] = useState("classes");

    const steps = [
        { label: "Incidents Monitored", icon: <AlertTriangle size={18} /> },
        { label: "Casualties", icon: <UserX size={18} /> },
        { label: "Affected Tourists", icon: <Plane size={18} /> },
        { label: "Damaged Houses", icon: <Home size={18} /> },
        { label: "Suspension of Classes & Work", icon: <School size={18} /> },
    ];

    const defaultState = {
        incidents: incidents && incidents.length > 0
            ? incidents
            : [
                {
                    id: `new-${Date.now()}`,
                    kinds_of_incident: "",
                    date_time: "",
                    location: "",
                    description: "",
                    remarks: "",
                },
            ],
        casualties: casualties && casualties.length > 0
            ? casualties
            : [
                {
                    id: `new-${Date.now()}`,
                    name: "",
                    age: "",
                    sex: "",
                    address: "",
                    cause_of_death: "",
                    date_died: "",
                    place_of_incident: "",
                },
            ],
        injured: injured && injured.length > 0
            ? injured
            : [
                {
                    id: `new-${Date.now()}`,
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
        missing: missing && missing.length > 0
            ? missing
            : [
                {
                    id: `new-${Date.now()}`,
                    name: "",
                    age: "",
                    sex: "",
                    address: "",
                    cause: "",
                    remarks: "",
                },
            ],
        affected_tourists: affectedTourists && affectedTourists.length > 0
            ? affectedTourists
            : [
                {
                    id: `new-${Date.now()}`,
                    province_city_municipality: "",
                    location: "",
                    local_tourists: "",
                    foreign_tourists: "",
                    remarks: "",
                },
            ],
        damaged_houses: damagedHouses && damagedHouses.length > 0
            ? damagedHouses
            : [
                { id: `new-${Date.now()}`, barangay: "", partially: "", totally: "" },
            ],
        suspension_of_classes: suspensionOfClasses && suspensionOfClasses.length > 0
            ? suspensionOfClasses
            : [
                {
                    id: `new-${Date.now()}`,
                    province_city_municipality: "",
                    level: "",
                    date_of_suspension: "",
                    remarks: "",
                },
            ],
        suspension_of_work: suspensionOfWork && suspensionOfWork.length > 0
            ? suspensionOfWork
            : [
                {
                    id: `new-${Date.now()}`,
                    province_city_municipality: "",
                    date_of_suspension: "",
                    remarks: "",
                },
            ],
    };

    const { data, setData, errors } = useForm(defaultState);

    // Update incidents from backend when data changes
    useEffect(() => {
        if (incidents && incidents.length > 0) {
            setData('incidents', incidents);
        }
    }, [incidents]);

    // Update casualties from backend when data changes
    useEffect(() => {
        if (casualties && casualties.length > 0) {
            setData('casualties', casualties);
        }
    }, [casualties]);

    // Update injured from backend when data changes
    useEffect(() => {
        if (injured && injured.length > 0) {
            setData('injured', injured);
        }
    }, [injured]);

    // Update missing from backend when data changes
    useEffect(() => {
        if (missing && missing.length > 0) {
            setData('missing', missing);
        }
    }, [missing]);

    // Update affected tourists from backend when data changes
    useEffect(() => {
        if (affectedTourists && affectedTourists.length > 0) {
            setData('affected_tourists', affectedTourists);
        }
    }, [affectedTourists]);

    // Update damaged houses from backend when data changes
    useEffect(() => {
        if (damagedHouses && damagedHouses.length > 0) {
            setData('damaged_houses', damagedHouses);
        }
    }, [damagedHouses]);

    // Update suspension of classes from backend when data changes
    useEffect(() => {
        if (suspensionOfClasses && suspensionOfClasses.length > 0) {
            setData('suspension_of_classes', suspensionOfClasses);
        }
    }, [suspensionOfClasses]);

    // Update suspension of work from backend when data changes
    useEffect(() => {
        if (suspensionOfWork && suspensionOfWork.length > 0) {
            setData('suspension_of_work', suspensionOfWork);
        }
    }, [suspensionOfWork]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

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
                            !r.level &&
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
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumbs crumbs={crumbs} />
                    </div>
                    <ActiveTyphoonHeader 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
                </header>

                <main className="h-full w-full bg-background p-4 sm:p-6">
                    <FormPanel className="p-0 sm:p-0">
                        <div className="border-b border-border p-4 sm:p-6">
                            <p className="text-sm text-muted-foreground tabular-nums">
                                Report {step} of {steps.length}
                            </p>

                            {/* Stepper: every step stays reachable; done and skipped steps are marked with icon and text. */}
                            <nav aria-label="Report steps" className="mt-4">
                                <ol className="grid grid-cols-5 gap-1">
                                    {steps.map((item, index) => {
                                        const stepNumber = index + 1;
                                        const visited = step > stepNumber;
                                        const active = step === stepNumber;
                                        const empty = visited && isStepEmpty(stepNumber);
                                        const state = empty ? "Skipped" : visited ? "Done" : null;
                                        return (
                                            <li key={item.label} className="min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(stepNumber)}
                                                    aria-current={active ? "step" : undefined}
                                                    className="group flex w-full min-h-11 flex-col items-center gap-1.5 rounded-md px-1 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    <span
                                                        className={cn(
                                                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none",
                                                            active && "border-primary bg-primary text-primary-foreground",
                                                            !active && visited && !empty && "border-success bg-success/10 text-success",
                                                            !active && empty && "border-border bg-muted text-muted-foreground",
                                                            !active && !visited && "border-border bg-card text-muted-foreground group-hover:border-primary group-hover:text-primary",
                                                        )}
                                                    >
                                                        {empty ? (
                                                            <HelpCircle className="h-5 w-5" aria-hidden="true" />
                                                        ) : visited ? (
                                                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                                                        ) : (
                                                            item.icon
                                                        )}
                                                    </span>
                                                    <span className={cn("text-xs leading-tight", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                        {item.label}
                                                        {state && <span className="sr-only"> ({state})</span>}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>
                        </div>

                        <div className="space-y-8 p-4 sm:p-6">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="incidents"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Suspense fallback={<FormLoader />}>
                                                <IncidentMonitoredForm
                                                    data={data}
                                                    setData={setData}
                                                    errors={errors}
                                                    disabled={formsDisabled}
                                                />
                                            </Suspense>
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
                                                <TabsList className="grid grid-cols-3 w-full mb-6 h-auto [&>*]:whitespace-normal [&>*]:min-h-11">
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
                                                    <Suspense fallback={<FormLoader />}>
                                                        <CasualtyForm
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            disabled={formsDisabled}
                                                        />
                                                    </Suspense>
                                                </TabsContent>
                                                <TabsContent value="injured">
                                                    <Suspense fallback={<FormLoader />}>
                                                        <InjuredForm
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            disabled={formsDisabled}
                                                        />
                                                    </Suspense>
                                                </TabsContent>
                                                <TabsContent value="missing">
                                                    <Suspense fallback={<FormLoader />}>
                                                        <MissingForm
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            disabled={formsDisabled}
                                                        />
                                                    </Suspense>
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
                                            <Suspense fallback={<FormLoader />}>
                                                <AffectedTouristsForm
                                                    data={data}
                                                    setData={setData}
                                                    errors={errors}
                                                    disabled={formsDisabled}
                                                />
                                            </Suspense>
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
                                            <Suspense fallback={<FormLoader />}>
                                                <DamagedHousesForm
                                                    data={data}
                                                    setData={setData}
                                                    errors={errors}
                                                    disabled={formsDisabled}
                                                />
                                            </Suspense>
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
                                                <TabsList className="grid grid-cols-2 w-full mb-6 h-auto [&>*]:whitespace-normal [&>*]:min-h-11">
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
                                                    <Suspense fallback={<FormLoader />}>
                                                        <SuspensionOfClassesForm
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            disabled={formsDisabled}
                                                        />
                                                    </Suspense>
                                                </TabsContent>
                                                <TabsContent value="work">
                                                    <Suspense fallback={<FormLoader />}>
                                                        <SuspensionOfWorkForm
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            disabled={formsDisabled}
                                                        />
                                                    </Suspense>
                                                </TabsContent>
                                            </UITabs>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                        </div>

                        {/* Step navigation is secondary: each form's Save is the one primary action. */}
                        <div className="flex items-center justify-between gap-3 border-t border-border p-4 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={step === 1}
                                onClick={() => setStep(step - 1)}
                                className="min-h-11 sm:min-h-9"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                            </Button>

                            {step < steps.length && (
                                <Button type="button" variant="outline" onClick={() => setStep(step + 1)} className="min-h-11 sm:min-h-9">
                                    <span className="sm:hidden">Next</span>
                                    <span className="hidden sm:inline">Next: {steps[step].label}</span>
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            )}
                        </div>
                    </FormPanel>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
