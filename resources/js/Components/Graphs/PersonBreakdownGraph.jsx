import React, { useMemo, useState } from "react";
import { BarChart3, SearchX, Table2, Users } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import ImpactFilters from "./ImpactFilters";
import { AGE_BRACKETS, ageBracket, matchesFilters, sexOf } from "./personStats";
import { LineKey, Swatch, Tip, useFloatingTip } from "./chartParts";

/**
 * "Who is affected": one dashboard panel for Dead / Injured / Missing. A switch picks the
 * type; the sex split and top causes sit beside the age-sex pyramid, all scoped by the
 * Sex / Age filters. Series colors come from the --viz-* tokens in app.css (validated with
 * the dataviz palette checker); text always stays in text tokens.
 */

const SERIES = [
    { key: "Male", label: "Male", color: "var(--viz-male)" },
    { key: "Female", label: "Female", color: "var(--viz-female)" },
    { key: "Unknown", label: "Not specified", color: "var(--viz-unknown)" },
];

const TYPES = [
    { key: "dead", label: "Dead", color: "var(--viz-dead)", groupKey: "cause_of_death", groupLabel: "Cause of death", groupTitle: "Top causes", unit: "casualties" },
    { key: "injured", label: "Injured", color: "var(--viz-injured)", groupKey: "diagnosis", groupLabel: "Diagnosis", groupTitle: "Top diagnoses", unit: "injured persons" },
    { key: "missing", label: "Missing", color: "var(--viz-missing)", groupKey: "cause", groupLabel: "Cause", groupTitle: "Top causes", unit: "missing persons" },
];

const ROW_LIMIT = 5;

const sectionTitle = "mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

const emptyRow = (label) => ({ label, Male: 0, Female: 0, Unknown: 0, total: 0 });

