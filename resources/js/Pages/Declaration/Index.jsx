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
const DeclarationUSCForm = lazy(() => import("@/Components/Declaration/DeclarationUSCForm"));

const FormLoader = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-label="Loading form" />
    </div>
);

export default function Index() {
    const { flash, declarations, typhoon, auth } = usePage().props;
    const isAdmin = auth.user.roles?.some((r) => r.name?.toLowerCase() === "admin");
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';

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
        <AppLayout
            title="USC Declaration"
            header={
                <Breadcrumbs
                    crumbs={[
                        ...(isAdmin ? [{ href: route("admin.dashboard"), label: "Dashboard" }] : []),
                        { label: "USC Declarations" },
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
                            <DeclarationUSCForm
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
