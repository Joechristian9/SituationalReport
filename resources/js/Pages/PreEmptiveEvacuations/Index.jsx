// resources/js/Pages/PreEmptiveEvacuations/Index.jsx
import React, { useEffect, useState } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import { Plus, Minus } from "lucide-react";

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

import PreEmptiveEvacuationForm from "@/Components/PreEmptiveReport/PreEmptiveEvacuationForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ form state
    const { data, setData, post, processing, errors } = useForm({
        reports: [
            {
                id: 1,
                municipality: "",
                barangay: "",
                evacuated_families: "",
                evacuated_individuals: "",
                reason: "",
            },
        ],
    });

    // ✅ flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Pre-Emptive Evacuation Reports" },
    ];

    // ✅ submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("preemptive-evacuations.store"), {
            preserveScroll: true,
        });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Pre-Emptive Evacuations" />

            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                <main className="w-full p-6">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Pre-Emptive Evacuation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <PreEmptiveEvacuationForm
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {processing
                                    ? "Saving..."
                                    : "Save Evacuation Report"}
                            </Button>
                        </div>
                    </form>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
