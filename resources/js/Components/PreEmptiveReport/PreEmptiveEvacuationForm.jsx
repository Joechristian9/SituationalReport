import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { usePage } from "@inertiajs/react";

export default function PreEmptiveEvacuationForm({ data, setData, errors }) {
    const { auth } = usePage().props;

    // ✅ Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("situationReports");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData(parsed);
            } catch (e) {
                console.error("Failed to parse saved reports", e);
            }
        }
    }, []);

    // ✅ Save data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("situationReports", JSON.stringify(data));
    }, [data]);

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;

        // ✅ update "updated_by" every time user edits
        newReports[index].updated_by = auth.user.id;

        setData("reports", newReports);
    };

    const handleAddRow = () => {
        setData("reports", [
            ...data.reports,
            {
                id: data.reports.length + 1,
                municipality: "",
                barangay: "",
                evacuated_families: "",
                evacuated_individuals: "",
                reason: "",
                user_id: auth.user.id,
                updated_by: auth.user.id,
            },
        ]);
    };

    // ✅ Calculate total by municipality
    const getMunicipalityTotals = () => {
        const totals = {};

        data.reports.forEach((report) => {
            const muni = report.municipality.trim();
            if (!muni) return;

            if (!totals[muni]) {
                totals[muni] = {
                    families: 0,
                    individuals: 0,
                };
            }

            totals[muni].families += Number(report.evacuated_families || 0);
            totals[muni].individuals += Number(
                report.evacuated_individuals || 0
            );
        });

        return totals;
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🏠 Pre-Emptive Evacuation Reports
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter details of evacuated families and individuals. You can
                    add multiple rows if needed.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-left text-gray-700 font-semibold">
                            <th className="p-3">Municipality</th>
                            <th className="p-3">Barangay</th>
                            <th className="p-3">Evacuated Families</th>
                            <th className="p-3">Evacuated Individuals</th>
                            <th className="p-3">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reports.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="municipality"
                                        value={row.municipality}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Enter municipality"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="barangay"
                                        value={row.barangay}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Enter barangay"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        name="evacuated_families"
                                        value={row.evacuated_families}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="No. of families"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        name="evacuated_individuals"
                                        value={row.evacuated_individuals}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="No. of individuals"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="reason"
                                        value={row.reason}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Reason"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.reports && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.reports}
                    </div>
                )}
            </div>

            {/* ✅ Totals by Municipality */}
            <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                    📊 Totals by Municipality
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr className="text-left text-gray-700 font-semibold">
                                <th className="p-3">Municipality</th>
                                <th className="p-3">Total Families</th>
                                <th className="p-3">Total Individuals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(getMunicipalityTotals()).map(
                                ([municipality, totals]) => (
                                    <tr
                                        key={municipality}
                                        className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                    >
                                        <td className="p-3 font-medium text-gray-800">
                                            {municipality}
                                        </td>
                                        <td className="p-3">
                                            {totals.families}
                                        </td>
                                        <td className="p-3">
                                            {totals.individuals}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ✅ Add Row Button */}
            <div className="flex items-center justify-between mt-4">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition"
                >
                    <Plus size={18} />
                    Add Row
                </button>
            </div>
        </div>
    );
}
