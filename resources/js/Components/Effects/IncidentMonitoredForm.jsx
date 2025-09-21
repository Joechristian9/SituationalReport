import React from "react";
// ✅ 1. Changed icon for better thematic consistency
import { AlertTriangle } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function IncidentMonitoredForm({ data, setData, errors }) {
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
            <div className="flex items-center gap-3">
                {/* ✅ 2. Changed header icon theme from red to blue */}
                <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Incidents Monitored
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Record details of incidents being monitored.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-left text-white font-semibold ">
                            <th className="p-3 border-r">Kinds of Incident</th>
                            <th className="p-3 border-r">
                                Date & Time of Occurrence
                            </th>
                            <th className="p-3 border-r">Location</th>
                            <th className="p-3 border-r">Description</th>
                            <th className="p-3 border-r">Remarks</th>
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
                                        // ✅ 3. ADOPTED: Consistent input styling
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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
                                        // ✅ 3. ADOPTED: Consistent input styling
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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
                                        // ✅ 3. ADOPTED: Consistent input styling
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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
                                        rows="1" // A single row is often enough for a table textarea
                                        // ✅ 3. ADOPTED: Consistent input styling
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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
                                        // ✅ 3. ADOPTED: Consistent input styling
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
