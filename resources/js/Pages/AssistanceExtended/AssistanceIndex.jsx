import { useState, lazy, Suspense } from "react";
import { Head, usePage } from "@inertiajs/react"; // ✅ include usePage
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    // ✅ get authenticated user
    const { auth } = usePage().props;
    const user = auth.user;

    // ✅ determine if user is an admin (works with Spatie roles)
    const isAdmin = user.roles?.some((r) => r.name?.toLowerCase() === "admin");

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head>
                <title>Assistance Records</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>

            <SidebarInset>
                {/* Header with Breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />

                        {isAdmin ? (
                            <Breadcrumbs
                                crumbs={[
                                    {
                                        href: route("admin.dashboard"),
                                        label: "Dashboard",
                                    },
                                    { label: "Assistance" },
                                ]}
                            />
                        ) : (
                            <Breadcrumbs crumbs={[{ label: "Assistance" }]} />
                        )}
                    </div>
                </header>

                {/* Page Heading */}
                <main className="w-full p-6 h-full bg-gray-50">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Assistance Records
                            </h1>
                            <p className="text-gray-600 mt-1">
                                View and manage assistance provided to
                                individuals, families, and LGUs.
                            </p>
                        </div>

                        {/* Tabs for different assistance forms */}
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full"
                        >
                            <TabsList className="mb-4 bg-white p-2 rounded-xl shadow-sm border">
                                <TabsTrigger value="extended">
                                    Assistance Extended
                                </TabsTrigger>
                                <TabsTrigger value="lgu">
                                    Assistance Provided to LGUs
                                </TabsTrigger>
                                <TabsTrigger value="families">
                                    Assistance Provided to Families
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="extended">
                                <Suspense fallback={<FormLoader />}>
                                    <AssistanceExtended />
                                </Suspense>
                            </TabsContent>

                            <TabsContent value="lgu">
                                <Suspense fallback={<FormLoader />}>
                                    <AssistanceProvidedLgu />
                                </Suspense>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
