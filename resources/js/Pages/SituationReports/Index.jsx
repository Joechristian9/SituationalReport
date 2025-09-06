// resources/js/Pages/SituationReports/Index.jsx
import { useEffect } from "react";
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

import WeatherForm from "@/Components/SituationOverview/WeatherForm";
import WaterLevelForm from "@/Components/SituationOverview/WaterLevelForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Combined useForm
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
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Create Situational Report" },
    ];

    // ✅ Single submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("situation-reports.store"), {
            preserveScroll: true,
        });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Create Situational Report" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                <main className="w-full p-6">
                    {/* The form to add a new report is the only component here */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Weather Report!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WeatherForm />
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
