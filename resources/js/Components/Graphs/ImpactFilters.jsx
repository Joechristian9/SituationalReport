import React from "react";
import { DataToolbar, FilterSelect } from "@/Components/data/DataView";
import { AGE_BRACKETS } from "./personStats";

const SEX_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Unknown", label: "Not specified" },
];

/**
 * The Sex / Age filters in the "Who is affected" header. Pills on desktop; on phones a
 * single "Filters" button opens a popover (see DataToolbar).
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
        <DataToolbar
            // Sits in the panel header, so none of the toolbar's own band styling.
            className="space-y-2 border-0 bg-transparent p-0 sm:px-0"
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
    );
}
