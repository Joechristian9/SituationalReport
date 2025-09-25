// resources/js/Components/SituationOverview/WeatherForm.jsx
import React, { useEffect } from "react";
import { Info, Plus } from "lucide-react";
import AddRowButton from "../ui/AddRowButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import useAppUrl from "@/hooks/useAppUrl";
import { Clock } from "lucide-react";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

export default function WeatherForm({ data, setData, errors }) {
    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newReports = [...data.reports];
        newReports[index][name] = value;
        setData("reports", newReports);
    };

    const APP_URL = useAppUrl();
    const {
        data: modificationData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["weather"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/weather-modifications`
            );
            return data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

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
    if (isError) {
        return <div className="text-red-500">Error: {error.message}</div>;
    }
    // On component mount, merge latest modification into the report rows
    useEffect(() => {
        if (modificationData?.latest) {
            const updatedReports = data.reports.map((row) => {
                const newRow = { ...row };
                Object.keys(row).forEach((field) => {
                    if (
                        modificationData.latest.changed_fields?.[field]?.new !==
                        undefined
                    ) {
                        newRow[field] =
                            modificationData.latest.changed_fields[field].new;
                    }
                });
                return newRow;
            });
            setData((prev) => ({ ...prev, reports: updatedReports }));
        }
    }, [modificationData]);

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
            <pre>{JSON.stringify(modificationData, undefined, 3)}</pre>
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
                                        // Determine the value: use latest modification if exists, else original row value
                                        const value =
                                            modificationData?.latest
                                                ?.changed_fields?.[field]
                                                ?.new ??
                                            row[field] ??
                                            "";

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
                                                {modificationData?.history?.[
                                                    field
                                                ]?.length > 0 &&
                                                    (() => {
                                                        const fieldHistory =
                                                            modificationData
                                                                .history[field];

                                                        // Sort descending by date
                                                        const sorted = [
                                                            ...fieldHistory,
                                                        ].sort(
                                                            (a, b) =>
                                                                new Date(
                                                                    b.date
                                                                ) -
                                                                new Date(a.date)
                                                        );

                                                        const lastEntry =
                                                            sorted[0]; // latest modification for this field

                                                        if (!lastEntry)
                                                            return null;

                                                        return (
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
                                                        );
                                                    })()}

                                                {/* Tooltip for full history */}
                                                {modificationData?.history?.[
                                                    field
                                                ]?.length > 0 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer absolute top-1 right-1" />
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="right"
                                                            className="max-w-xs"
                                                        >
                                                            <div className="text-sm space-y-1">
                                                                {modificationData.history[
                                                                    field
                                                                ].map(
                                                                    (
                                                                        entry,
                                                                        i
                                                                    ) => (
                                                                        <p
                                                                            key={
                                                                                i
                                                                            }
                                                                        >
                                                                            <span className="font-semibold">
                                                                                {
                                                                                    entry
                                                                                        .user
                                                                                        .name
                                                                                }
                                                                            </span>{" "}
                                                                            changed
                                                                            from{" "}
                                                                            <span className="text-red-600">
                                                                                {entry.old ??
                                                                                    "N/A"}
                                                                            </span>{" "}
                                                                            to{" "}
                                                                            <span className="text-green-600">
                                                                                {entry.new ??
                                                                                    "N/A"}
                                                                            </span>
                                                                            <br />
                                                                            <span className="text-xs text-gray-400">
                                                                                {new Date(
                                                                                    entry.date
                                                                                ).toLocaleString()}
                                                                            </span>
                                                                        </p>
                                                                    )
                                                                )}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {errors.reports && (
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
        </div>
    );
}
