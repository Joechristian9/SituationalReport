import React, { useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, BarChart3, Equal, GitCompareArrows, LineChart as LineIcon, Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LineKey, Swatch } from "./chartParts";
import { cn } from "@/lib/utils";

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const FOCUS_COLOR = "var(--viz-place-1)";
const OTHER_COLOR = "var(--viz-unknown)";
const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortName = (name) => (name.length > 12 ? `${name.slice(0, 11)}…` : name);
const endedOn = (iso, pattern = "MMM d, yyyy") => (iso ? format(parseISO(iso), pattern) : "");
const VIEWS = [
    { key: "bar", label: "Bars", icon: BarChart3 },
    { key: "line", label: "Line", icon: LineIcon },
    { key: "table", label: "Table", icon: Table2 },
];
const ordinal = (n) => {
    const tens = n % 100;
    return `${n}${tens >= 11 && tens <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
};

function BarTooltip({ active, payload, lineLabel, hasAverage }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="font-medium text-foreground">{point.name}</p>
            <p className="mb-1.5 text-muted-foreground">
                {point.type ?? "Unspecified type"} · ended {endedOn(point.endedAt)}
            </p>
            <p className="flex items-center gap-2">
                <Swatch color={FOCUS_COLOR} />
                <span className="font-semibold tabular-nums text-foreground">{number(point.value)}</span>
                <span className="text-muted-foreground">{lineLabel}</span>
            </p>
            {hasAverage && (
                <p className="mt-1 flex items-center gap-2">
                    <LineKey color={OTHER_COLOR} dashed />
                    <span className="font-semibold tabular-nums text-foreground">{number(point.average)}</span>
                    <span className="text-muted-foreground">Average barangay</span>
                </p>
            )}
            <p className="mt-1.5 text-muted-foreground">Click to compare this disaster</p>
        </div>
    );
}

/** Up / down / about the same as the others, in words and an icon (never colour alone). */
function Change({ insight }) {
    if (insight.average === null) return null;
    if (insight.value === 0) return <span className="text-xs text-muted-foreground">none reported</span>;
    if (insight.average === 0) {
        return <span className="text-xs text-muted-foreground">others had none</span>;
    }
    const [Icon, text] = {
        above: [ArrowUp, `${insight.change}% above typical`],
        below: [ArrowDown, `${Math.abs(insight.change)}% below typical`],
        about: [Equal, "about typical"],
    }[insight.comparison];
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {text}
        </span>
    );
}

/** One measure for the chosen disaster next to the others' average. Choosing it charts that measure. */
function MeasureRow({ insight, compared, isCurrent, onChoose, disabled }) {
    const max = Math.max(1, insight.value, insight.average ?? 0);
    return (
        <button
            type="button"
            onClick={() => onChoose(insight.key)}
            disabled={disabled}
            aria-pressed={isCurrent}
            className={cn(
                "flex min-h-11 w-full cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                isCurrent ? "border-primary bg-muted" : "border-border bg-card",
            )}
        >
            <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <span className={cn("text-sm", isCurrent ? "font-semibold text-foreground" : "text-muted-foreground")}>{insight.label}</span>
                <span className="text-lg font-semibold tabular-nums text-foreground">{number(insight.value)}</span>
            </span>
            {compared && (
                <>
                    <span className="space-y-1" aria-hidden="true">
                        <span className="block h-1.5 rounded-full bg-muted">
                            <span className="block h-1.5 rounded-full" style={{ width: `${(insight.value / max) * 100}%`, background: FOCUS_COLOR }} />
                        </span>
                        <span className="block h-1.5 rounded-full bg-muted">
                            <span className="block h-1.5 rounded-full" style={{ width: `${(insight.average / max) * 100}%`, background: OTHER_COLOR }} />
                        </span>
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <Change insight={insight} />
                        <span className="text-xs tabular-nums text-muted-foreground">
                            typical {number(insight.average)}
                            {insight.value > 0 && ` · ${ordinal(insight.rank)} of ${insight.of}`}
                        </span>
                    </span>
                </>
            )}
        </button>
    );
}

/**
 * Every past disaster as a bar for the chosen measure, and one chosen disaster (the latest
 * by default) against the others of its type. All comparisons come from the server.
 */
export default function EventComparison({ series, focus, metric, metricLabel, lineLabel, where, onSelectEvent, onSelectMetric, disabled }) {
    const [view, setView] = useState("bar");
    const hasAverage = series.some((point) => point.average !== null);
    const others = focus.group.count - 1;
    const compared = others > 0;
    const typical = focus.insights.find((insight) => insight.key === metric)?.average;
    const inGroup = (point) => !focus.group.type || point.type === focus.group.type;
    const reported = series.filter((point) => point.value > 0).length;
    const measure = metricLabel.toLowerCase();
    // Its type had too few others, so the server compared it with every disaster instead.
    const sameTypeOthers = focus.type && !focus.group.type ? series.filter((point) => point.type === focus.type).length - 1 : null;
    const comparedWith = focus.group.type ? `the ${others} other ${focus.group.type.toLowerCase()} event${others === 1 ? "" : "s"}` : `all ${others} other disaster${others === 1 ? "" : "s"}`;

    const dotFor = ({ cx, cy, payload }) => {
        const isFocus = payload.id === focus.id;
        return (
            <circle key={payload.id} cx={cx} cy={cy} r={isFocus ? 6 : 3.5} fill={inGroup(payload) ? FOCUS_COLOR : OTHER_COLOR} fillOpacity={isFocus ? 1 : 0.5} stroke={isFocus ? "hsl(var(--card))" : "none"} strokeWidth={2} />
        );
    };

    const picker = (
        <Select value={String(focus.id)} onValueChange={(id) => onSelectEvent(Number(id))} disabled={disabled}>
            <SelectTrigger aria-label="Disaster to compare" className="h-11 w-full bg-card sm:w-64 md:h-9">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
                {[...series].reverse().map((point) => (
                    <SelectItem key={point.id} value={String(point.id)}>
                        {point.name} · {endedOn(point.endedAt, "MMM yyyy")}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <GraphCard title="Compare a disaster" icon={<GitCompareArrows size={24} />} actions={picker}>
            <p className="-mt-1 mb-3 text-sm text-muted-foreground">
                {metricLabel} per disaster {where}, oldest to newest. Click a disaster in the chart, or choose one, to compare it.
                {reported === 0 && ` No disaster has ${measure} reported ${where} yet, so the chart is empty. Choose another measure below.`}
                {reported > 0 && reported < series.length && ` Only ${reported} of ${series.length} disasters have ${measure} reported; the others show no bar.`}
            </p>

            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legend">
                <li className="flex items-center gap-1.5 text-foreground">
                    <Swatch color={FOCUS_COLOR} />
                    {focus.name}
                </li>
                <li className="flex items-center gap-1.5 text-foreground">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] opacity-40" style={{ background: FOCUS_COLOR }} aria-hidden="true" />
                    {focus.group.type ? `Other ${focus.group.type.toLowerCase()} events` : "Other disasters"}
                </li>
                {focus.group.type && (
                    <li className="flex items-center gap-1.5 text-foreground">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] opacity-40" style={{ background: OTHER_COLOR }} aria-hidden="true" />
                        Other types
                    </li>
                )}
                {compared && typical !== null && (
                    <li className="flex items-center gap-1.5 text-foreground">
                        <LineKey color="hsl(var(--foreground))" />
                        Typical ({number(typical)})
                    </li>
                )}
                {hasAverage && (
                    <li className="flex items-center gap-1.5 text-foreground">
                        <LineKey color={OTHER_COLOR} dashed />
                        Average barangay
                    </li>
                )}
            </ul>

            {view === "table" ? (
                <div className="max-h-80 overflow-auto rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label={`${metricLabel} per disaster table`}>
                    <table className="w-full text-sm">
                        <caption className="sr-only">{metricLabel} per disaster, oldest first</caption>
                        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th scope="col" className="py-2 pr-3 font-medium">Disaster</th>
                                <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                                <th scope="col" className="py-2 pr-3 font-medium">Ended</th>
                                <th scope="col" className="py-2 pr-3 text-right font-medium">{lineLabel}</th>
                                {hasAverage && <th scope="col" className="py-2 pr-3 text-right font-medium">Average barangay</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {series.map((point) => (
                                <tr key={point.id} className={cn("border-b last:border-0", point.id === focus.id && "bg-muted")} aria-current={point.id === focus.id || undefined}>
                                    <th scope="row" className={cn("py-2 pr-3 text-left text-foreground", point.id === focus.id ? "font-semibold" : "font-normal")}>
                                        <button type="button" className="cursor-pointer text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onSelectEvent(point.id)} disabled={disabled}>
                                            {point.name}
                                        </button>
                                    </th>
                                    <td className="py-2 pr-3 text-muted-foreground">{point.type ?? "—"}</td>
                                    <td className="py-2 pr-3 text-muted-foreground">{endedOn(point.endedAt)}</td>
                                    <td className="py-2 pr-3 text-right tabular-nums text-foreground">{number(point.value)}</td>
                                    {hasAverage && <td className="py-2 pr-3 text-right tabular-nums text-foreground">{number(point.average)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-64 w-full sm:h-72" role="img" aria-label={`${metricLabel} for each past disaster, ${focus.name} highlighted. Switch to Table for exact numbers.`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={series}
                            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                            barCategoryGap="15%"
                            className="cursor-pointer"
                            // Clicking anywhere in a disaster's column picks it, so the tap target is the full column.
                            onClick={(state) => {
                                const point = series[Number(state?.activeTooltipIndex)];
                                if (point && !disabled) onSelectEvent(point.id);
                            }}
                        >
                            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                            <XAxis dataKey="name" tickFormatter={shortName} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--viz-axis)" }} minTickGap={16} />
                            <YAxis allowDecimals={false} tickFormatter={number} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
                            <Tooltip content={<BarTooltip lineLabel={lineLabel} hasAverage={hasAverage} />} cursor={view === "bar" ? { fill: "hsl(var(--muted))" } : { stroke: "var(--viz-axis)", strokeWidth: 1 }} />
                            {view === "bar" ? (
                                <Bar dataKey="value" name={lineLabel} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                                    {series.map((point) => (
                                        <Cell key={point.id} fill={inGroup(point) ? FOCUS_COLOR : OTHER_COLOR} fillOpacity={point.id === focus.id ? 1 : 0.4} />
                                    ))}
                                </Bar>
                            ) : (
                                <Line dataKey="value" name={lineLabel} type="linear" stroke={FOCUS_COLOR} strokeOpacity={0.5} strokeWidth={2} dot={dotFor} activeDot={{ r: 6, stroke: "hsl(var(--card))", strokeWidth: 2 }} isAnimationActive={false} />
                            )}
                            {hasAverage && <Line dataKey="average" name="Average barangay" type="linear" stroke={OTHER_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} isAnimationActive={false} />}
                            {compared && typical !== null && <ReferenceLine y={typical} stroke="hsl(var(--foreground))" strokeWidth={1.5} ifOverflow="extendDomain" />}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-3 inline-flex rounded-lg border bg-muted/40 p-0.5" role="group" aria-label="Show as">
                {VIEWS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setView(key)}
                        aria-pressed={view === key}
                        className={cn(
                            "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm transition-colors md:min-h-9",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                            view === key ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-4 border-t pt-4" aria-live="polite">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{focus.name}</span>
                    {focus.type ? ` (${focus.type})` : ""}, ended {endedOn(focus.endedAt)}
                    {focus.isLatest && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Latest</span>}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {compared
                        ? `${sameTypeOthers !== null ? `Only ${sameTypeOthers} other ${focus.type.toLowerCase()} event${sameTypeOthers === 1 ? "" : "s"}, too few to compare with, so it is compared` : "Compared"} with ${comparedWith}. Typical is their average. Choose a measure to chart it.`
                        : "No other disaster to compare with yet. Choose a measure to chart it."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                    {focus.insights.map((insight) => (
                        <MeasureRow key={insight.key} insight={insight} compared={compared} isCurrent={insight.key === metric} onChoose={onSelectMetric} disabled={disabled} />
                    ))}
                </div>
            </div>
        </GraphCard>
    );
}
