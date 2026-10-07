import React, { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { BarChart3, LineChart as LineIcon, Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { LineKey } from "./chartParts";

const AXIS_TICK = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const LINE_COLOR = "var(--viz-place-1)";
const AVERAGE_COLOR = "var(--viz-unknown)";
const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortName = (name) => (name.length > 12 ? `${name.slice(0, 11)}…` : name);
const endedOn = (iso) => (iso ? format(parseISO(iso), "MMM d, yyyy") : "");

function PointTooltip({ active, payload, lineLabel, hasAverage }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="font-medium text-foreground">{point.name}</p>
            <p className="mb-1.5 text-muted-foreground">
                {point.type ?? "Unspecified type"} · ended {endedOn(point.endedAt)}
            </p>
            <p className="flex items-center gap-2">
                <LineKey color={LINE_COLOR} />
                <span className="font-semibold tabular-nums text-foreground">{number(point.value)}</span>
                <span className="text-muted-foreground">{lineLabel}</span>
            </p>
            {hasAverage && (
                <p className="mt-1 flex items-center gap-2">
                    <LineKey color={AVERAGE_COLOR} dashed />
                    <span className="font-semibold tabular-nums text-foreground">{number(point.average)}</span>
                    <span className="text-muted-foreground">Average barangay</span>
                </p>
            )}
        </div>
    );
}

/** The chosen measure for each past disaster, oldest to newest. */
export default function HistoryTrendChart({ series, metricLabel, lineLabel }) {
    const [asTable, setAsTable] = useState(false);
    const hasAverage = series.some((point) => point.average !== null);

    return (
        <GraphCard title={`${metricLabel} per disaster`} icon={<LineIcon size={24} />}>
            {hasAverage && (
                <ul className="-mt-1 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legend">
                    <li className="flex items-center gap-1.5 text-foreground">
                        <LineKey color={LINE_COLOR} />
                        {lineLabel}
                    </li>
                    <li className="flex items-center gap-1.5 text-foreground">
                        <LineKey color={AVERAGE_COLOR} dashed />
                        Average barangay
                    </li>
                </ul>
            )}
            {!hasAverage && <p className="-mt-2 mb-3 text-sm text-muted-foreground">{lineLabel}. Pick a barangay above to compare it with the average barangay.</p>}

            {asTable ? (
                <div className="max-h-80 overflow-auto rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label={`${metricLabel} per disaster table`}>
                    <table className="w-full text-sm">
                        <caption className="sr-only">{metricLabel} per disaster, oldest first</caption>
                        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th scope="col" className="py-2 pr-3 font-medium">Disaster</th>
                                <th scope="col" className="py-2 pr-3 font-medium">Ended</th>
                                <th scope="col" className="py-2 pr-3 text-right font-medium">{lineLabel}</th>
                                {hasAverage && <th scope="col" className="py-2 pr-3 text-right font-medium">Average barangay</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {series.map((point) => (
                                <tr key={point.id} className="border-b last:border-0">
                                    <th scope="row" className="py-2 pr-3 text-left font-normal text-foreground">{point.name}</th>
                                    <td className="py-2 pr-3 text-muted-foreground">{endedOn(point.endedAt)}</td>
                                    <td className="py-2 pr-3 text-right tabular-nums text-foreground">{number(point.value)}</td>
                                    {hasAverage && <td className="py-2 pr-3 text-right tabular-nums text-foreground">{number(point.average)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-72 w-full" role="img" aria-label={`${metricLabel} per disaster for ${lineLabel}. Use View as table for exact numbers.`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                            <XAxis dataKey="name" tickFormatter={shortName} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--viz-axis)" }} minTickGap={16} />
                            <YAxis allowDecimals={false} tickFormatter={number} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
                            <Tooltip content={<PointTooltip lineLabel={lineLabel} hasAverage={hasAverage} />} cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }} />
                            {hasAverage && (
                                <Line dataKey="average" name="Average barangay" type="monotone" stroke={AVERAGE_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} isAnimationActive={false} />
                            )}
                            <Line
                                dataKey="value"
                                name={lineLabel}
                                type="monotone"
                                stroke={LINE_COLOR}
                                strokeWidth={2}
                                dot={series.length <= 12 ? { r: 3, fill: LINE_COLOR, strokeWidth: 0 } : false}
                                activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-4">
                <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-muted-foreground" onClick={() => setAsTable((v) => !v)}>
                    {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                    {asTable ? "View as chart" : "View as table"}
                </Button>
            </div>
        </GraphCard>
    );
}
