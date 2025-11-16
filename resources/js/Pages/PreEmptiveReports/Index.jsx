import { useEffect, lazy, Suspense } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import TyphoonStatusAlert from "@/Components/TyphoonStatusAlert";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Loader2 } from "lucide-react";

// Lazy load form for better performance
const PreEmptiveForm = lazy(() => import("@/Components/PreEmptiveEvacuation/PreEmptiveForm"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

export default function Index() {
    const { flash, initialReports, typhoon } = usePage().props;
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';

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

    // ✅ Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('pre-emptive-reports.store'), {
            preserveScroll: true,
        });
    };

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
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />

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
                    {/* Typhoon Status Alert */}
                    <TyphoonStatusAlert 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                        formsDisabled={formsDisabled}
                    />
                    
                    <Suspense fallback={<FormLoader />}>
                        <PreEmptiveForm
                            disabled={formsDisabled}
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={handleSubmit}
                        />
                    </Suspense>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
