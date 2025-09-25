import { useState } from "react";
import { Head } from "@inertiajs/react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AssistanceExtended from "./AssistanceExtended";
import AssistanceProvidedLgu from "./AssistanceProvidedLgu";

export default function AssistanceIndex() {
    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Assistance" },
    ];

    const [activeTab, setActiveTab] = useState("extended");

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
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                {/* Page Heading */}
                <main className="w-full p-6 h-full bg-gray-50">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Assistance Records</h1>
                            <p className="text-gray-600 mt-1">
                                View and manage assistance provided to individuals, families, and LGUs.
                            </p>
                        </div>

                        {/* Tabs for different assistance forms */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mb-4 bg-white p-2 rounded-xl shadow-sm border">
                                <TabsTrigger value="extended">Assistance Extended</TabsTrigger>
                                <TabsTrigger value="lgu">Assistance Provided to LGUs</TabsTrigger>
                                <TabsTrigger value="families">Assistance Provided to Families</TabsTrigger>
                            </TabsList>

                            <TabsContent value="extended">
                                <AssistanceExtended />
                            </TabsContent>

                            <TabsContent value="lgu">
                                <AssistanceProvidedLgu />
                            </TabsContent>
                        </Tabs>
                    </div>

                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
