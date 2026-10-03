import React, { useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addHours, format, parseISO } from "date-fns";
import { Activity, BarChart3, Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { IMPACT_SERIES, LineKey } from "./chartParts";

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
// Only three hues stay distinguishable when any line can cross any other
// (dataviz validator, all pairs, light + dark), so at most three are highlighted.
const PLACE_COLORS = ["var(--viz-place-1)", "var(--viz-place-2)", "var(--viz-place-3)"];
const MAX_HIGHLIGHT = PLACE_COLORS.length;
const MUTED_COLOR = "var(--viz-unknown)";
const TOOLTIP_ROWS = 10;
const EMPTY_PLACES = { ranking: [], hourly: [] };

const hourLabel = (iso) => format(parseISO(iso), "h a");
const hourRange = (iso) => {
    const start = parseISO(iso);
    return `${format(start, "MMM d, h:mm")}–${format(addHours(start, 1), "h:mm a")}`;
};
const placeLabel = (place) => (place.office ? `${place.name} (office)` : place.name);

/**
 * Color follows the barangay, never its rank: a barangay keeps its color while it
 * stays highlighted, and a newcomer takes the slot freed by the one that left.
 */
function useStableColors(keys) {
    const slots = useRef(new Map());
    const map = slots.current;
    [...map.keys()].forEach((key) => !keys.includes(key) && map.delete(key));
    keys.forEach((key) => {
        if (map.has(key)) return;
        const used = new Set(map.values());
        let slot = 0;
        while (used.has(slot)) slot++;
        map.set(key, slot);
    });
    return (key) => (map.has(key) ? PLACE_COLORS[map.get(key)] : null);
}

function MutedKey() {
    return <span className="inline-block h-px w-3 shrink-0" style={{ background: MUTED_COLOR }} aria-hidden="true" />;
}

/** Tooltip: the hour's non-zero series, largest first; values lead, labels follow. */
function HourTooltip({ active, payload, label, series, showZeros }) {
    if (!active || !payload?.length) return null;
    const values = series
        .map((s) => ({ ...s, value: payload.find((p) => p.dataKey === s.key)?.value ?? 0 }))
        .filter((s) => showZeros || s.value > 0)
        .sort((a, b) => (showZeros ? 0 : b.value - a.value));
    const listed = values.slice(0, TOOLTIP_ROWS);

    return (
        <div className="max-w-64 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="mb-1.5 text-muted-foreground">{hourRange(label)}</p>
            {listed.length === 0 ? (
                <p className="text-muted-foreground">No reports this hour</p>
            ) : (
                <ul className="space-y-1">
                    {listed.map((s) => (
                        <li key={s.key} className="flex items-center gap-2">
                            {s.muted ? <MutedKey /> : <LineKey color={s.color} />}
                            <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
                            <span className="truncate text-muted-foreground">{s.label}</span>
                        </li>
                    ))}
                </ul>
            )}
            {values.length > listed.length && <p className="mt-1 text-muted-foreground">+{values.length - listed.length} more</p>}
        </div>
    );
}

/** Every barangay that reported in the last 24 hours; click one to highlight its line. */
function Ranking({ rows, colorFor, onToggle, onReset, customized }) {
    return (
        <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">All barangays, last 24 hours ({rows.length})</h4>
                {customized && (
                    <button type="button" onClick={onReset} className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Highlight top 3
                    </button>
                )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Click a barangay to highlight its line (up to {MAX_HIGHLIGHT}).</p>
            {rows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No barangay reports in the last 24 hours.</p>
            ) : (
                <div className="mt-2 max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                        <caption className="sr-only">Barangays by number of reports in the last 24 hours</caption>
                        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th scope="col" className="py-2 pr-2 font-medium">Barangay</th>
                                {IMPACT_SERIES.map((s) => (
                                    <th key={s.key} scope="col" className="px-1.5 py-2 text-right font-medium">{s.label}</th>
                                ))}
                                <th scope="col" className="py-2 pl-1.5 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((row, i) => {
                                const color = colorFor(row.key);
                                return (
                                    <tr key={row.key} className={color ? "bg-muted/40" : undefined}>
                                        <th scope="row" className="p-0 text-left font-normal">
                                            <button
                                                type="button"
                                                onClick={() => onToggle(row.key)}
                                                aria-pressed={Boolean(color)}
                                                className="flex min-h-11 w-full cursor-pointer items-center gap-2 py-1.5 pr-2 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none md:min-h-9"
                                            >
                                                <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{i + 1}</span>
                                                {color ? <LineKey color={color} /> : <MutedKey />}
                                                <span className={`min-w-0 break-words ${color ? "font-medium text-foreground" : "text-foreground"}`}>{placeLabel(row)}</span>
                                            </button>
                                        </th>
                                        {IMPACT_SERIES.map((s) => (
                                            <td key={s.key} className="px-1.5 py-1.5 text-right tabular-nums text-muted-foreground">{row[s.key]}</td>
                                        ))}
                                        <td className="py-1.5 pl-1.5 text-right font-semibold tabular-nums text-foreground">{row.total}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/**
 * Line chart of reports filed each hour over the last 24 hours, either by type
 * (Dead / Injured / Missing) or by barangay (every barangay, up to 3 highlighted).
 */
export default function ImpactHourlyChart({ hourly = [], byBarangay = null }) {
    const [mode, setMode] = useState("type");
    const [asTable, setAsTable] = useState(false);
    const [picked, setPicked] = useState(null); // null = follow the current top 3
    const places = byBarangay || EMPTY_PLACES;
    const byPlace = mode === "barangay";

    const placeKeys = places.ranking.map((r) => r.key);
    const highlighted = (picked ?? placeKeys.slice(0, MAX_HIGHLIGHT)).filter((key) => placeKeys.includes(key));
    const colorFor = useStableColors(highlighted);
    const togglePlace = (key) =>
        setPicked((prev) => {
            const current = (prev ?? placeKeys.slice(0, MAX_HIGHLIGHT)).filter((k) => placeKeys.includes(k));
            return current.includes(key) ? current.filter((k) => k !== key) : [...current, key].slice(-MAX_HIGHLIGHT);
        });

    const series = byPlace
        ? places.ranking.map((r) => {
              const color = colorFor(r.key);
              return { key: r.key, label: placeLabel(r), color: color ?? MUTED_COLOR, muted: !color, total: r.total };
          })
        : IMPACT_SERIES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
    const data = byPlace ? places.hourly : hourly;
    const totalOf = (key) => data.reduce((sum, h) => sum + (h[key] || 0), 0);
    const hasReports = series.some((s) => totalOf(s.key) > 0);

    const shownSeries = series.filter((s) => !s.muted);
    const mutedSeries = series.filter((s) => s.muted);
    // Gray lines first so the highlighted ones are drawn on top.
    const drawOrder = [...mutedSeries, ...shownSeries];

    // Table view: one column per highlighted barangay, the rest summed.
    const tableColumns = byPlace
        ? [...shownSeries, ...(mutedSeries.length ? [{ key: "__rest", label: `Other barangays (${mutedSeries.length})` }] : [])]
        : series;
    const cell = (row, key) => (key === "__rest" ? mutedSeries.reduce((sum, s) => sum + (row[s.key] || 0), 0) : row[key] || 0);

    const toggle = (
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Chart view">
            {[
                { key: "type", label: "By type" },
                { key: "barangay", label: "By barangay" },
            ].map((o) => (
                <button
                    key={o.key}
                    type="button"
                    aria-pressed={mode === o.key}
                    onClick={() => setMode(o.key)}
                    className={`min-h-11 flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none md:min-h-0 ${
                        mode === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    const summary = byPlace
        ? `${series.length} barangays reported in the last 24 hours. Most reports: ${places.ranking
              .slice(0, 3)
              .map((r) => `${placeLabel(r)} ${r.total}`)
              .join(", ")}.`
        : `Reports filed per hour over the last 24 hours: ${series.map((s) => `${s.label} ${totalOf(s.key)}`).join(", ")}.`;

    const chart = !hasReports ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No reports filed in the last 24 hours.</p>
    ) : asTable ? (
        <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
                <caption className="sr-only">Reports filed per hour, last 24 hours</caption>
                <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th scope="col" className="py-2 pr-2 font-medium">Hour</th>
                        {tableColumns.map((c) => (
                            <th key={c.key} scope="col" className="px-2 py-2 text-right font-medium">{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {[...data].reverse().map((h) => (
                        <tr key={h.hour}>
                            <td className="py-1.5 pr-2">{hourRange(h.hour)}</td>
                            {tableColumns.map((c) => (
                                <td key={c.key} className="px-2 py-1.5 text-right tabular-nums">{cell(h, c.key)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ) : (
        <div className="h-64 w-full" role="img" aria-label={summary}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                    <XAxis
                        dataKey="hour"
                        tickFormatter={hourLabel}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={{ stroke: "var(--viz-axis)" }}
                        minTickGap={24}
                        padding={{ left: 8, right: 8 }}
                    />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<HourTooltip series={series} showZeros={!byPlace} />} cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }} />
                    {drawOrder.map((s) => (
                        <Line
                            key={s.key}
                            type="linear"
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={s.muted ? 1 : 2}
                            strokeOpacity={s.muted ? 0.45 : 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={false}
                            activeDot={s.muted ? false : { r: 5, fill: s.color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <GraphCard title="Last 24 hours" icon={<Activity size={24} />} actions={toggle}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                {byPlace
                    ? "Reports filed each hour, one line per barangay. Highlighted barangays are in color; the rest are gray."
                    : "Reports filed each hour, by type. Updates with the feed."}
            </p>

            <div className={byPlace ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}>
                <div className="min-w-0">
                    {/* Legend carries identity and the 24-hour total */}
                    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
                        {shownSeries.map((s) => (
                            <li key={s.key} className="flex items-center gap-1.5">
                                <LineKey color={s.color} />
                                {s.label}
                                <span className="font-semibold tabular-nums text-foreground">{totalOf(s.key)}</span>
                            </li>
                        ))}
                        {byPlace && mutedSeries.length > 0 && (
                            <li className="flex items-center gap-1.5">
                                <MutedKey />
                                Other barangays ({mutedSeries.length})
                            </li>
                        )}
                    </ul>
                    {chart}
                    {hasReports && (
                        <Button type="button" variant="ghost" size="sm" className="mt-3 h-9 gap-1.5 px-2 text-muted-foreground" onClick={() => setAsTable((v) => !v)}>
                            {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                            {asTable ? "View as chart" : "View as table"}
                        </Button>
                    )}
                </div>

                {byPlace && (
                    <Ranking
                        rows={places.ranking}
                        colorFor={colorFor}
                        onToggle={togglePlace}
                        onReset={() => setPicked(null)}
                        customized={picked !== null}
                    />
                )}
            </div>
        </GraphCard>
    );
}
