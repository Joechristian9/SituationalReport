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
import { Loader2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AssistanceProvidedLgu() {
    const { flash } = usePage().props;

    // ✅ Form State
    const { data, setData, post, processing, errors } = useForm({
        assistances: [
            {
                id: Date.now(),
                province: "",
                city: "",
                barangay: "",
                familiesAffected: "",
                familiesAssisted: "",
                clusterType: "",
                quantity: "",
                unit: "",
                costPerUnit: "",
                amount: "",
                source: "",
                remarks: "",
            },
        ],
    });

    // ✅ Restore saved form from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("assistanceProvidedLgu");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved AssistanceProvidedLgu", e);
            }
        }
    }, []);

    // ✅ Save form state to localStorage
    useEffect(() => {
        localStorage.setItem("assistanceProvidedLgu", JSON.stringify(data));
    }, [data]);

    // ✅ Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Assistance to LGUs & Regional Agencies" },
    ];

    // ✅ Add Row
    const addRow = () => {
        setData("assistances", [
            ...data.assistances,
            {
                id: Date.now(),
                province: "",
                city: "",
                barangay: "",
                familiesAffected: "",
                familiesAssisted: "",
                clusterType: "",
                quantity: "",
                unit: "",
                costPerUnit: "",
                amount: "",
                source: "",
                remarks: "",
            },
        ]);
    };

    // ✅ Input Change
    const handleChange = (id, field, value) => {
        setData(
            "assistances",
            data.assistances.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    // ✅ Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("assistance-provided-lgus.store"), { preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />

            <SidebarInset>


                <main >
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-lg rounded-2xl border">
                            <CardHeader>
                                <CardTitle>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Assistance Provided to LGUs & Regional Agencies
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Record details of assistance distributed.
                                    </p>
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <motion.div
                                    key="assistance-provided"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                                                <tr className="text-left text-white font-semibold">
                                                    <th className="p-3 border-r">Province</th>
                                                    <th className="p-3 border-r">City/Community</th>
                                                    <th className="p-3 border-r">Barangay</th>
                                                    <th className="p-3 border-r">Families Affected</th>
                                                    <th className="p-3 border-r">Families Assisted</th>
                                                    <th className="p-3 border-r">Cluster Type</th>
                                                    <th className="p-3 border-r">Quantity</th>
                                                    <th className="p-3 border-r">Unit</th>
                                                    <th className="p-3 border-r">Cost/Unit</th>
                                                    <th className="p-3 border-r">Amount</th>
                                                    <th className="p-3 border-r">Source</th>
                                                    <th className="p-3">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.assistances.map((row) => (
                                                    <tr
                                                        key={row.id}
                                                        className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                                    >
                                                        {[
                                                            "province",
                                                            "city",
                                                            "barangay",
                                                            "familiesAffected",
                                                            "familiesAssisted",
                                                            "clusterType",
                                                            "quantity",
                                                            "unit",
                                                            "costPerUnit",
                                                            "amount",
                                                            "source",
                                                            "remarks",
                                                        ].map((field) => (
                                                            <td
                                                                key={field}
                                                                className="p-3 border-r"
                                                            >
                                                                <input
                                                                    type={
                                                                        field.includes("families") ||
                                                                            field === "quantity" ||
                                                                            field === "costPerUnit" ||
                                                                            field === "amount"
                                                                            ? "number"
                                                                            : "text"
                                                                    }
                                                                    value={row[field]}
                                                                    onChange={(e) =>
                                                                        handleChange(
                                                                            row.id,
                                                                            field,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder={`Enter ${field}`}
                                                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {errors.assistances && (
                                            <div className="text-red-500 text-sm mt-2 px-2">
                                                {errors.assistances}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Row */}
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
                                        "Save Assistance"
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
