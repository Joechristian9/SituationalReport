// resources/js/Components/SituationOverview/ElectricityForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function ElectricityForm({ data, setData, errors }) {
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newServices = [...data.electricityServices];
        newServices[index][name] = value;
        setData("electricityServices", newServices);
    };

    const handleAddRow = () => {
        setData("electricityServices", [
            ...data.electricityServices,
            {
                id: data.electricityServices.length + 1,
                status: "",
                barangays_affected: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    ⚡ Electricity Services Monitoring
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter the status of electricity services, affected
                    barangays, and remarks.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">
                                Status of Electricity Services
                            </th>
                            <th className="p-3">Barangays Affected</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.electricityServices.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="status"
                                        value={row.status}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Operational / Partial / Outage"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="barangays_affected"
                                        value={row.barangays_affected}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="List affected barangays"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="remarks"
                                        value={row.remarks}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Additional notes"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.electricityServices && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.electricityServices}
                    </div>
                )}
            </div>

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
