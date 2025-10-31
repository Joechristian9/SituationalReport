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

// ✅ Import PreEmptive Form
import PreEmptiveForm from "@/Components/PreEmptiveEvacuation/PreEmptiveForm";

export default function Index() {
    const { flash, initialReports } = usePage().props;

    // ✅ Form State - Load from database or use empty row
    const { data, setData, post, processing, errors } = useForm({
        reports: initialReports && initialReports.length > 0
            ? initialReports
            : [
                {
                    id: `new-${Date.now()}`,
                    barangay: "",
                    evacuation_center: "",
                    families: "",
                    persons: "",
                    outside_center: "",
                    outside_families: "",
                    outside_persons: "",
                    total_families: 0,
                    total_persons: 0,
                },
            ],
    });


    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);


    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Pre-Emptive Report</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                {/* ✅ Header with breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />

                        {(() => {
                            const user = usePage().props.auth.user;
                            const isAdmin = user.roles?.some(
                                (r) => r.name?.toLowerCase() === "admin"
                            );

                            return isAdmin ? (
                                <Breadcrumbs
                                    crumbs={[
                                        {
                                            href: route("admin.dashboard"),
                                            label: "Dashboard",
                                        },
                                        { label: "Pre-Emptive Reports" },
                                    ]}
                                    Pre-Emptive
                                    Reports
                                />
                            ) : (
                                <Breadcrumbs
                                    crumbs={[{ label: "Pre-Emptive Reports" }]}
                                />
                            );
                        })()}
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <PreEmptiveForm
                        data={data}
                        setData={setData}
                        errors={errors}
                    />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
