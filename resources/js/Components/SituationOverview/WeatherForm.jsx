// resources/js/Components/SituationOverview/WeatherForm.jsx
import React, { useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Plus, Save } from "lucide-react";

const LOCAL_STORAGE_KEY = "weatherFormData";

export default function WeatherForm() {
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors } = useForm(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse saved form data:", e);
            }
        }
        return {
            reports: [
                {
                    id: 1,
                    municipality: "",
                    sky_condition: "",
                    wind: "",
                    precipitation: "",
                    sea_condition: "",
                },
            ],
        };
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;
        setData("reports", newReports);
    };

    const handleAddRow = () => {
        setData("reports", [
            ...data.reports,
            {
                id: data.reports.length + 1,
                municipality: "",
                sky_condition: "",
                wind: "",
                precipitation: "",
                sea_condition: "",
            },
        ]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        post(route("weather-reports.store"), {
            preserveScroll: true,
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🌦️ Present Weather Conditions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Enter current weather details. You can add multiple rows as
                    needed.
                </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-left text-gray-700 font-semibold">
                            <th className="p-3">Municipality</th>
                            <th className="p-3">Sky Condition</th>
                            <th className="p-3">Wind</th>
                            <th className="p-3">Precipitation</th>
                            <th className="p-3">Sea Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reports.map((row, index) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors"
                            >
                                <td className="p-2">
                                    <input
                                        name="municipality"
                                        value={row.municipality}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Enter municipality"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="sky_condition"
                                        value={row.sky_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Clear / Cloudy"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="wind"
                                        value={row.wind}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Light / Strong"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="precipitation"
                                        value={row.precipitation}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Rain / N/A"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </td>
                                <td className="p-2 flex items-center gap-3">
                                    <input
                                        name="sea_condition"
                                        value={row.sea_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        placeholder="Calm / Rough / N/A"
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    {/* <img
                                        src={
                                            auth.user?.profile_photo_url ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                auth.user?.name ?? "User"
                                            )}&background=0D8ABC&color=fff`
                                        }
                                        alt={auth.user?.name}
                                        title={auth.user?.name}
                                        className="w-10 h-10 rounded-full border shadow-sm"
                                    /> */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors["reports"] && (
                    <div className="text-red-500 text-sm mt-2 px-2">
                        {errors["reports"]}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition"
                >
                    <Plus size={18} />
                    Add Row
                </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg shadow-sm">
                <p>
                    <span className="font-bold">💡 Note:</span> For non-coastal
                    municipalities, enter{" "}
                    <span className="font-mono bg-white px-1 py-0.5 rounded">
                        N/A
                    </span>{" "}
                    for Sea Condition.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={processing}
                >
                    <Save size={18} />
                    {processing ? "Saving..." : "Save Weather Report(s)"}
                </button>
            </div>
        </form>
    );
}
