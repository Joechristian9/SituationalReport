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

    // ✅ Handle Row Delete
    const removeRow = (id) => {
        setData(
            "responses",
            data.responses.filter((row) => row.id !== id)
        );
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border">
                                            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                                <tr>
                                                    <th className="px-3 py-2 border">
                                                        Team/Unit
                                                    </th>
                                                    <th className="px-3 py-2 border">
                                                        Incident Responded
                                                    </th>
                                                    <th className="px-3 py-2 border">
                                                        Time & Date
                                                    </th>
                                                    <th className="px-3 py-2 border">
                                                        Location
                                                    </th>
                                                    <th className="px-3 py-2 border">
                                                        Actions Taken
                                                    </th>
                                                    <th className="px-3 py-2 border">
                                                        Remarks
                                                    </th>
                                                    <th className="px-3 py-2 border text-center">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.responses.map((row) => (
                                                    <tr key={row.id}>
                                                        <td className="px-3 py-2 border">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    row.team_unit
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "team_unit",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    row.incident
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "incident",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border">
                                                            <input
                                                                type="datetime-local"
                                                                value={
                                                                    row.datetime
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "datetime",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    row.location
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "location",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border">
                                                            <textarea
                                                                value={
                                                                    row.actions
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "actions",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border">
                                                            <textarea
                                                                value={
                                                                    row.remarks
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        row.id,
                                                                        "remarks",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border text-center">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeRow(
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
