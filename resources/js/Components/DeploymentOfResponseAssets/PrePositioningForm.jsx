// resources/js/Components/DeploymentOfResponseAssets/PrePositioning/PrePositioningForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function PrePositioningForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const rows = data?.pre_positionings ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...rows];
        newRows[index][name] = value;
        setData("pre_positionings", newRows);
    };

    const handleAddRow = () => {
        setData("pre_positionings", [
            ...rows,
            {
                id: rows.length + 1,
                team_units: "",
                team_leader: "",
                personnel_deployed: "",
                response_assets: "",
                capability: "",
                area_of_deployment: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Pre-Positioning of Response Assets
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Record teams, units, and assets deployed in the field.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Team/Units</th>
                            <th className="p-3">Team Leader</th>
                            <th className="p-3">No. Personnel Deployed</th>
                            <th className="p-3">Response Assets</th>
                            <th className="p-3">Capability</th>
                            <th className="p-3">Area of Deployment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="team_units"
                                        value={row.team_units}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g., Rescue Team 1"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="team_leader"
                                        value={row.team_leader}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Team Leader Name"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0"
                                        name="personnel_deployed"
                                        value={row.personnel_deployed}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="0"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="response_assets"
                                        value={row.response_assets}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g., Ambulance, Boat"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="capability"
                                        value={row.capability}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g., Search & Rescue"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="area_of_deployment"
                                        value={row.area_of_deployment}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="e.g., Barangay A"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.pre_positionings && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.pre_positionings}
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
