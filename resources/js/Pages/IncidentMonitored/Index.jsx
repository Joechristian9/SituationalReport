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
import { motion } from "framer-motion";

// ✅ Import IncidentMonitoredForm
import IncidentMonitoredForm from "@/Components/Effects/IncidentMonitoredForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Form State
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
    });

    // ✅ Restore saved form from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("incidentMonitored");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved IncidentMonitored", e);
            }
        }
    }, []);

    // ✅ Save form state to localStorage
    useEffect(() => {
        localStorage.setItem("incidentMonitored", JSON.stringify(data));
    }, [data]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Incidents Monitored" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("incident-monitored.store"), { preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Incidents Monitored" />
            <SidebarInset>
                {/* ✅ Header with breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                <main className="w-full p-6 bg-gray-100">
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Incidents Monitored</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <motion.div
                                    key="incidents"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <IncidentMonitoredForm
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                    />
                                </motion.div>
                            </CardContent>

                            {/* ✅ Save Button */}
                            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-2xl">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {processing
                                        ? "Saving..."
                                        : "Save Incidents"}
                                </Button>
                            </div>
                        </Card>
                    </form>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
