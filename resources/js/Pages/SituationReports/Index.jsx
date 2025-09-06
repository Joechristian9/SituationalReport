// resources/js/Pages/SituationReports/Index.jsx

import { useEffect } from "react";
import { usePage, Head } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";

// Layout and Reusable Components
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The form is the only main component on this page now
import WeatherForm from "@/Components/SituationOverview/WeatherForm";

export default function Index() {
    // We still need the 'flash' prop to show success/error messages after submitting the form.
    const { flash } = usePage().props;

    // This effect listens for the flash message after a form submission and shows a toast.
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Create Situational Report" }, // Updated breadcrumb for clarity
    ];

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Create Situational Report" />{" "}
            {/* Updated title for clarity */}
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
