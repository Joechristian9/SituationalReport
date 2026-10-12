import { useEffect, lazy, Suspense } from "react";
import FormPanel from "@/Components/forms/FormPanel";
import { usePage, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import TyphoonStatusAlert from "@/Components/DisasterStatusAlert";
import ActiveTyphoonHeader from "@/Components/ActiveDisasterHeader";
import AppLayout from "@/Layouts/AppLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Loader2 } from "lucide-react";

// Lazy load form for better performance
const PrePositioningForm = lazy(() => import("@/Components/DeploymentOfResponseAssets/PrePositioningForm"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-label="Loading form" />
    </div>
);

export default function Index() {
    const { flash, pre_positionings, typhoon, auth } = usePage().props;
    const isAdmin = auth.user.roles?.some((r) => r.name?.toLowerCase() === "admin");
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';

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
        <AppLayout
            title="Deployment of Response"
            header={
                <Breadcrumbs
                    crumbs={[
                        ...(isAdmin ? [{ href: route("dashboard"), label: "Dashboard" }] : []),
                        { label: "Pre-Positioning" },
                    ]}
                />
            }
            actions={
                <ActiveTyphoonHeader
                    typhoon={typhoon?.active}
                    hasActive={typhoon?.hasActive}
                />
            }
        >
            <Toaster position="top-right" />

                <main className="h-full w-full bg-background p-4 sm:p-6">
                    <FormPanel>
                        <Suspense fallback={<FormLoader />}>
                            <PrePositioningForm
                                data={data}
                                setData={setData}
                                errors={errors}
                                disabled={formsDisabled}
                            />
                        </Suspense>
                    </FormPanel>
                </main>
        </AppLayout>
    );
}
