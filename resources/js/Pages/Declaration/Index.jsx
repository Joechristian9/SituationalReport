import { useEffect, lazy, Suspense } from "react";
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
import { Loader2 } from "lucide-react";

// Lazy load form for better performance
const DeclarationUSCForm = lazy(() => import("@/Components/Declaration/DeclarationUSCForm"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

export default function Index() {
    const { flash, declarations } = usePage().props;

    // ✅ Form State - Initialize with declarations from database
    const { data, setData, errors } = useForm({
        usc_declarations: declarations && declarations.length > 0 
            ? declarations 
            : [
                {
                    id: `new-${Date.now()}`,
                    declared_by: "",
                    resolution_number: "",
                    date_approved: "",
                },
            ],
    });

    // ✅ Update form data when declarations from backend change
    useEffect(() => {
        if (declarations && declarations.length > 0) {
            setData('usc_declarations', declarations);
        }
    }, [declarations]);

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
                <title>USC Declaration</title>
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
                                        { label: "USC Declarations" },
                                    ]}
                                    USC
                                    Declarations
                                />
                            ) : (
                                <Breadcrumbs
                                    crumbs={[{ label: "USC Declarations" }]}
                                />
                            );
                        })()}
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <Suspense fallback={<FormLoader />}>
                        <DeclarationUSCForm
                            data={data}
                            setData={setData}
                            errors={errors}
                        />
                    </Suspense>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
