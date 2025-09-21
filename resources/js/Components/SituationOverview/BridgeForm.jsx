// resources/js/Components/SituationOverview/BridgeForm.jsx
import React from "react";
import { Plus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function BridgeForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const bridges = data?.bridges ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...bridges];
        newRows[index][name] = value;
        setData("bridges", newRows);
    };

    const handleAddRow = () => {
        setData("bridges", [
            ...bridges,
            {
                id: bridges.length + 1,
                road_classification: "",
                name_of_bridge: "",
                status: "",
                areas_affected: "",
                re_routing: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Bridges / Overflow Bridges
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter the condition and accessibility of bridges.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Road Classification</th>
                            <th className="p-3">Name of Bridge</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Areas/Barangays Affected</th>
                            <th className="p-3">Re-routing</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bridges.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <select
                                        name="road_classification"
                                        value={row.road_classification}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="National Road">
                                            National Road
                                        </option>
                                        <option value="Provincial Road">
                                            Provincial Road
                                        </option>
                                        <option value="Municipality Road">
                                            Municipality Road
                                        </option>
                                        <option value="Barangay Road">
                                            Barangay Road
                                        </option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        name="name_of_bridge"
                                        value={row.name_of_bridge}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Bridge name"
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
                                        <option value="passable">
                                            Passable
                                        </option>
                                        <option value="not_passable">
                                            Not Passable
                                        </option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        name="areas_affected"
                                        value={row.areas_affected}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Affected areas"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="re_routing"
                                        value={row.re_routing}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Re-routing details"
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
                                        placeholder="Additional remarks"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.bridges && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.bridges}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
