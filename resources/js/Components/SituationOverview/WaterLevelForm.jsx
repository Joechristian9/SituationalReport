// resources/js/Components/SituationOverview/WaterLevelForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function WaterLevelForm({ data, setData, errors }) {
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newLevels = [...data.waterLevels];
        newLevels[index][name] = value;
        setData("waterLevels", newLevels);
    };

    const handleAddRow = () => {
        setData("waterLevels", [
            ...data.waterLevels,
            {
                id: data.waterLevels.length + 1,
                gauging_station: "",
                current_level: "",
                alarm_level: "",
                critical_level: "",
                affected_areas: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Water Level Monitoring
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter river/stream gauging station levels and affected
                    areas.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Gauging Station</th>
                            <th className="p-3">Current Level (m)</th>
                            <th className="p-3">Alarm Level (m)</th>
                            <th className="p-3">Critical Level (m)</th>
                            <th className="p-3">Affected Areas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.waterLevels.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="gauging_station"
                                        value={row.gauging_station}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Enter station name"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="current_level"
                                        type="number"
                                        step="0.01"
                                        value={row.current_level}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="0.00"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="alarm_level"
                                        type="number"
                                        step="0.01"
                                        value={row.alarm_level}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="0.00"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="critical_level"
                                        type="number"
                                        step="0.01"
                                        value={row.critical_level}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="0.00"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="affected_areas"
                                        value={row.affected_areas}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Barangays / Areas"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.waterLevels && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.waterLevels}
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
