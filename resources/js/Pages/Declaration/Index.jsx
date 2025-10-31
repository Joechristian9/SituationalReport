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
import { motion } from "framer-motion";

// ✅ Import Declaration USC Form
import DeclarationUSCForm from "@/Components/Declaration/DeclarationUSCForm";

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
                    <Card className="shadow-lg rounded-2xl border">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        Declaration under State of Calamity
                                        (USC)
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Record details of declarations under
                                        a state of calamity.
                                    </p>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <motion.div
                                key="usc-declarations"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <DeclarationUSCForm
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                />
                            </motion.div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
