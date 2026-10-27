import { useState, lazy, Suspense } from "react";
import { usePage } from "@inertiajs/react";
import TyphoonStatusAlert from "@/Components/DisasterStatusAlert";
import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import AppLayout from "@/Layouts/AppLayout";
import Breadcrumbs from "@/Components/Breadcrumbs";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Tabs as UITabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/Components/ui/tabs";
import { Loader2 } from "lucide-react";

// Lazy load form components for better performance
const AssistanceExtended = lazy(() => import("./AssistanceExtended"));
const AssistanceProvidedLgu = lazy(() => import("./AssistanceProvidedLgu"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

export default function AssistanceIndex() {
    const [activeTab, setActiveTab] = useState("extended");

    // Get authenticated user and data
    const { auth, assistances, typhoon } = usePage().props;
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';
    const user = auth.user;

    // Determine if user is an admin (works with Spatie roles)
    const isAdmin = user.roles?.some((r) => r.name?.toLowerCase() === "admin");

    return (
        <AppLayout
            title="Assistance Records"
            header={
                <Breadcrumbs
                    crumbs={[
                        ...(isAdmin ? [{ href: route("dashboard"), label: "Dashboard" }] : []),
                        { label: "Assistance" },
                    ]}
                />
            }
            actions={
                <ActiveTyphoonHeader
                    typhoon={typhoon?.active}
                    hasActive={typhoon?.hasActive}
                />
            }
        >

                {/* Main Content */}
                <main className="w-full p-4 sm:p-6 h-full bg-gray-50">
                    
                    <Card className="shadow-lg rounded-2xl border">
                        {/* Header */}
                        <CardContent className="p-4 sm:p-6">
                            <div className="mb-6">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    Assistance Records
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    View and manage assistance provided to individuals, families, and LGUs.
                                </p>
                            </div>

                            {/* Tabs for different assistance forms */}
                            <UITabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-2 mb-6 bg-slate-50 p-1 rounded-lg">
                                    <TabsTrigger 
                                        value="extended"
                                        className="text-xs sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">Assistance </span>Extended
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="lgu"
                                        className="text-xs sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">Provided to </span>LGUs
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="families"
                                        className="text-xs sm:text-sm col-span-2 sm:col-span-1"
                                    >
                                        <span className="hidden sm:inline">Provided to </span>Families
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="extended" className="mt-0">
                                    <Suspense fallback={<FormLoader />}>
                                        <AssistanceExtended 
                                            assistances={assistances}
                                            disabled={formsDisabled}
                                        />
                                    </Suspense>
                                </TabsContent>

                                <TabsContent value="lgu" className="mt-0">
                                    <Suspense fallback={<FormLoader />}>
                                        <AssistanceProvidedLgu disabled={formsDisabled} />
                                    </Suspense>
                                </TabsContent>

                                <TabsContent value="families" className="mt-0">
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        <p>Families assistance form coming soon...</p>
                                    </div>
                                </TabsContent>
                            </UITabs>
                        </CardContent>
                    </Card>
                </main>
        </AppLayout>
    );
}
