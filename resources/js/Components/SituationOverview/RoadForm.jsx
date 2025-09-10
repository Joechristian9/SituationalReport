// resources/js/Components/SituationOverview/RoadForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function RoadForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const roads = data?.roads ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...roads];
        newRows[index][name] = value;
        setData("roads", newRows);
    };

    const handleAddRow = () => {
        setData("roads", [
            ...roads,
            {
                id: roads.length + 1,
                road_classification: "",
                name_of_road: "",
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
                    🛣️ Roads
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter details of roads and their current status.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-left text-gray-700 font-semibold">
                            <th className="p-3">Classification</th>
                            <th className="p-3">Name of Road</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Areas Affected</th>
                            <th className="p-3">Re-routing</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roads.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="road_classification"
                                        value={row.road_classification}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g. National, Provincial"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="name_of_road"
                                        value={row.name_of_road}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Name of road"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="status"
                                        value={row.status}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g. Passable, Not passable"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
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
                                        placeholder="Re-routing info"
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
                {errors.roads && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.roads}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
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
