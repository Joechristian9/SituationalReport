// resources/js/Components/SituationOverview/CommunicationsForm.jsx
import React from "react";
import { Plus } from "lucide-react";

export default function CommunicationsForm({ data, setData, errors }) {
    // ✅ Always fallback to [] if undefined
    const communications = data?.communications ?? [];

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newRows = [...communications];
        newRows[index][name] = value;
        setData("communications", newRows);
    };

    const handleAddRow = () => {
        setData("communications", [
            ...communications,
            {
                id: communications.length + 1,
                globe: "",
                smart: "",
                pldt_landline: "",
                pldt_internet: "",
                vhf: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📡 Communications
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter details of communication services availability.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-left text-gray-700 font-semibold">
                            <th className="p-3">Globe</th>
                            <th className="p-3">Smart</th>
                            <th className="p-3">PLDT Landline</th>
                            <th className="p-3">PLDT Internet</th>
                            <th className="p-3">VHF Radio</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {communications.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="globe"
                                        value={row.globe}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Globe status"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="smart"
                                        value={row.smart}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Smart status"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="pldt_landline"
                                        value={row.pldt_landline}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Landline status"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="pldt_internet"
                                        value={row.pldt_internet}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Internet status"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="vhf"
                                        value={row.vhf}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Radio status"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="remarks"
                                        value={row.remarks}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Additional remarks"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors.communications && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors.communications}
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
