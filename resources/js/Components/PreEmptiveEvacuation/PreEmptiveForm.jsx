import React from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreEmptiveForm({ data, setData, errors }) {
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;

        // Auto-calculate totals
        const famInside = parseInt(newReports[index].families || 0);
        const personsInside = parseInt(newReports[index].persons || 0);
        const famOutside = parseInt(newReports[index].outside_families || 0);
        const personsOutside = parseInt(newReports[index].outside_persons || 0);

        newReports[index].total_families = famInside + famOutside;
        newReports[index].total_persons = personsInside + personsOutside;

        setData("reports", newReports);
    };

    const handleAddRow = () => {
        setData("reports", [
            ...data.reports,
            {
                id: data.reports.length + 1,
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
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Barangay</th>
                            <th className="p-3">Evacuation Center</th>
                            <th className="p-3 text-right">Families</th>
                            <th className="p-3 text-right">Persons</th>
                            <th className="p-3">Outside Center</th>
                            <th className="p-3 text-right">Families</th>
                            <th className="p-3 text-right">Persons</th>
                            <th className="p-3 text-right">Total Families</th>
                            <th className="p-3 text-right">Total Persons</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {data.reports.map((row, index) => (
                                <motion.tr
                                    key={row.id}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/60 transition-colors"
                                >
                                    <td className="p-2">
                                        <input
                                            name="barangay"
                                            value={row.barangay}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="Enter barangay"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            name="evacuation_center"
                                            value={row.evacuation_center}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="Evacuation center"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            name="families"
                                            value={row.families}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            name="persons"
                                            value={row.persons}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            name="outside_center"
                                            value={row.outside_center}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="Outside center"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            name="outside_families"
                                            value={row.outside_families}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            name="outside_persons"
                                            value={row.outside_persons}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-semibold text-blue-700">
                                        {row.total_families}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-blue-700">
                                        {row.total_persons}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                    {/* Table Footer */}
                    <tfoot className="bg-gray-100 font-bold text-gray-800">
                        <tr>
                            <td className="p-2 text-center" colSpan={2}>
                                Grand Total
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2"></td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-600">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum +
                                        parseInt(row.outside_persons || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_families || 0),
                                    0
                                )}
                            </td>
                            <td className="p-2 text-right text-blue-800">
                                {data.reports.reduce(
                                    (sum, row) =>
                                        sum + parseInt(row.total_persons || 0),
                                    0
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                {errors.reports && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.reports}
                    </div>
                )}
            </div>

            {/* Add Row Button */}
            <div className="flex items-center">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                    <Plus size={18} className="stroke-[2]" />
                    Add Row
                </button>
            </div>
        </div>
    );
}
