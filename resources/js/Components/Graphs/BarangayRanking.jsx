import React, { useState } from "react";
import { MapPin } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const ROW_LIMIT = 10;
const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });

/**
 * Every barangay ranked by the chosen measure (ranking from the server). Choosing a row
 * filters the whole history section to that barangay; choosing it again shows all.
 */
export default function BarangayRanking({ rows, events, metricLabel, selected, onSelect }) {
    const [showAll, setShowAll] = useState(false);
    const max = Math.max(1, ...rows.map((r) => r.value));
    const selectedIndex = rows.findIndex((r) => r.id === selected);
    // Keep the chosen barangay visible even when it ranks below the top ten.
    const visible = showAll ? rows : rows.filter((r, i) => i < ROW_LIMIT || i === selectedIndex);
    const withImpact = rows.filter((r) => r.value > 0).length;

    return (
        <GraphCard title="Most affected barangays" icon={<MapPin size={24} />}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                {metricLabel} across {events} past disaster{events === 1 ? "" : "s"}. {withImpact} of {rows.length} barangays reported any. Choose a barangay to see its own numbers above.
            </p>

            {rows.length === 0 || withImpact === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    {rows.length === 0
                        ? "No barangay accounts yet."
                        : `No barangay account reported ${metricLabel.toLowerCase()} in these disasters. Any reports came from city office accounts, which are counted in the citywide totals above.`}
                </p>
            ) : (
                <ol className="space-y-1">
                    {visible.map((row) => {
                        const rank = rows.indexOf(row) + 1;
                        const isSelected = row.id === selected;
                        return (
                            <li key={row.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(row.id)}
                                    aria-pressed={isSelected}
                                    aria-label={`${rank}. ${row.name}: ${number(row.value)} ${metricLabel.toLowerCase()}, in ${row.eventsAffected} of ${events} disasters. ${isSelected ? "Selected; choose again to show all barangays." : "Show only this barangay."}`}
                                    className={cn(
                                        "grid min-h-11 w-full cursor-pointer grid-cols-[2rem_minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors md:min-h-9",
                                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                                        isSelected && "bg-muted ring-1 ring-border",
                                    )}
                                >
                                    <span className="tabular-nums text-muted-foreground">{rank}</span>
                                    <span className={cn("truncate", isSelected ? "font-semibold text-foreground" : "text-foreground")}>{row.name}</span>
                                    <span className="h-2 rounded-full bg-muted" aria-hidden="true">
                                        <span className="block h-2 rounded-full" style={{ width: `${(row.value / max) * 100}%`, background: "var(--viz-place-1)" }} />
                                    </span>
                                    <span className="text-right tabular-nums">
                                        <span className="font-semibold text-foreground">{number(row.value)}</span>
                                        <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">· {row.eventsAffected} of {events}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            )}

            {rows.length > ROW_LIMIT && (
                <Button type="button" variant="ghost" size="sm" className="mt-3 h-9 px-2 text-muted-foreground" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? `Show top ${ROW_LIMIT}` : `Show all ${rows.length} barangays`}
                </Button>
            )}
        </GraphCard>
    );
}
