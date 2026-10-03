import React, { useMemo, useState } from "react";
import { addDays, addWeeks, differenceInCalendarDays, format, startOfDay, startOfWeek } from "date-fns";
import { BarChart3, SearchX, Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { AGE_BRACKETS, ageBracket, matchesFilters, sexOf } from "./personStats";
import { LineKey, Swatch, Tip, useFloatingTip } from "./chartParts";

/**
 * Shared dashboard graph for the Casualties / Injured / Missing cards.
 * Views: stacked bars by cause/diagnosis, an age-sex pyramid, and a timeline of
 * reports. Series colors come from the --viz-* tokens in app.css (validated with
 * the dataviz palette checker); text always stays in text tokens.
 */

const SERIES = [
    { key: "Male", label: "Male", color: "var(--viz-male)" },
    { key: "Female", label: "Female", color: "var(--viz-female)" },
    { key: "Unknown", label: "Not specified", color: "var(--viz-unknown)" },
];

const ACCENT_TEXT = {
    destructive: "text-destructive",
    warning: "text-warning",
    info: "text-info",
};

const ROW_LIMIT = 5;

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

/** Reports over time: one column per day (or week for long spans). Single series, no legend. */
function Timeline({ timeline, color }) {
    const { buckets, weekly } = timeline;
    const max = Math.max(1, ...buckets.map((b) => b.count));
    const peak = buckets.reduce((best, b) => (b.count > best.count ? b : best), buckets[0]);
    const last = buckets[buckets.length - 1];
    const fmt = (d) => format(d, "MMM d");
    const tickIdx = buckets.length > 2 ? [0, Math.floor((buckets.length - 1) / 2), buckets.length - 1] : buckets.map((_, i) => i);

    return (
        <div>
            <p className="mb-6 text-xs text-muted-foreground">Reports received per {weekly ? "week" : "day"}</p>
            <div className="flex h-32 items-end gap-1 border-b border-[color:var(--viz-axis)]" role="list" aria-label={`Reports per ${weekly ? "week" : "day"}`}>
                {buckets.map((b) => {
                    const height = (b.count / max) * 100;
                    const labelled = b.count > 0 && (b === peak || b === last);
                    const when = weekly ? `Week of ${fmt(b.date)}` : format(b.date, "EEE, MMM d");
                    return (
                        <div
                            key={b.key}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${when}: ${b.count} report${b.count === 1 ? "" : "s"}`}
                            className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {labelled && (
                                <span
                                    className="absolute text-xs font-semibold tabular-nums text-foreground"
                                    style={{ bottom: `calc(${height}% + 2px)` }}
                                >
                                    {b.count}
                                </span>
                            )}
                            <div
                                className="w-full max-w-6 rounded-t-[4px] transition-[filter] group-hover:brightness-110"
                                style={{ height: `${height}%`, minHeight: b.count ? 2 : 0, background: color }}
                            />
                            <Tip className="bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap">
                                <p className="font-semibold tabular-nums text-foreground">
                                    {b.count} report{b.count === 1 ? "" : "s"}
                                </p>
                                <p className="text-muted-foreground">{when}</p>
                            </Tip>
                        </div>
                    );
                })}
            </div>
            <div className="relative mt-1.5 h-4 text-xs text-muted-foreground">
                {tickIdx.map((i, n) => (
                    <span
                        key={buckets[i].key}
                        className={`absolute whitespace-nowrap ${n === 0 ? "left-0" : n === tickIdx.length - 1 ? "right-0" : "-translate-x-1/2"}`}
                        style={n > 0 && n < tickIdx.length - 1 ? { left: `${((i + 0.5) / buckets.length) * 100}%` } : undefined}
                    >
                        {fmt(buckets[i].date)}
                    </span>
                ))}
            </div>
        </div>
    );
}

function DataTable({ view, rows, timeline, groupLabel }) {
    if (view === "time") {
        return (
            <table className="w-full text-sm">
                <caption className="sr-only">Reports per {timeline.weekly ? "week" : "day"}</caption>
                <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th scope="col" className="py-2 font-medium">{timeline.weekly ? "Week of" : "Date"}</th>
                        <th scope="col" className="py-2 text-right font-medium">Reports</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {timeline.buckets.map((b) => (
                        <tr key={b.key}>
                            <td className="py-1.5">{format(b.date, "MMM d, yyyy")}</td>
                            <td className="py-1.5 text-right tabular-nums">{b.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <caption className="sr-only">{view === "age" ? "By age group and sex" : `By ${groupLabel}`}</caption>
                <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th scope="col" className="py-2 pr-2 font-medium">{view === "age" ? "Age group" : groupLabel}</th>
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
// Card
// ---------------------------------------------------------------------------

const PersonBreakdownGraph = React.memo(function PersonBreakdownGraph({
    title,
    icon: Icon,
    items = [],
    groupKey,
    groupLabel,
    groupTab = groupLabel,
    unit,
    accent = "destructive",
    sex = "all",
    age = "all",
    defaultView = "group",
    seriesColor = "var(--viz-unknown)",
}) {
    const [view, setView] = useState(defaultView);
    const [asTable, setAsTable] = useState(false);
    const [showAll, setShowAll] = useState(false);
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
            Object.values(tally(filtered, (item) => item[groupKey]?.toString().trim() || "Not specified")).sort(
                (a, b) => b.total - a.total || a.label.localeCompare(b.label),
            ),
        [filtered, groupKey],
    );

    const byAge = useMemo(() => tally(filtered, (item) => ageBracket(item.age) || "none"), [filtered]);

    const timeline = useMemo(() => {
        const dates = filtered
            .map((item) => (item.created_at ? new Date(item.created_at) : null))
            .filter((d) => d && !Number.isNaN(d.getTime()));
        if (!dates.length) return null;

        const first = startOfDay(new Date(Math.min(...dates)));
        const last = startOfDay(new Date(Math.max(...dates)));
        const weekly = differenceInCalendarDays(last, first) > 20;
        const bucketOf = (d) => (weekly ? startOfWeek(d, { weekStartsOn: 1 }) : startOfDay(d));

        const perBucket = {};
        dates.forEach((d) => {
            const key = format(bucketOf(d), "yyyy-MM-dd");
            perBucket[key] = (perBucket[key] || 0) + 1;
        });

        const buckets = [];
        for (let d = bucketOf(first); d <= last; d = weekly ? addWeeks(d, 1) : addDays(d, 1)) {
            const key = format(d, "yyyy-MM-dd");
            buckets.push({ key, date: d, count: perBucket[key] || 0 });
        }
        return { weekly, buckets };
    }, [filtered]);

    const visibleGroupRows = showAll ? groupRows : groupRows.slice(0, ROW_LIMIT);
    const scrolls = (showAll && view === "group") || (asTable && view === "time");
    const ageRows = [...AGE_BRACKETS].map((b) => byAge[b] || emptyRow(b));
    const noAge = byAge.none?.total || 0;

    const views = [
        { key: "group", label: groupTab },
        { key: "age", label: "Age & sex" },
        { key: "time", label: "Timeline" },
    ];

    const toggle = (
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label={`${title} view`}>
            {views.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    aria-pressed={view === option.key}
                    onClick={() => setView(option.key)}
                    className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${
                        view === option.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const empty = (
        <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
            {Icon && !hasFilters ? (
                <Icon size={40} className="mb-3 opacity-60" aria-hidden="true" />
            ) : (
                <SearchX size={40} className="mb-3 opacity-60" aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-foreground">
                {items.length === 0 ? `No ${unit} reported yet` : "No records match the filters"}
            </p>
        </div>
    );

    const chart = () => {
        if (view === "group") {
            return (
                <CategoryBars
                    rows={visibleGroupRows}
                    total={total}
                    label={`By ${groupLabel}`}
                    max={Math.max(1, ...groupRows.map((r) => r.total))}
                />
            );
        }
        if (view === "age") return <AgePyramid byAge={byAge} total={total} noAge={noAge} unknownSex={counts.Unknown} />;
        return timeline ? <Timeline timeline={timeline} color={seriesColor} /> : <p className="py-6 text-center text-sm text-muted-foreground">No report dates available.</p>;
    };

    return (
        <GraphCard title={title} icon={Icon && <Icon size={24} />} actions={toggle}>
            {/* Headline + sex split (part-to-whole) */}
            <p className="flex items-baseline gap-2">
                <span className={`text-4xl font-semibold ${ACCENT_TEXT[accent]}`}>{total}</span>
                <span className="text-sm text-muted-foreground">
                    {unit}
                    {hasFilters && ` matching filters (of ${items.length})`}
                </span>
            </p>
            <div className="mt-3">
                <SexSplit counts={counts} total={total} />
            </div>

            <div className="mt-5 border-t pt-5">
                {total === 0 ? (
                    empty
                ) : (
                    <>
                        {/* Expanded lists and long tables scroll inside the card */}
                        <div
                            className={scrolls ? "max-h-80 overflow-y-auto overscroll-contain rounded-sm pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}
                            tabIndex={scrolls ? 0 : undefined}
                            role={scrolls ? "region" : undefined}
                            aria-label={scrolls ? `${title}: all ${view === "group" ? groupLabel.toLowerCase() : "dates"}` : undefined}
                        >
                            {asTable ? (
                                <DataTable
                                    view={view}
                                    rows={view === "age" ? ageRows : visibleGroupRows}
                                    timeline={timeline || { weekly: false, buckets: [] }}
                                    groupLabel={groupLabel}
                                />
                            ) : (
                                chart()
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {view === "group" && groupRows.length > ROW_LIMIT && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-2 text-muted-foreground"
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
                                className="h-9 gap-1.5 px-2 text-muted-foreground"
                                onClick={() => setAsTable((value) => !value)}
                            >
                                {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                                {asTable ? "View as chart" : "View as table"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </GraphCard>
    );
});

export default PersonBreakdownGraph;
