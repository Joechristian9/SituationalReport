import { useEffect } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import AddRowButton from "@/Components/ui/AddRowButton";

export default function AssistanceExtended() {
    const { flash } = usePage().props;

    // Form state
    const { data, setData, post, processing, errors } = useForm({
        assistances: [
            {
                id: Date.now(),
                agency_officials_groups: "",
                type_kind_of_assistance: "",
                amount: "",
                beneficiaries: "",
            },
        ],
    });

    // Restore saved form from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("assistanceExtendeds");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved Assistance Extendeds", e);
            }
        }
    }, []);

    // Save form state to localStorage
    useEffect(() => {
        localStorage.setItem("assistanceExtendeds", JSON.stringify(data));
    }, [data]);

    // Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const addRow = () => {
        setData("assistances", [
            ...data.assistances,
            {
                id: Date.now(),
                agency_officials_groups: "",
                type_kind_of_assistance: "",
                amount: "",
                beneficiaries: "",
            },
        ]);
    };

    const handleChange = (id, field, value) => {
        setData(
            "assistances",
            data.assistances.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("assistance-extendeds.store"), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Assistance Extended" />
            <Toaster position="top-right" />
            <main className="w-full p-6 h-full bg-gray-50">
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-lg rounded-2xl border">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        Assistance Extended
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Record details of assistance
                                        provided.
                                    </p>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <motion.div
                                key="assistance-extended"
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
                                                        Agency / Officials
                                                        Groups
                                                    </th>
                                                    <th className="p-3 border-r">
                                                        Type / Kind of
                                                        Assistance
                                                    </th>
                                                    <th className="p-3 border-r">
                                                        Amount
                                                    </th>
                                                    <th className="p-3 border-r">
                                                        Beneficiaries
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.assistances.map(
                                                    (row) => (
                                                        <tr
                                                            key={row.id}
                                                            className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                                        >
                                                            <td className="p-3 border-r">
                                                                <input
                                                                    type="text"
                                                                    name="agency_officials_groups"
                                                                    value={
                                                                        row.agency_officials_groups
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleChange(
                                                                            row.id,
                                                                            "agency_officials_groups",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Enter agency/officials"
                                                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-3 border-r">
                                                                <input
                                                                    type="text"
                                                                    name="type_kind_of_assistance"
                                                                    value={
                                                                        row.type_kind_of_assistance
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleChange(
                                                                            row.id,
                                                                            "type_kind_of_assistance",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Enter type of assistance"
                                                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-3 border-r">
                                                                <input
                                                                    type="number"
                                                                    name="amount"
                                                                    value={
                                                                        row.amount
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleChange(
                                                                            row.id,
                                                                            "amount",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-3 border-r">
                                                                <input
                                                                    type="text"
                                                                    name="beneficiaries"
                                                                    value={
                                                                        row.beneficiaries
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleChange(
                                                                            row.id,
                                                                            "beneficiaries",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Enter beneficiaries"
                                                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>

                                        {errors.assistances && (
                                            <div className="text-red-500 text-sm mt-2 px-2">
                                                {errors.assistances}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Add Row Button */}
                                <div className="flex justify-start mt-4">
                                    <AddRowButton
                                        onClick={addRow}
                                        label="Add Row"
                                    />
                                </div>
                            </motion.div>
                        </CardContent>

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
        </>
    );
}
