import React from "react";
import { Plus, UserX } from "lucide-react";

export default function CasualtyForm({ data, setData, errors }) {
    const casualties = data?.casualties ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...casualties];
        newRows[index][name] = value;
        setData("casualties", newRows);
    };

    const handleAddRow = () => {
        setData("casualties", [
            ...casualties,
            {
                id: casualties.length + 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                cause_of_death: "",
                date_died: "",
                place_of_incident: "",
            },
        ]);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                    <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Casualty Report: Deceased
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Record the details for each deceased individual.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-xs font-medium text-white uppercase tracking-wider border-b">
                            <th
                                colSpan="4"
                                className="p-3 text-center border-r"
                            >
                                Profile
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Cause of Death
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Date Died
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Place of Incident
                            </th>
                        </tr>
                        <tr className="text-xs font-medium text-white uppercase tracking-wider bg-blue-500">
                            <th className="p-3 font-medium border-r">Name</th>
                            <th className="p-3 font-medium border-r">Age</th>
                            <th className="p-3 font-medium border-r">Sex</th>
                            <th className="p-3 font-medium border-r">
                                Address (Home)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {casualties.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <UserX
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No casualties have been recorded.
                                    </p>
                                    <p className="text-xs mt-1">
                                        Click "Add New Casualty" to begin.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            casualties.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {[
                                        "name",
                                        "age",
                                        "sex",
                                        "address",
                                        "cause_of_death",
                                        "date_died",
                                        "place_of_incident",
                                    ].map((field) => (
                                        <td
                                            key={field}
                                            className="p-2 align-top"
                                        >
                                            <input
                                                type={
                                                    field === "date_died"
                                                        ? "date"
                                                        : "text"
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
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {errors.casualties && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.casualties}
                    </div>
                )}
            </div>

            <div className="flex items-center pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                >
                    <Plus size={18} />
                    Add New Casualty
                </button>
            </div>
        </div>
    );
}
