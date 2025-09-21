import React from "react";
import { UserX } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

// The enhanced SexSelector component from the previous step
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
                                        ? "bg-pink-500 text-white shadow-sm"
                                        : "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-200"
                            }
                            ${
                                option === "Female"
                                    ? "focus:ring-pink-500"
                                    : "focus:ring-blue-500"
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
                    <h3 className="text-xl font-bold text-gray-800">Dead</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Record the details for each deceased individual.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    {/* ✅ THEAD has been updated to match the InjuredForm structure */}
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
                                Cause of Death
                            </th>
                            <th
                                rowSpan="2"
                                className="p-3 align-middle border-r"
                            >
                                Date Died
                            </th>
                            <th rowSpan="2" className="p-3 align-middle">
                                Place of Incident
                            </th>
                        </tr>
                        <tr className="text-xs font-medium text-white uppercase tracking-wider bg-blue-500">
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
                                {/* Colspan remains 7 because there are 7 columns in the header */}
                                <td
                                    colSpan="7"
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
                                        Click{" "}
                                        <span className="font-semibold text-blue-600">
                                            "Add Row"
                                        </span>{" "}
                                        to begin.
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
                                            className="p-3 align-middle"
                                        >
                                            {field === "sex" ? (
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
                                                        field === "date_died"
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
                {errors.casualties && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.casualties}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
