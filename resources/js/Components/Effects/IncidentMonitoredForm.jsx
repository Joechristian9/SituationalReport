// resources/js/Components/Effects/IncidentMonitoredForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function IncidentMonitoredForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const incidents = data?.incidents ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...incidents];
        newRows[index][name] = value;
        setData("incidents", newRows);
    };

    const handleAddRow = () => {
        setData("incidents", [
            ...incidents,
            {
                id: incidents.length + 1,
                kinds_of_incident: "",
                date_time: "",
                location: "",
                description: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Incidents Monitored
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Record details of incidents being monitored.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-red-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Kinds of Incident</th>
                            <th className="p-3">Date & Time of Occurrence</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="kinds_of_incident"
                                        value={row.kinds_of_incident}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Type of Incident"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="datetime-local"
                                        name="date_time"
                                        value={row.date_time}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="location"
                                        value={row.location}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Location"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <textarea
                                        name="description"
                                        value={row.description}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Description"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="remarks"
                                        value={row.remarks}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Remarks"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.incidents && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.incidents}
                    </div>
                )}
            </div>

            <div className="flex items-center">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                    <Plus size={18} className="stroke-[2]" />
                    Add Row
                </button>
            </div>
        </div>
    );
}
