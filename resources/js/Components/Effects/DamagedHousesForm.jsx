import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import AddRowButton from "../ui/AddRowButton"; // Assuming this component exists
import { LiaHouseDamageSolid } from "react-icons/lia";

export default function DamagedHousesForm({ data, setData, errors }) {
    // ✅ FIX: Use the correct key 'damaged_houses' and provide a fallback empty array
    const reports = data?.damaged_houses ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...reports]; // Use the safe 'reports' variable
        newReports[index][name] = value;

        const partially = parseInt(newReports[index].partially || 0);
        const totally = parseInt(newReports[index].totally || 0);
        newReports[index].total = partially + totally;

        setData("damaged_houses", newReports);
    };

    const handleAddRow = () => {
        // ✅ FIX: Update the state using the correct key
        setData("damaged_houses", [
            ...reports,
            {
                id: reports.length + 1,
                barangay: "",
                partially: "",
                totally: "",
                total: 0,
            },
        ]);
    };

    // Calculations will now work because 'reports' is a safe, guaranteed array
    const grandTotalPartially = reports.reduce(
        (sum, row) => sum + parseInt(row.partially || 0),
        0
    );
    const grandTotalTotally = reports.reduce(
        (sum, row) => sum + parseInt(row.totally || 0),
        0
    );
    const grandTotal = reports.reduce(
        (sum, row) => sum + parseInt(row.total || 0),
        0
    );

    return (
        <div className="space-y-4 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                    <LiaHouseDamageSolid className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Damaged Houses
                    </h3>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3 border-r border-blue-400">
                                Barangay
                            </th>
                            <th className="p-3 text-right border-r border-blue-400">
                                Partially
                            </th>
                            <th className="p-3 text-right border-r border-blue-400">
                                Totally
                            </th>
                            <th className="p-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {/* The .map() method is also safe now */}
                            {reports.map((row, index) => (
                                <motion.tr
                                    key={row.id || index}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/60 transition-colors"
                                >
                                    <td className="p-2 border-r">
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
                                    <td className="p-2 border-r">
                                        <input
                                            type="number"
                                            name="partially"
                                            value={row.partially}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-2 border-r">
                                        <input
                                            type="number"
                                            name="totally"
                                            value={row.totally}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="0"
                                            className="w-full px-3 py-2 border rounded-lg shadow-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-gray-800 bg-gray-100/60">
                                        {row.total}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                    {/* Table Footer */}
                    <tfoot className="bg-gray-100 font-bold text-gray-800">
                        <tr>
                            <td className="p-3 text-left">TOTAL</td>
                            <td className="p-3 text-right text-blue-700">
                                {grandTotalPartially}
                            </td>
                            <td className="p-3 text-right text-blue-700">
                                {grandTotalTotally}
                            </td>
                            <td className="p-3 text-right text-blue-800">
                                {grandTotal}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                {/* Error display for this specific form slice */}
                {errors.damaged_houses && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.damaged_houses}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Barangay Row" />
        </div>
    );
}
