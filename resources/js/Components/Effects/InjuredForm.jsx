import React from "react";
import { Plus, UserPlus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

export default function InjuredForm({ data, setData, errors }) {
    const injuredList = data?.injured ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...injuredList];
        newRows[index][name] = value;
        setData("injured", newRows);
    };

    const handleAddRow = () => {
        setData("injured", [
            ...injuredList,
            {
                id: injuredList.length + 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                diagnosis: "",
                date_admitted: "",
                place_of_incident: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Injured</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Record the details for each injured individual.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 border-b border-gray-200 sticky top-0 z-10">
                        <tr className="text-xs font-medium text-white uppercase tracking-wider border-b">
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Name
                            </th>
                            <th
                                colSpan="3"
                                className="p-3 text-center border-r"
                            >
                                Profile
                            </th>
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Diagnosis
                            </th>
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Date Admitted
                            </th>
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Place of Incident
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Remarks
                            </th>
                        </tr>
                        <tr className="text-xs font-medium text-white uppercase tracking-wider bg-blue-500">
                            <th className="p-3 font-medium border-r">Age</th>
                            <th className="p-3 font-medium border-r">Sex</th>
                            <th className="p-3 font-medium border-r">
                                Address
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {injuredList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <UserPlus
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No injured persons have been recorded.
                                    </p>
                                    <p className="text-xs mt-1">
                                        Click "Add Row" to begin.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            injuredList.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {[
                                        "name",
                                        "age",
                                        "sex",
                                        "address",
                                        "diagnosis",
                                        "date_admitted",
                                        "place_of_incident",
                                        "remarks",
                                    ].map((field) => (
                                        <td
                                            key={field}
                                            className="p-2 align-top"
                                        >
                                            <input
                                                type={
                                                    field === "date_admitted"
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
                {errors.injured && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.injured}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
