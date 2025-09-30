// resources/js/Components/SituationOverview/WeatherForm.jsx
import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAppUrl from "@/hooks/useAppUrl";
import { toast } from "react-hot-toast";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

export default function WeatherForm({ data, setData, errors }) {
    const APP_URL = useAppUrl();
    const [modifiedFields, setModifiedFields] = useState({}); // Track changed fields per row

    // Fetch modification data with react-query
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["weather-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/weather`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    // Merge latest modifications on mount (without overwriting unchanged fields)
    useEffect(() => {
        if (modificationData?.latest) {
            const updatedReports = (data.reports || []).map((row, rowIndex) => {
                const newRow = { ...row };
                Object.keys(row).forEach((field) => {
                    // Only update if the user hasn't modified this field yet
                    const rowModifiedFields = modifiedFields[rowIndex] || {};
                    const change =
                        modificationData.latest.changed_fields?.[field];
                    if (change && !rowModifiedFields[field]) {
                        newRow[field] = change.new ?? change.old ?? row[field];
                    }
                });
                return newRow;
            });
            setData({ ...data, reports: updatedReports });
        }
    }, [modificationData]);

    // Handle input changes
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedReports = [...data.reports];
        updatedReports[index][name] = value;
        setData({ ...data, reports: updatedReports });

        // Mark this field as modified by the user
        setModifiedFields((prev) => ({
            ...prev,
            [index]: {
                ...prev[index],
                [name]: true,
            },
        }));
    };

    // Add new row
    const handleAddRow = () => {
        setData({
            ...data,
            reports: [
                ...data.reports,
                {
                    id: data.reports.length + 1,
                    municipality: "",
                    sky_condition: "",
                    wind: "",
                    precipitation: "",
                    sea_condition: "",
                },
            ],
        });
    };

    // Submit handler
    const handleSubmit = async () => {
        try {
            await axios.post(`${APP_URL}/weather-reports`, {
                reports: data.reports,
            });
            toast.success("Weather reports saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save weather reports.");
        }
    };

    if (isError) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Present Weather Conditions
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Enter current weather details. You can add multiple rows as
                    needed.
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-blue-500 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left text-white font-semibold">
                            <th className="p-3 border-r">Municipality</th>
                            <th className="p-3 border-r">Sky Condition</th>
                            <th className="p-3 border-r">Wind</th>
                            <th className="p-3 border-r">Precipitation</th>
                            <th className="p-3 border-r">Sea Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reports.map((row, index) => {
                            const fields = [
                                "municipality",
                                "sky_condition",
                                "wind",
                                "precipitation",
                                "sea_condition",
                            ];

                            return (
                                <tr
                                    key={row.id}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition-colors"
                                >
                                    {fields.map((field) => {
                                        const fieldHistory =
                                            modificationData?.history?.[
                                                field
                                            ] || [];
                                        const lastEntry = fieldHistory
                                            .slice()
                                            .sort(
                                                (a, b) =>
                                                    new Date(b.date) -
                                                    new Date(a.date)
                                            )[0];

                                        return (
                                            <td
                                                key={field}
                                                className="p-2 relative"
                                            >
                                                <input
                                                    name={field}
                                                    value={row[field] ?? ""}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            index,
                                                            e
                                                        )
                                                    }
                                                    placeholder={`Enter ${field.replace(
                                                        "_",
                                                        " "
                                                    )}`}
                                                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                                />

                                                {/* Show last modified only if this field was updated */}
                                                {lastEntry &&
                                                    !modifiedFields[index]?.[
                                                        field
                                                    ] && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Last modified by{" "}
                                                            <span className="font-semibold text-blue-600">
                                                                {
                                                                    lastEntry
                                                                        .user
                                                                        ?.name
                                                                }
                                                            </span>{" "}
                                                            on{" "}
                                                            {new Date(
                                                                lastEntry.date
                                                            ).toLocaleString()}
                                                        </p>
                                                    )}

                                                {fieldHistory.length > 0 &&
                                                    (() => {
                                                        // Get the latest change (the first item in the sorted array)
                                                        const latestChange =
                                                            fieldHistory[0];

                                                        // Get the previous change (the second item), if it exists
                                                        const previousChange =
                                                            fieldHistory.length >
                                                            1
                                                                ? fieldHistory[1]
                                                                : null;

                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Info className="w-4 h-4 text-gray-400 absolute top-3 right-2 cursor-pointer" />
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    side="right"
                                                                    className="max-w-xs bg-gray-800 text-white p-3 rounded-lg shadow-lg"
                                                                >
                                                                    <div className="text-sm space-y-2">
                                                                        {/* Display the Latest Change */}
                                                                        <div>
                                                                            <p className="text-sm font-bold text-white mb-1">
                                                                                Latest
                                                                                Change:
                                                                            </p>
                                                                            <p>
                                                                                <span className="font-semibold text-blue-300">
                                                                                    {
                                                                                        latestChange
                                                                                            .user
                                                                                            ?.name
                                                                                    }
                                                                                </span>{" "}
                                                                                changed
                                                                                from{" "}
                                                                                <span className="text-red-400 font-mono">
                                                                                    {latestChange.old ??
                                                                                        "nothing"}
                                                                                </span>{" "}
                                                                                to{" "}
                                                                                <span className="text-green-400 font-mono">
                                                                                    {latestChange.new ??
                                                                                        "nothing"}
                                                                                </span>
                                                                            </p>
                                                                            <p className="text-xs text-gray-400">
                                                                                {new Date(
                                                                                    latestChange.date
                                                                                ).toLocaleString()}
                                                                            </p>
                                                                        </div>

                                                                        {/* Conditionally display the Previous Change if it exists */}
                                                                        {previousChange && (
                                                                            <div className="mt-2 pt-2 border-t border-gray-600">
                                                                                <p className="text-sm font-bold text-gray-300 mb-1">
                                                                                    Previous
                                                                                    Change:
                                                                                </p>
                                                                                <p>
                                                                                    <span className="font-semibold text-blue-300">
                                                                                        {
                                                                                            previousChange
                                                                                                .user
                                                                                                ?.name
                                                                                        }
                                                                                    </span>{" "}
                                                                                    changed
                                                                                    from{" "}
                                                                                    <span className="text-red-400 font-mono">
                                                                                        {previousChange.old ??
                                                                                            "nothing"}
                                                                                    </span>{" "}
                                                                                    to{" "}
                                                                                    <span className="text-green-400 font-mono">
                                                                                        {previousChange.new ??
                                                                                            "nothing"}
                                                                                    </span>
                                                                                </p>
                                                                                <p className="text-xs text-gray-400">
                                                                                    {new Date(
                                                                                        previousChange.date
                                                                                    ).toLocaleString()}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })()}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {errors?.reports && (
                    <div className="text-red-500 text-sm mt-2 px-3">
                        {errors.reports}
                    </div>
                )}
            </div>

            <AddRowButton onClick={handleAddRow} label="Add Row" />

            {/* Info Note */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg shadow-sm">
                <p>
                    <span className="font-bold">💡 Note:</span> For non-coastal
                    municipalities, enter{" "}
                    <span className="font-mono bg-white px-1 py-0.5 rounded border">
                        N/A
                    </span>{" "}
                    for Sea Condition.
                </p>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSubmit}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
                Save Weather Report
            </button>
        </div>
    );
}
