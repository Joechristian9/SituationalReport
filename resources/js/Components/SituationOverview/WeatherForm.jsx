// resources/js/Components/SituationOverview/WeatherForm.jsx
import React from "react";
import { Plus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function WeatherForm({ data, setData, errors }) {
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;
        setData("reports", newReports);
    };

    const handleAddRow = () => {
        setData("reports", [
            ...data.reports,
            {
                id: data.reports.length + 1,
                municipality: "",
                sky_condition: "",
                wind: "",
                precipitation: "",
                sea_condition: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Present Weather Conditions
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Enter current weather details. You can add multiple rows as
                    needed.
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3 border-r">Municipality</th>
                            <th className="p-3 border-r">Sky Condition</th>
                            <th className="p-3 border-r">Wind</th>
                            <th className="p-3 border-r">Precipitation</th>
                            <th className="p-3 border-r">Sea Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reports.map((row, index) => (
                            <tr
                                key={row.id}
                                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="municipality"
                                        value={row.municipality}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Enter municipality"
                                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="sky_condition"
                                        value={row.sky_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Clear / Cloudy"
                                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="wind"
                                        value={row.wind}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Light / Strong"
                                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="precipitation"
                                        value={row.precipitation}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Rain / N/A"
                                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="sea_condition"
                                        value={row.sea_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Calm / Rough / N/A"
                                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.reports && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.reports}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />

            {/* Info Note */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg shadow-sm">
                <p>
                    <span className="font-bold">💡 Note:</span> For non-coastal
                    municipalities, enter{" "}
                    <span className="font-mono bg-white px-1 py-0.5 rounded border">
                        N/A
                    </span>{" "}
                    for Sea Condition.
                </p>
            </div>
        </div>
    );
}
