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
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Form State
    const { data, setData, post, processing, errors } = useForm({
        responses: [
            {
                id: Date.now(),
                team_unit: "",
                incident: "",
                datetime: "",
                location: "",
                actions: "",
                remarks: "",
            },
        ],
    });

    // ✅ Restore saved form from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("responseOperations");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved Response Operations", e);
            }
        }
    }, []);

    // ✅ Save form state to localStorage
    useEffect(() => {
        localStorage.setItem("responseOperations", JSON.stringify(data));
    }, [data]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Response Operations" },
    ];

    // ✅ Handle Row Add
    const addRow = () => {
        setData("responses", [
            ...data.responses,
            {
                id: Date.now(),
                team_unit: "",
                incident: "",
                datetime: "",
                location: "",
                actions: "",
                remarks: "",
            },
        ]);
    };

    // ✅ Handle Input Change
    const handleChange = (id, field, value) => {
        setData(
            "responses",
            data.responses.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    // ✅ Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("response-operations.store"), { preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head>
                <title>Response Operations</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                {/* ✅ Header with breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            Response Operations
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Record details of emergency response
                                            operations.
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <motion.div
                                    key="response-operations"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                                                    <tr className="text-left text-white font-semibold">
                                                        <th className="p-3 border-r">
                                                            Team/Unit
                                                        </th>
                                                        <th className="p-3 border-r">
                                                            Incident Responded
                                                        </th>
                                                        <th className="p-3 border-r">
                                                            Time & Date
                                                        </th>
                                                        <th className="p-3 border-r">
                                                            Location
                                                        </th>
                                                        <th className="p-3 border-r">
                                                            Actions Taken
                                                        </th>
                                                        <th className="p-3 border-r">
                                                            Remarks
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.responses.map(
                                                        (row) => (
                                                            <tr
                                                                key={row.id}
                                                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                                            >
                                                                <td className="p-3 border-r">
                                                                    <input
                                                                        type="text"
                                                                        name="team_unit"
                                                                        value={
                                                                            row.team_unit
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "team_unit",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Enter team/unit"
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 border-r">
                                                                    <input
                                                                        type="text"
                                                                        name="incident"
                                                                        value={
                                                                            row.incident
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "incident",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Enter incident responded"
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 border-r">
                                                                    <input
                                                                        type="datetime-local"
                                                                        name="datetime"
                                                                        value={
                                                                            row.datetime
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "datetime",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 border-r">
                                                                    <input
                                                                        type="text"
                                                                        name="location"
                                                                        value={
                                                                            row.location
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "location",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Enter location"
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 border-r">
                                                                    <textarea
                                                                        name="actions"
                                                                        rows={1}
                                                                        value={
                                                                            row.actions
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "actions",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Describe actions taken"
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                                                    />
                                                                </td>
                                                                <td className="p-3 border-r">
                                                                    <textarea
                                                                        name="remarks"
                                                                        rows={1}
                                                                        value={
                                                                            row.remarks
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                row.id,
                                                                                "remarks",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Additional remarks"
                                                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>

                                            {errors.responses && (
                                                <div className="text-red-500 text-sm mt-2 px-2">
                                                    {errors.responses}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Row Button */}
                                    <div className="flex justify-start mt-4">
                                        <Button
                                            type="button"
                                            onClick={addRow}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Add Row
                                        </Button>
                                    </div>
                                </motion.div>
                            </CardContent>

                            {/* ✅ Save Button */}
                            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-2xl">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="relative flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                                            <span className="animate-pulse">
                                                Saving...
                                            </span>
                                        </>
                                    ) : (
                                        "Save Operations"
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </form>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
