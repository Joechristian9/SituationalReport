import React from "react";
// Using Plane icon for "Tourists"
import { Plane } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function AffectedTouristsForm({ data, setData, errors }) {
    // Manages the 'affected_tourists' array in the main form's state
    const touristsList = data?.affected_tourists ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...touristsList];
        newRows[index][name] = value;
        setData("affected_tourists", newRows);
    };

    const handleAddRow = () => {
        setData("affected_tourists", [
            ...touristsList,
            {
                // New object structure for affected tourists
                id: touristsList.length + 1,
                province_city_municipality: "",
                location: "",
                local_tourists: "",
                foreign_tourists: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <Plane className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Affected Tourists
                    </h3>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    {/* Table header built to match the image */}
                    <thead className="bg-blue-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-xs font-medium text-white uppercase tracking-wider border-b">
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Province/ City/ Municipality
                            </th>
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Location
                            </th>
                            <th
                                colSpan="2"
                                className="p-3 text-center border-r"
                            >
                                Number of Tourist
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Remarks
                            </th>
                        </tr>
                        <tr className="text-xs font-medium text-white uppercase tracking-wider bg-blue-500">
                            <th className="p-3 font-medium border-r">Local</th>
                            <th className="p-3 font-medium border-r">
                                Foreign
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {touristsList.length === 0 ? (
                            <tr>
                                {/* Colspan updated to 5 to match the new header */}
                                <td
                                    colSpan="5"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <Plane
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No affected tourists have been recorded.
                                    </p>
                                    <p className="text-xs mt-1">
                                        Click{" "}
                                        <span className="font-semibold text-blue-600">
                                            "Add Row"
                                        </span>{" "}
                                        to begin.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            touristsList.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                >
                                    {[
                                        "province_city_municipality",
                                        "location",
                                        "local_tourists",
                                        "foreign_tourists",
                                        "remarks",
                                    ].map((field) => (
                                        <td
                                            key={field}
                                            className="p-2 align-middle"
                                        >
                                            <input
                                                type={
                                                    field.includes("tourists")
                                                        ? "number"
                                                        : "text"
                                                }
                                                min={
                                                    field.includes("tourists")
                                                        ? 0
                                                        : undefined
                                                }
                                                name={field}
                                                value={row[field]}
                                                onChange={(e) =>
                                                    handleInputChange(index, e)
                                                }
                                                placeholder={field
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, (l) =>
                                                        l.toUpperCase()
                                                    )}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Error handling adapted for the 'affected_tourists' field */}
                {errors.affected_tourists && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.affected_tourists}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
