// resources/js/Components/SituationOverview/WaterForm.jsx
import React from "react";
import { Plus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function WaterForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const waterServices = data?.waterServices ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...waterServices];
        newRows[index][name] = value;
        setData("waterServices", newRows);
    };

    const handleAddRow = () => {
        setData("waterServices", [
            ...waterServices,
            {
                id: waterServices.length + 1,
                source_of_water: "",
                barangays_served: "",
                status: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Water Services
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter details of available water sources and services.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Source of Water</th>
                            <th className="p-3">Barangays Served</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {waterServices.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="source_of_water"
                                        value={row.source_of_water}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g. Deep Well"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="barangays_served"
                                        value={row.barangays_served}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Barangays served"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <select
                                        name="status"
                                        value={row.status}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="functional">
                                            Functional
                                        </option>
                                        <option value="available">
                                            Available
                                        </option>
                                        <option value="not available">
                                            Not Available
                                        </option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        name="remarks"
                                        value={row.remarks}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Additional remarks"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.waterServices && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.waterServices}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
