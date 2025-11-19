import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import TyphoonStatusAlert from "@/Components/TyphoonStatusAlert";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";
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
    const page = usePage();
    const { flash, initialReports, typhoon } = page.props;
    const user = page.props.auth.user;
    const isAdmin = user.roles?.some(
        (r) => r.name?.toLowerCase() === "admin"
    );
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';

    // Barangay filter state for admin view
    const [selectedBarangay, setSelectedBarangay] = useState("ALL");

    const barangayOptions = useMemo(() => {
        if (!initialReports || initialReports.length === 0) return [];

        const names = initialReports
            .map((r) => r.barangay)
            .filter((name) => !!name && typeof name === "string");

        const unique = Array.from(new Set(names)).sort((a, b) =>
            a.localeCompare(b)
        );

        return unique;
    }, [initialReports]);

    const filteredReports = useMemo(() => {
        if (!initialReports || initialReports.length === 0) return [];

        if (!selectedBarangay || selectedBarangay === "ALL") {
            return initialReports;
        }

        return initialReports.filter(
            (r) => r.barangay === selectedBarangay
        );
    }, [initialReports, selectedBarangay]);

    // ✅ Form State - Load from database or use empty row
    const { data, setData, post, processing, errors } = useForm({
        reports:
            initialReports && initialReports.length > 0
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

                        {isAdmin ? (
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
                        )}
                    </div>
                    <ActiveTyphoonHeader 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
                </header>

                <main className="w-full p-6 h-full bg-gray-50">

                    {isAdmin ? (
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Barangay Pre-Emptive Reports
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        Filter by Barangay:
                                    </span>
                                    <select
                                        value={selectedBarangay}
                                        onChange={(e) =>
                                            setSelectedBarangay(e.target.value)
                                        }
                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
                                    >
                                        <option value="ALL">All Barangays</option>
                                        {barangayOptions.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-blue-500 text-white">
                                        <tr>
                                            <th className="px-3 py-2 text-left">
                                                Barangay
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Evacuation Center
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Families
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Persons
                                            </th>
                                            <th className="px-3 py-2 text-left">
                                                Outside Center
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Outside Families
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Outside Persons
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Total Families
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Total Persons
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReports.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="px-4 py-4 text-center text-gray-500"
                                                >
                                                    No reports found for the
                                                    selected barangay.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredReports.map((report) => (
                                                <tr
                                                    key={report.id}
                                                    className="border-t last:border-b-0"
                                                >
                                                    <td className="px-3 py-2">
                                                        {report.barangay || "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {report.evacuation_center ||
                                                            "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.families ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.persons ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {report.outside_center || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.outside_families ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.outside_persons ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.total_families ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {report.total_persons ?? "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
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
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
