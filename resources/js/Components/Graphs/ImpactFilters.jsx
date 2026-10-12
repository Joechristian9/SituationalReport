import React from "react";
import { DataToolbar, FilterSelect } from "@/Components/data/DataView";
import { AGE_BRACKETS } from "./personStats";

const SEX_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Unknown", label: "Not specified" },
];

/**
 * One filter row that scopes all three Human Impact graphs. Pills on desktop; on
 * phones a single "Filters" button opens a bottom sheet (see DataToolbar).
 */
export default function ImpactFilters({ sex, age, onSexChange, onAgeChange }) {
    const reset = () => {
        onSexChange("all");
        onAgeChange("all");
    };

    const chips = [
        sex !== "all" && {
            key: "sex",
            label: `Sex: ${SEX_OPTIONS.find((o) => o.value === sex)?.label ?? sex}`,
            onRemove: () => onSexChange("all"),
        },
        age !== "all" && { key: "age", label: `Age: ${age}`, onRemove: () => onAgeChange("all") },
    ].filter(Boolean);

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <DataToolbar
                className="border-0 border-b py-2.5"
                filters={
                    <>
                        <FilterSelect
                            id="impact-sex"
                            label="Sex"
                            value={sex}
                            onChange={onSexChange}
                            options={SEX_OPTIONS}
                        />
                        <FilterSelect
                            id="impact-age"
                            label="Age group"
                            value={age}
                            onChange={onAgeChange}
                            allLabel="All ages"
                            options={AGE_BRACKETS.map((bracket) => ({ value: bracket, label: bracket }))}
                        />
                    </>
                }
                chips={chips}
                onClearAll={reset}
            />
            <p className="px-4 py-2 text-xs text-muted-foreground sm:px-5">Applies to the three graphs below.</p>
        </div>
    );
}
