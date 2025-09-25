import React from "react";
// Using Briefcase icon for "Suspension of Work"
import { Briefcase } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function SuspensionOfWorkForm({ data, setData, errors }) {
    // Manages the 'suspension_of_work' array in the main form's state
    const suspensionList = data?.suspension_of_work ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...suspensionList];
        newRows[index][name] = value;
        setData("suspension_of_work", newRows);
    };

    const handleAddRow = () => {
        setData("suspension_of_work", [
            ...suspensionList,
            {
                id: suspensionList.length + 1,
                province_city_municipality: "",
                date_of_suspension: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        F.2 Suspension of Work
                    </h3>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-xs font-medium text-white uppercase tracking-wider border-b">
                            <th className="p-3 align-middle border-r">
                                Province/ City/ Municipality
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
                                    colSpan="3"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <Briefcase
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No work suspensions have been recorded.
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
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
                                        />
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
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
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
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Error handling for the 'suspension_of_work' field */}
                {errors.suspension_of_work && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.suspension_of_work}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
