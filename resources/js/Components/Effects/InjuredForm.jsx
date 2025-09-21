import React from "react";
import { UserPlus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

// ✅ 1. Reusable, enhanced component for sex selection (copied from CasualtyForm)
const SexSelector = ({ value, onChange }) => {
    const options = ["Male", "Female"];
    return (
        <div className="flex w-full rounded-lg border border-gray-300 p-0.5 bg-gray-50">
            {options.map((option) => {
                const isActive = value === option;
                return (
                    <button
                        type="button"
                        key={option}
                        onClick={() => onChange(option)}
                        className={`
                            flex-1 rounded-md py-1.5 px-2 text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
                            ${
                                isActive
                                    ? option === "Female"
                                        ? "bg-pink-500 text-white shadow-sm" // Active state for Female
                                        : "bg-blue-500 text-white shadow-sm" // Active state for Male
                                    : "text-gray-600 hover:bg-gray-200" // Inactive state
                            }
                            ${
                                option === "Female"
                                    ? "focus:ring-pink-500" // Focus ring for Female
                                    : "focus:ring-blue-500" // Focus ring for Male
                            }
                        `}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
};

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
                <div className="bg-yellow-100 p-2 rounded-full">
                    <UserPlus className="h-6 w-6 text-yellow-600" />
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
                    {/* Thead is already consistent, no changes needed */}
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
                                        Click{" "}
                                        <span className="font-semibold text-blue-600">
                                            "Add Row"
                                        </span>{" "}
                                        to begin.
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
                                        // ✅ 2. Enhanced spacing in table cells
                                        <td
                                            key={field}
                                            className="p-3 align-middle"
                                        >
                                            {field === "sex" ? (
                                                // ✅ 3. Using the new SexSelector component
                                                <SexSelector
                                                    value={row.sex}
                                                    onChange={(newValue) =>
                                                        handleInputChange(
                                                            index,
                                                            {
                                                                target: {
                                                                    name: "sex",
                                                                    value: newValue,
                                                                },
                                                            }
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <input
                                                    type={
                                                        field ===
                                                        "date_admitted"
                                                            ? "date"
                                                            : field === "age"
                                                            ? "number"
                                                            : "text"
                                                    }
                                                    min={
                                                        field === "age"
                                                            ? 0
                                                            : undefined
                                                    }
                                                    name={field}
                                                    value={row[field]}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    placeholder={field
                                                        .replace(/_/g, " ")
                                                        .replace(/\b\w/g, (l) =>
                                                            l.toUpperCase()
                                                        )}
                                                    // ✅ 4. Consistent and improved input styling
                                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-gray-700 placeholder-gray-400 hover:border-blue-400"
                                                />
                                            )}
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
