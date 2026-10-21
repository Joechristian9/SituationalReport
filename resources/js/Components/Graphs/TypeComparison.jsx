import React from "react";
import { Layers } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { cn } from "@/lib/utils";

const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });

/**
 * The chosen measure per disaster, averaged by disaster type (from the server, over every
 * past disaster). Choosing a type filters the whole section to it; choosing it again shows all.
 */
export default function TypeComparison({ rows, metricLabel, where, selected, onSelect, disabled }) {
    const max = Math.max(1, ...rows.map((r) => r.average));
    const measure = metricLabel.toLowerCase();
    const nothing = rows.every((r) => r.total === 0);

    return (
        <GraphCard title="By disaster type" icon={<Layers size={24} />}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                Average {measure} per disaster {where}, by type. Choose a type to show only those disasters.
            </p>
            {nothing ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm">
                    <p className="font-medium text-foreground">No disaster type has {measure} reported {where} yet.</p>
                    <p className="mt-1 text-muted-foreground">Choose another measure to compare types.</p>
                </div>
            ) : (
                <ol className="space-y-1">
                    {rows.map((row) => {
                        const isSelected = row.type === selected;
                        const label = row.type ?? "Unspecified";
                        return (
                            <li key={label}>
                                <button
                                    type="button"
                                    // Disasters without a type can't be filtered to.
                                    disabled={disabled || !row.type}
                                    onClick={() => onSelect(isSelected ? null : row.type)}
                                    aria-pressed={isSelected}
                                    aria-label={`${label}: on average ${number(row.average)} ${measure} per disaster, ${number(row.total)} across ${row.events} disaster${row.events === 1 ? "" : "s"}. ${isSelected ? "Selected; choose again to show all types." : "Show only this type."}`}
                                    className={cn(
                                        "grid min-h-11 w-full cursor-pointer grid-cols-[minmax(0,7.5rem)_1fr_auto] sm:grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors md:min-h-9",
                                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent motion-reduce:transition-none",
                                        isSelected && "bg-muted ring-1 ring-border",
                                    )}
                                >
                                    <span className="min-w-0">
                                        <span className={cn("block truncate text-foreground", isSelected && "font-semibold")}>{label}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {row.events} event{row.events === 1 ? "" : "s"}
                                        </span>
                                    </span>
                                    <span className="h-2 rounded-full bg-muted" aria-hidden="true">
                                        <span className="block h-2 rounded-full" style={{ width: `${(row.average / max) * 100}%`, background: "var(--viz-place-1)" }} />
                                    </span>
                                    <span className="text-right tabular-nums">
                                        <span className="font-semibold text-foreground">{number(row.average)}</span>
                                        <span className="ml-1 text-xs text-muted-foreground">avg</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            )}
            {!nothing && rows.some((r) => r.events === 1) && (
                <p className="mt-3 text-xs text-muted-foreground">A type with 1 event shows that one disaster, not an average.</p>
            )}
        </GraphCard>
    );
}
