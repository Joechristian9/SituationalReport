import React from "react";
import { UserSearch } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";

// The SexSelector component remains the same and already uses a blue/pink theme.
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

export default function MissingForm({ data, setData, errors }) {
    const missingList = data?.missing ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...missingList];
        newRows[index][name] = value;
        setData("missing", newRows);
    };

    const handleAddRow = () => {
        setData("missing", [
            ...missingList,
            {
                id: missingList.length + 1,
                name: "",
                age: "",
                sex: "",
                address: "",
                cause: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                    <UserSearch className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Missing</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Record the details for each missing individual.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Note: In the Remarks column - describe what happened to
                        the victim.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    {/* ✅ 2. CHANGED: Thead color is now blue */}
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
                                Cause
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
                    <tbody>
                        {missingList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-12 px-4 text-gray-500"
                                >
                                    <UserSearch
                                        size={40}
                                        className="mx-auto text-gray-400"
                                    />
                                    <p className="font-medium mt-2">
                                        No missing persons have been recorded.
                                    </p>
                                    {/* ✅ 3. CHANGED: "Add Row" text is now blue */}
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
                            missingList.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                                >
                                    {[
                                        "name",
                                        "age",
                                        "sex",
                                        "address",
                                        "cause",
                                        "remarks",
                                    ].map((field) => (
                                        <td
                                            key={field}
                                            className="p-2 align-middle"
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
                                                        field === "age"
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
                                                    // ✅ 4. CHANGED: Input styling is now blue
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition hover:border-blue-400"
                                                />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {errors.missing && (
                    <div className="text-red-600 bg-red-50 text-sm mt-2 p-3 border-t border-gray-200">
                        {errors.missing}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />
        </div>
    );
}
