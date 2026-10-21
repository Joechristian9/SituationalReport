import React, { useCallback, useMemo, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import SearchBar from "@/Components/ui/SearchBar";
import { EmptyState } from "@/Components/data/DataView";
import { buildSuggestions } from "@/lib/searchSuggestions";
import { cn } from "@/lib/utils";

// Keys match the per-barangay totals the server sends (`total_persons`, `inside_families`, ...).
const VIEWS = [
    { key: "total", label: "Total" },
    { key: "inside", label: "Inside" },
    { key: "outside", label: "Outside" },
];
const TOP = 10;
const SPLIT = [
    { key: "inside", label: "Inside centers" },
    { key: "outside", label: "Outside centers" },
];

function Counts({ persons, families }) {
    return (
        <span>
            <span className="font-semibold tabular-nums text-foreground">{persons.toLocaleString()}</span> persons ·{" "}
            <span className="tabular-nums">{families.toLocaleString()}</span> families
        </span>
    );
}

// Visual only: the numbers beside it carry the same information.
function Bar({ value, max, className }) {
    return (
        <span className={cn("block h-2 rounded-full bg-muted", className)} aria-hidden="true">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
        </span>
    );
}

function Tile({ label, value }) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</p>
        </div>
    );
}

/** Evacuees per barangay (inside / outside evacuation centers, or both), most evacuated first. */
export default function EvacuationGraph({ preEmptiveReports = [], evacuationType = "total", onEvacuationTypeChange, searchQuery = "", onSearchChange }) {
    const [showAll, setShowAll] = useState(false);
    const [open, setOpen] = useState(() => new Set());
    const toggle = (barangay) =>
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(barangay) ? next.delete(barangay) : next.add(barangay);
            return next;
        });
    const persons = `${evacuationType}_persons`;
    const families = `${evacuationType}_families`;

    const suggest = useCallback((text) => buildSuggestions(preEmptiveReports, ["barangay"], text), [preEmptiveReports]);

    const rows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return preEmptiveReports
            .filter((r) => (r[persons] > 0 || r[families] > 0) && (!query || r.barangay.toLowerCase().includes(query)))
            .sort((a, b) => b[persons] - a[persons] || a.barangay.localeCompare(b.barangay));
    }, [preEmptiveReports, persons, families, searchQuery]);

    const totalPersons = rows.reduce((sum, r) => sum + r[persons], 0);
    const totalFamilies = rows.reduce((sum, r) => sum + r[families], 0);
    const max = rows[0]?.[persons] || 1;
    const shown = showAll ? rows : rows.slice(0, TOP);
    const viewLabel = evacuationType === "total" ? "" : ` ${evacuationType} evacuation centers`;

    const controls = (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Evacuees shown">
                {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        type="button"
                        aria-pressed={evacuationType === v.key}
                        onClick={() => onEvacuationTypeChange(v.key)}
                        className={cn(
                            "min-h-11 flex-1 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors sm:flex-none md:min-h-9",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                            evacuationType === v.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
            <div className="min-w-0 sm:w-56">
                <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="Search barangay" suggest={suggest} />
            </div>
        </div>
    );

    return (
        <GraphCard title="Evacuation" icon={<Users size={24} />} actions={controls}>
            {preEmptiveReports.length === 0 ? (
                <EmptyState icon={Users} title="No evacuees reported for this disaster yet" description="Evacuees appear here once the Pre-emptive Evacuation form is filed for a barangay." />
            ) : (
                <>
                    <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                        <Tile label="Persons" value={totalPersons} />
                        <Tile label="Families" value={totalFamilies} />
                        <Tile label="Barangays" value={rows.length} />
                    </div>

                    {rows.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={searchQuery ? `No barangay matches “${searchQuery}”` : `No evacuees${viewLabel}`}
                            description={searchQuery ? "Check the spelling or clear the search." : "Switch the view to see the other evacuees."}
                        />
                    ) : (
                        <>
                            <ol className="space-y-1" aria-label={`Barangays by evacuees${viewLabel}, most first. Tap one for inside and outside counts.`}>
                                {shown.map((r) => {
                                    const expanded = open.has(r.barangay);
                                    const id = `evac-${r.barangay.replace(/\W+/g, "-")}`;
                                    return (
                                        <li key={r.barangay} className="text-sm">
                                            <button
                                                type="button"
                                                onClick={() => toggle(r.barangay)}
                                                aria-expanded={expanded}
                                                aria-controls={id}
                                                className={cn(
                                                    "-mx-2 block w-[calc(100%+1rem)] cursor-pointer rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60 motion-reduce:transition-none",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    "sm:grid sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                                                )}
                                            >
                                                <span className="flex items-baseline justify-between gap-3 sm:contents">
                                                    <span className="min-w-0 break-words font-medium text-foreground">{r.barangay}</span>
                                                    <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground sm:order-last">
                                                        <Counts persons={r[persons]} families={r[families]} />
                                                        <ChevronDown className={cn("h-4 w-4 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" />
                                                    </span>
                                                </span>
                                                <Bar value={r[persons]} max={max} className="mt-1.5 sm:mt-0" />
                                            </button>
                                            {expanded && (
                                                <dl id={id} className="mb-1 mt-1 space-y-2 rounded-lg bg-muted/40 p-3">
                                                    {/* Split of this barangay's total, whatever the view above shows. */}
                                                    {SPLIT.map(({ key, label }) => (
                                                        <div key={key} className="sm:grid sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                                                            <div className="flex items-baseline justify-between gap-3 sm:contents">
                                                                <dt className="text-muted-foreground">{label}</dt>
                                                                <dd className="text-muted-foreground sm:order-last">
                                                                    <Counts persons={r[`${key}_persons`]} families={r[`${key}_families`]} />
                                                                </dd>
                                                            </div>
                                                            <Bar value={r[`${key}_persons`]} max={r.total_persons || 1} className="mt-1 sm:mt-0" />
                                                        </div>
                                                    ))}
                                                </dl>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                            {rows.length > TOP && (
                                <button
                                    type="button"
                                    onClick={() => setShowAll((v) => !v)}
                                    aria-expanded={showAll}
                                    className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-border text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:min-h-9"
                                >
                                    {showAll ? `Show top ${TOP}` : `Show all ${rows.length} barangays`}
                                </button>
                            )}
                        </>
                    )}
                </>
            )}
        </GraphCard>
    );
}
