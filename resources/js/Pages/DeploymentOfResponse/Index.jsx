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

// ✅ Import PrePositioning Form
import PrePositioningForm from "@/Components/DeploymentOfResponseAssets/PrePositioningForm";

export default function Index() {
    const { flash, pre_positionings } = usePage().props;

    // ✅ Form State - Initialize with data from database
    const { data, setData, errors } = useForm({
        pre_positionings: pre_positionings && pre_positionings.length > 0
            ? pre_positionings
            : [
                {
                    id: `new-${Date.now()}`,
                    team_units: "",
                    team_leader: "",
                    personnel_deployed: "",
                    response_assets: "",
                    capability: "",
                    area_of_deployment: "",
                },
            ],
    });

    // ✅ Update form data when data from backend changes
    useEffect(() => {
        if (pre_positionings && pre_positionings.length > 0) {
            setData('pre_positionings', pre_positionings);
        }
    }, [pre_positionings]);

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
                <title>Deployment of Response</title>
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
                                        { label: "Pre-Positioning" },
                                    ]}
                                    Pre-Positioning
                                />
                            ) : (
                                <Breadcrumbs
                                    crumbs={[{ label: "Pre-Positioning" }]}
                                />
                            );
                        })()}
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <PrePositioningForm
                        data={data}
                        setData={setData}
                        errors={errors}
                    />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
