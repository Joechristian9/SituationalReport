import React, { useState } from "react";
import { Info, MapPin } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const ROW_LIMIT = 10;
const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const listNames = (names) => (names.length > 4 ? `${names.slice(0, 4).join(", ")} and ${names.length - 4} more` : names.join(", "));

/** Why part of the citywide total is missing from the list, in plain words (amounts from the server). */
function notInListText(unassigned, measure, barangayCount) {
    if (!unassigned || unassigned.total <= 0) return null;
    const reasons = [
        unassigned.names.length > 0 && `name a place that is not one of the ${barangayCount} barangays (${listNames(unassigned.names)})`,
        unassigned.withoutName && "do not name a barangay",
    ].filter(Boolean);
    return `${number(unassigned.total)} ${measure} are not in this list: their reports ${reasons.join(" or ")}. They still count in the citywide total.`;
}

/**
 * Every barangay ranked by the chosen measure (ranking from the server). Choosing a row
 * filters the whole history section to that barangay; choosing it again shows all.
 */
export default function BarangayRanking({ rows, events, metricLabel, unassigned, selected, onSelect }) {
    const [showAll, setShowAll] = useState(false);
    const max = Math.max(1, ...rows.map((r) => r.value));
    const selectedIndex = rows.findIndex((r) => r.id === selected);
    // Keep the chosen barangay visible even when it ranks below the top ten.
    const visible = showAll ? rows : rows.filter((r, i) => i < ROW_LIMIT || i === selectedIndex);
    const withImpact = rows.filter((r) => r.value > 0).length;
    const measure = metricLabel.toLowerCase();
    const notInList = notInListText(unassigned, measure, rows.length);

    return (
        <GraphCard title="Most affected barangays" icon={<MapPin size={24} />}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                {metricLabel} per barangay, added up over {events} past disaster{events === 1 ? "" : "s"}.
                {withImpact > 0 && ` ${withImpact} of ${rows.length} barangays have some; ${rows.length - withImpact} have none. Tap a barangay to see only its numbers above.`}
            </p>

            {rows.length === 0 || withImpact === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm">
                    <p className="font-medium text-foreground">
                        {rows.length === 0 ? "No barangay accounts yet, so there is nothing to rank." : notInList ? `No barangay has ${measure} on record.` : `Nothing has been reported for ${measure} in these disasters yet.`}
                    </p>
                    {rows.length > 0 && notInList && <p className="mx-auto mt-1 max-w-prose text-muted-foreground">{notInList}</p>}
                </div>
            ) : (
                <ol
                    className={cn("space-y-1", showAll && "max-h-96 overflow-y-auto rounded-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                    // Scrollable regions need to be reachable by keyboard.
                    tabIndex={showAll ? 0 : undefined}
                    aria-label={showAll ? `All ${rows.length} barangays, scrollable` : undefined}
                >
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

            {withImpact > 0 && notInList && (
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {notInList}
                </p>
            )}

            {withImpact > 0 && rows.length > ROW_LIMIT && (
                <Button type="button" variant="ghost" size="sm" className="mt-3 h-9 px-2 text-muted-foreground" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? `Show top ${ROW_LIMIT}` : `Show all ${rows.length} barangays`}
                </Button>
            )}
        </GraphCard>
    );
}
