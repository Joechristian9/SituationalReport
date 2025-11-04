import { useEffect } from "react";
import { usePage, useForm } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { Loader2, PlusCircle, Building2 } from "lucide-react";
import AddRowButton from "@/Components/ui/AddRowButton";

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

    // Submit handler
    const handleSubmit = () => {
        post(route("assistance-provided-lgus.store"), { 
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Assistance records saved successfully!");
            },
            onError: () => {
                toast.error("Failed to save assistance records.");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Building2 size={24} />
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                        Assistance Provided to LGUs & Regional Agencies
                    </h3>
                    <p className="text-sm text-slate-500">
                        Record details of assistance distributed.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="md:overflow-x-auto md:rounded-lg md:border md:border-slate-200">
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
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.assistances}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <AddRowButton
                        onClick={addRow}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                        <PlusCircle size={16} /> Add Row
                    </AddRowButton>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                    {processing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        "Save Assistance"
                    )}
                </button>
            </div>
        </div>
    );
}
