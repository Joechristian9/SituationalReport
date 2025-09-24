import React from "react";
// Using School icon for "Suspension of Classes"
import { School } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function SuspensionOfClassesForm({ data, setData, errors }) {
    // Manages the 'suspension_of_classes' array in the main form's state
    const suspensionList = data?.suspension_of_classes ?? [];

    // Define the options for the 'Levels' dropdown
    const suspensionLevels = [
        "Pre-school",
        "Elementary",
        "Junior High School",
        "Senior High School",
        "All Levels (K-12)",
        "College",
        "All Levels (including College)",
    ];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...suspensionList];
        newRows[index][name] = value;
        setData("suspension_of_classes", newRows);
    };

    const handleAddRow = () => {
        setData("suspension_of_classes", [
            ...suspensionList,
            {
                // New object structure for suspension of classes
                id: suspensionList.length + 1,
                province_city_municipality: "",
                levels: "", // Default value for the select dropdown
                date_of_suspension: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                    <School className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        F.1 Suspension of Classes
                    </h3>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    {/* Table header built to match the image */}
                    <thead className="bg-red-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-xs font-medium text-white uppercase tracking-wider border-b">
                            <th className="p-3 align-middle border-r">
                                Province/ City/ Municipality
                            </th>
                            <th className="p-3 align-middle border-r">
                                Levels
                            </th>
                            <th className="p-3 align-middle border-r">
                                Date of Suspension
                            </th>
                            <th className="p-3 align-middle">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suspensionList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <School
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No class suspensions have been recorded.
                                    </p>
                                    <p className="text-xs mt-1">
                                        Click{" "}
                                        <span className="font-semibold text-red-600">
                                            "Add Row"
                                        </span>{" "}
                                        to begin.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            suspensionList.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                >
                                    {/* Province/City/Municipality Input */}
                                    <td className="p-2 align-middle">
                                        <input
                                            type="text"
                                            name="province_city_municipality"
                                            value={
                                                row.province_city_municipality
                                            }
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="Province/ City/ Municipality"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none transition hover:border-red-400"
                                        />
                                    </td>

                                    {/* Levels Dropdown */}
                                    <td className="p-2 align-middle">
                                        <select
                                            name="levels"
                                            value={row.levels}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none transition hover:border-red-400"
                                        >
                                            <option value="" disabled>
                                                Select Level
                                            </option>
                                            {suspensionLevels.map((level) => (
                                                <option
                                                    key={level}
                                                    value={level}
                                                >
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Date of Suspension Input */}
                                    <td className="p-2 align-middle">
                                        <input
                                            type="date"
                                            name="date_of_suspension"
                                            value={row.date_of_suspension}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none transition hover:border-red-400"
                                        />
                                    </td>

                                    {/* Remarks Input */}
                                    <td className="p-2 align-middle">
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={row.remarks}
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                            placeholder="Remarks"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none transition hover:border-red-400"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Error handling for the 'suspension_of_classes' field */}
                {errors.suspension_of_classes && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.suspension_of_classes}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