const tally = (items, keyFn) => {
    const map = {};
    items.forEach((item) => {
        const key = keyFn(item);
        if (!map[key]) map[key] = emptyRow(key);
        map[key][sexOf(item)] += 1;
        map[key].total += 1;
    });
    return map;
};

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const describe = (row) =>
    SERIES.filter((s) => row[s.key] > 0)
        .map((s) => `${row[s.key]} ${s.label.toLowerCase()}`)
        .join(", ");

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function SeriesTip({ row, total }) {
    return (
        <>
            <p className="mb-1.5 max-w-56 break-words text-muted-foreground">{row.label}</p>
            <ul className="space-y-1">
                {SERIES.filter((s) => row[s.key] > 0).map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                        <LineKey color={s.color} />
                        <span className="font-semibold tabular-nums text-foreground">{row[s.key]}</span>
                        <span className="text-muted-foreground">{s.label}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-1.5 border-t pt-1.5 text-muted-foreground">
                <span className="font-semibold text-foreground">{pct(row.total, total)}%</span> of all records
            </p>
        </>
    );
}

/** Part-to-whole: one stacked bar of the sex split, with a legend that carries the numbers. */
function SexSplit({ counts, total }) {
    const parts = SERIES.filter((s) => counts[s.key] > 0);
    if (!total) return null;

    return (
        <div>
            <div
                className="flex h-3 w-full gap-[2px]"
                role="img"
                aria-label={`By sex: ${parts.map((s) => `${counts[s.key]} ${s.label.toLowerCase()}`).join(", ")}`}
            >
                {parts.map((s, i) => (
                    <div
                        key={s.key}
                        className={`${i === 0 ? "rounded-l-[4px]" : ""} ${i === parts.length - 1 ? "rounded-r-[4px]" : ""}`}
                        style={{ flexGrow: counts[s.key], flexBasis: 0, background: s.color }}
                    />
                ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {SERIES.filter((s) => s.key !== "Unknown" || counts.Unknown > 0).map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5 text-muted-foreground">
                        <Swatch color={s.color} />
                        {s.label}
                        <span className="font-semibold tabular-nums text-foreground">{counts[s.key]}</span>
                        <span className="text-xs tabular-nums">({pct(counts[s.key], total)}%)</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/** Horizontal stacked bars (long category names stay readable, no rotated labels). */
function CategoryBars({ rows, total, label, max: maxOverride }) {
    const max = maxOverride || Math.max(1, ...rows.map((r) => r.total));
    const tip = useFloatingTip();

    return (
        <ul className="space-y-3" aria-label={label}>
            {tip.node}
            {rows.map((row) => {
                const parts = SERIES.filter((s) => row[s.key] > 0);
                return (
                    <li
                        key={row.label}
                        tabIndex={0}
                        aria-label={`${row.label}: ${row.total} (${describe(row)})`}
                        className="group rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        {...tip.bind(<SeriesTip row={row} total={total} />)}
                    >
                        <p className="mb-1 break-words text-sm text-foreground">{row.label}</p>
                        <div className="flex items-center gap-2 border-l border-[color:var(--viz-axis)]">
                            <div
                                className="flex h-4 max-w-[calc(100%-2.5rem)] gap-[2px] transition-[filter] group-hover:brightness-110"
                                style={{ width: `${(row.total / max) * 100}%` }}
                            >
                                {parts.map((s, i) => (
                                    <div
                                        key={s.key}
                                        className={i === parts.length - 1 ? "rounded-r-[4px]" : ""}
                                        style={{ flexGrow: row[s.key], flexBasis: 0, background: s.color }}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-foreground">{row.total}</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/** Age-sex pyramid: male to the left, female to the right, oldest at the top. */
function AgePyramid({ byAge, total, noAge, unknownSex }) {
    const rows = [...AGE_BRACKETS].reverse().map((b) => byAge[b] || emptyRow(b));
    const max = Math.max(1, ...rows.map((r) => Math.max(r.Male, r.Female)));
    const width = (n) => `calc((100% - 1.75rem) * ${n / max})`;

    return (
        <div>
            <div className="mb-2 grid grid-cols-[1fr_3.25rem_1fr] text-xs text-muted-foreground">
                <span className="flex items-center justify-end gap-1.5 pr-1">
                    Male <Swatch color={SERIES[0].color} />
                </span>
                <span className="text-center">Age</span>
                <span className="flex items-center gap-1.5 pl-1">
                    <Swatch color={SERIES[1].color} /> Female
                </span>
            </div>
            <ul className="space-y-1.5" aria-label="By age group and sex">
                {rows.map((row) => (
                    <li
                        key={row.label}
                        tabIndex={0}
                        aria-label={`Age ${row.label}: ${row.Male} male, ${row.Female} female`}
                        className="group relative grid grid-cols-[1fr_3.25rem_1fr] items-center rounded-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="flex h-6 items-center justify-end gap-1.5 border-r border-[color:var(--viz-axis)]">
                            {row.Male > 0 && <span className="text-xs font-semibold tabular-nums text-foreground">{row.Male}</span>}
                            <div className="h-4 rounded-l-[4px]" style={{ width: width(row.Male), background: SERIES[0].color }} />
                        </div>
                        <span className="text-center text-xs font-medium tabular-nums text-muted-foreground">{row.label}</span>
                        <div className="flex h-6 items-center gap-1.5 border-l border-[color:var(--viz-axis)]">
                            <div className="h-4 rounded-r-[4px]" style={{ width: width(row.Female), background: SERIES[1].color }} />
                            {row.Female > 0 && <span className="text-xs font-semibold tabular-nums text-foreground">{row.Female}</span>}
                        </div>
                        <Tip className="bottom-full left-1/2 mb-1 -translate-x-1/2">
                            <SeriesTip row={{ ...row, label: `Age ${row.label}` }} total={total} />
                        </Tip>
                    </li>
                ))}
            </ul>
            {(noAge > 0 || unknownSex > 0) && (
                <p className="mt-3 text-xs text-muted-foreground">
                    {[noAge > 0 && `${noAge} without an age`, unknownSex > 0 && `${unknownSex} with sex not specified`]
                        .filter(Boolean)
                        .join(" · ")}{" "}
                    not shown in the pyramid.
                </p>
            )}
        </div>
    );
}

/** Male / Female / N/S counts per row, for "View as table". */
function DataTable({ caption, rowLabel, rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <caption className="sr-only">{caption}</caption>
                <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th scope="col" className="py-2 pr-2 font-medium">{rowLabel}</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Male</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Female</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">N/S</th>
                        <th scope="col" className="py-2 pl-2 text-right font-medium">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.map((r) => (
                        <tr key={r.label}>
                            <td className="py-1.5 pr-2">{r.label}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.Male}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.Female}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.Unknown}</td>
                            <td className="py-1.5 pl-2 text-right font-semibold tabular-nums">{r.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

const PersonBreakdownGraph = React.memo(function PersonBreakdownGraph({ casualties = [], injured = [], missing = [] }) {
    const [typeKey, setTypeKey] = useState("dead");
    const [sex, setSex] = useState("all");
    const [age, setAge] = useState("all");
    const [asTable, setAsTable] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const itemsByType = { dead: casualties, injured, missing };
    const type = TYPES.find((t) => t.key === typeKey);
    const items = itemsByType[typeKey];
    const hasFilters = sex !== "all" || age !== "all";

    const filtered = useMemo(() => items.filter((item) => matchesFilters(item, { sex, age })), [items, sex, age]);
    const total = filtered.length;

    const counts = useMemo(() => {
        const c = { Male: 0, Female: 0, Unknown: 0 };
        filtered.forEach((item) => (c[sexOf(item)] += 1));
        return c;
    }, [filtered]);

    const groupRows = useMemo(
        () =>
            Object.values(tally(filtered, (item) => item[type.groupKey]?.toString().trim() || "Not specified")).sort(
                (a, b) => b.total - a.total || a.label.localeCompare(b.label),
            ),
        [filtered, type.groupKey],
    );

    const byAge = useMemo(() => tally(filtered, (item) => ageBracket(item.age) || "none"), [filtered]);

    const visibleGroupRows = showAll ? groupRows : groupRows.slice(0, ROW_LIMIT);
    const ageRows = AGE_BRACKETS.map((b) => byAge[b] || emptyRow(b));
    const noAge = byAge.none?.total || 0;

    const pickType = (key) => {
        setTypeKey(key);
        setShowAll(false);
    };

    return (
        <section aria-labelledby="who-affected-title" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/*
              * Header. Phones: title with the Filters button in the corner, the type switch
              * full width below. md and up: title, then the switch and the filter pills on the right.
              */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
                <div className="mr-auto flex items-center gap-3">
                    <span className="rounded-lg bg-primary/10 p-2 text-primary ring-1 ring-inset ring-primary/15" aria-hidden="true">
                        <Users size={22} />
                    </span>
                    <h3 id="who-affected-title" className="text-lg font-semibold text-foreground">
                        Who is affected
                    </h3>
                </div>
                <div className="md:order-3">
                    <ImpactFilters sex={sex} age={age} onSexChange={setSex} onAgeChange={setAge} />
                </div>
                <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1 md:order-2 md:inline-grid md:w-auto" role="group" aria-label="Show">
                    {TYPES.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={typeKey === t.key}
                            onClick={() => pickType(t.key)}
                            className={cn(
                                "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:min-h-9",
                                typeKey === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Swatch color={t.color} />
                            {t.label}
                            <span className="tabular-nums text-muted-foreground">{itemsByType[t.key].length}</span>
                        </button>
                    ))}
                </div>
            </div>

            {total === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center text-muted-foreground">
                    <SearchX size={40} className="mb-3 opacity-60" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">
                        {items.length === 0 ? `No ${type.unit} reported yet` : "No records match the filters"}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
                        <div className="min-w-0 space-y-6 p-4 sm:p-6">
                            <div>
                                <h4 className={sectionTitle}>
                                    Sex
                                    {hasFilters && (
                                        <span className="ml-2 font-normal normal-case tracking-normal">
                                            {total} of {items.length} {type.unit} match the filters
                                        </span>
                                    )}
                                </h4>
                                <SexSplit counts={counts} total={total} />
                            </div>
                            <div>
                                <h4 className={sectionTitle}>{type.groupTitle}</h4>
                                {/* The full list scrolls inside the panel. */}
                                <div
                                    className={showAll ? "max-h-80 overflow-y-auto overscroll-contain rounded-sm pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}
                                    tabIndex={showAll ? 0 : undefined}
                                    role={showAll ? "region" : undefined}
                                    aria-label={showAll ? `All ${type.groupLabel.toLowerCase()}` : undefined}
                                >
                                    {asTable ? (
                                        <DataTable caption={`${type.label} by ${type.groupLabel.toLowerCase()}`} rowLabel={type.groupLabel} rows={visibleGroupRows} />
                                    ) : (
                                        <CategoryBars
                                            rows={visibleGroupRows}
                                            total={total}
                                            label={`${type.label} by ${type.groupLabel.toLowerCase()}`}
                                            max={Math.max(1, ...groupRows.map((r) => r.total))}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="min-w-0 border-t border-border p-4 sm:p-6 lg:border-t-0">
                            <h4 className={sectionTitle}>Age &amp; sex</h4>
                            {asTable ? (
                                <DataTable caption={`${type.label} by age group and sex`} rowLabel="Age group" rows={ageRows} />
                            ) : (
                                <AgePyramid byAge={byAge} total={total} noAge={noAge} unknownSex={counts.Unknown} />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border px-2 py-2 sm:px-4">
                        {groupRows.length > ROW_LIMIT && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-11 px-2 text-muted-foreground md:h-9"
                                aria-expanded={showAll}
                                onClick={() => setShowAll((value) => !value)}
                            >
                                {showAll ? `Show top ${ROW_LIMIT}` : `Show all ${groupRows.length}`}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-11 gap-1.5 px-2 text-muted-foreground md:h-9"
                            onClick={() => setAsTable((value) => !value)}
                        >
                            {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                            {asTable ? "View as charts" : "View as tables"}
                        </Button>
                    </div>
                </>
            )}
        </section>
    );
});

export default PersonBreakdownGraph;

