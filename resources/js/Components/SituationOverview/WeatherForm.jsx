// resources/js/Components/SituationOverview/WeatherForm.jsx

import React, { useEffect } from "react"; // 1. Import useEffect
import { useForm } from "@inertiajs/react";
import { Plus } from "lucide-react";

// NEW: Define a unique key for storing the form data in localStorage.
const LOCAL_STORAGE_KEY = "weatherFormData";

export default function WeatherForm() {
    // 2. MODIFIED: Initialize the form with data from localStorage or a default state.
    const { data, setData, post, processing, errors } = useForm(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            // If we find saved data, parse it and use it.
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse saved form data:", e);
            }
        }
        // If no saved data is found, return the default structure.
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

    // 3. NEW: Add a useEffect hook to save data to localStorage whenever it changes.
    // This is the core of the persistence logic.
    useEffect(() => {
        // We convert the 'data' object to a JSON string to store it.
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }, [data]); // This effect runs every time the 'data' object is updated.

    /**
     * Handles changes in any input field and updates the form state.
     */
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;
        setData("reports", newReports);
    };

    /**
     * Adds a new, empty row to the form.
     */
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

    /**
     * Handles the form submission.
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        post(route("weather-reports.store"), {
            // 4. MODIFIED: Remove the reset() call to keep the data after saving.
            onSuccess: () => {
                // The form will no longer reset on success.
                // reset(); <-- THIS LINE HAS BEEN REMOVED.
                // A success toast will still appear from your Index.jsx page.
            },
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* The rest of your JSX remains exactly the same */}
            <h3 className="text-lg font-semibold text-gray-800">
                A. Present Weather Conditions
            </h3>
            <p className="text-sm text-gray-600 -mt-4">
                Enter current weather details in an Excel-like grid. You can add
                multiple rows.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left text-gray-700 font-medium">
                            <th className="p-3">Municipality</th>
                            <th className="p-3">Sky Condition</th>
                            <th className="p-3">Wind</th>
                            <th className="p-3">Precipitation</th>
                            <th className="p-3">Sea Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reports.map((row, index) => (
                            <tr key={row.id}>
                                <td className="p-2">
                                    <input
                                        name="municipality"
                                        value={row.municipality}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="sky_condition"
                                        value={row.sky_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="wind"
                                        value={row.wind}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="precipitation"
                                        value={row.precipitation}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        name="sea_condition"
                                        value={row.sea_condition}
                                        onChange={(e) =>
                                            handleInputChange(index, e)
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {errors["reports"] && (
                    <div className="text-red-500 text-sm mt-2">
                        {errors["reports"]}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
            >
                <Plus size={18} />
                Add Row
            </button>

            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
                <p>
                    <span className="font-bold">Note:</span> For non-coastal
                    municipalities, enter "N/A" for Sea Condition.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={processing}
                >
                    {processing ? "Saving..." : "Save Weather Report(s)"}
                </button>
            </div>
        </form>
    );
}
