// resources/js/Components/Declaration/DeclarationUSCForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function DeclarationUSCForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const declarations = data?.usc_declarations ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...declarations];
        newRows[index][name] = value;
        setData("usc_declarations", newRows);
    };

    const handleAddRow = () => {
        setData("usc_declarations", [
            ...declarations,
            {
                id: declarations.length + 1,
                declared_by: "",
                resolution_number: "",
                date_approved: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📜 Declaration under State of Calamity (USC)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Record details of declarations under a state of calamity.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3">Declared By</th>
                            <th className="p-3">Resolution Number</th>
                            <th className="p-3">Date Approved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {declarations.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="declared_by"
                                        value={row.declared_by}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Declared by"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="resolution_number"
                                        value={row.resolution_number}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Resolution number"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="date"
                                        name="date_approved"
                                        value={row.date_approved}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.usc_declarations && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.usc_declarations}
                    </div>
                )}
            </div>

            <div className="flex items-center">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                    <Plus size={18} className="stroke-[2]" />
                    Add Row
                </button>
            </div>
        </div>
    );
}
