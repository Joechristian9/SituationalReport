import React, { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { BarChart3, Table2, TrendingUp } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { IMPACT_SERIES, LineKey } from "./chartParts";

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const dayLabel = (iso) => format(parseISO(iso), "MMM d");

/** One tooltip, every series; values lead, labels follow. */
function TrendTooltip({ active, payload, label, cumulative }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="mb-1.5 text-muted-foreground">
                {format(parseISO(label), "EEE, MMM d, yyyy")}
                {cumulative ? " · running total" : " · new reports"}
            </p>
            <ul className="space-y-1">
                {IMPACT_SERIES.map((s) => {
                    const entry = payload.find((p) => p.dataKey === s.key);
                    return (
                        <li key={s.key} className="flex items-center gap-2">
                            <LineKey color={s.color} />
                            <span className="font-semibold tabular-nums text-foreground">{entry?.value ?? 0}</span>
                            <span className="text-muted-foreground">{s.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * Line chart: Dead / Injured / Missing over time (by report date), as a running
 * total or as new reports per day.
 */
export default function ImpactTrendChart({ trend = [] }) {
    const [mode, setMode] = useState("cumulative");
    const [asTable, setAsTable] = useState(false);
    const cumulative = mode === "cumulative";

    const data = useMemo(() => {
        if (!cumulative) return trend;
        const running = { dead: 0, injured: 0, missing: 0 };
        return trend.map((d) => {
            IMPACT_SERIES.forEach((s) => (running[s.key] += d[s.key]));
            return { date: d.date, ...running };
        });
    }, [trend, cumulative]);

    const latest = data[data.length - 1];
    const singleDay = data.length === 1;

    const toggle = (
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Trend mode">
            {[
                { key: "cumulative", label: "Running total" },
                { key: "daily", label: "Per day" },
            ].map((o) => (
                <button
                    key={o.key}
                    type="button"
                    aria-pressed={mode === o.key}
                    onClick={() => setMode(o.key)}
                    className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${
                        mode === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <GraphCard title="Trend over time" icon={<TrendingUp size={24} />} actions={toggle}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                {cumulative ? "Total reported so far, by date the report was filed." : "New reports filed each day."}
            </p>

            {/* Legend carries identity and the latest value */}
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
                {IMPACT_SERIES.map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5">
                        <LineKey color={s.color} />
                        {s.label}
                        {latest && <span className="font-semibold tabular-nums text-foreground">{latest[s.key]}</span>}
                    </li>
                ))}
            </ul>

            {data.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No reports filed yet.</p>
            ) : asTable ? (
                <div className="max-h-72 overflow-auto">
                    <table className="w-full text-sm">
                        <caption className="sr-only">{cumulative ? "Running total by date" : "New reports per day"}</caption>
                        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th scope="col" className="py-2 pr-2 font-medium">Date</th>
                                {IMPACT_SERIES.map((s) => (
                                    <th key={s.key} scope="col" className="px-2 py-2 text-right font-medium">{s.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.map((d) => (
                                <tr key={d.date}>
                                    <td className="py-1.5 pr-2">{format(parseISO(d.date), "MMM d, yyyy")}</td>
                                    {IMPACT_SERIES.map((s) => (
                                        <td key={s.key} className="px-2 py-1.5 text-right tabular-nums">{d[s.key]}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <>
                    <div
                        className="h-64 w-full"
                        role="img"
                        aria-label={`${cumulative ? "Running total" : "New reports per day"} from ${dayLabel(data[0].date)} to ${dayLabel(latest.date)}: ${IMPACT_SERIES.map((s) => `${latest[s.key]} ${s.label.toLowerCase()}`).join(", ")} on the latest day.`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                                <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={dayLabel}
                                    tick={AXIS_TICK}
                                    tickLine={false}
                                    axisLine={{ stroke: "var(--viz-axis)" }}
                                    minTickGap={24}
                                    padding={singleDay ? { left: 40, right: 40 } : { left: 8, right: 8 }}
                                />
                                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                                <Tooltip content={<TrendTooltip cumulative={cumulative} />} cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }} />
                                {IMPACT_SERIES.map((s) => (
                                    <Line
                                        key={s.key}
                                        type="linear"
                                        dataKey={s.key}
                                        name={s.label}
                                        stroke={s.color}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        dot={singleDay ? { r: 4, fill: s.color, stroke: "hsl(var(--card))", strokeWidth: 2 } : false}
                                        activeDot={{ r: 5, fill: s.color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {singleDay && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            All reports so far were filed on {format(parseISO(data[0].date), "MMM d, yyyy")}. A trend line appears once reports span more than one day.
                        </p>
                    )}
                </>
            )}

            {data.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="mt-3 h-9 gap-1.5 px-2 text-muted-foreground" onClick={() => setAsTable((v) => !v)}>
                    {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                    {asTable ? "View as chart" : "View as table"}
                </Button>
            )}
        </GraphCard>
    );
}
