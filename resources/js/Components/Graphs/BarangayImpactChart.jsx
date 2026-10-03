import React, { useState } from "react";
import { BarChart3, MapPin, Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { IMPACT_SERIES, LineKey, Swatch, Tip } from "./chartParts";

const ROW_LIMIT = 10;

const describe = (row) =>
    IMPACT_SERIES.filter((s) => row[s.key] > 0)
        .map((s) => `${row[s.key]} ${s.label.toLowerCase()}`)
        .join(", ");

/**
 * Bar chart: affected persons by barangay (the submitting barangay account),
 * horizontal stacked bars so long barangay names stay readable.
 */
export default function BarangayImpactChart({ rows = [] }) {
    const [showAll, setShowAll] = useState(false);
    const [asTable, setAsTable] = useState(false);

    const visible = showAll ? rows : rows.slice(0, ROW_LIMIT);
    const max = Math.max(1, ...rows.map((r) => r.total));
    const grand = rows.reduce((sum, r) => sum + r.total, 0);
    const barangayCount = rows.filter((r) => !r.office).length;

    return (
        <GraphCard title="Affected persons by barangay" icon={<MapPin size={24} />}>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                Grouped by the barangay account that submitted each report.
                {rows.length > 0 &&
                    (barangayCount > 0
                        ? ` ${barangayCount} barangay${barangayCount === 1 ? "" : "s"} reporting.`
                        : " No barangay account has reported yet; all reports so far came from city office accounts.")}
            </p>

            <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
                {IMPACT_SERIES.map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5">
                        <Swatch color={s.color} />
                        {s.label}
                    </li>
                ))}
            </ul>

            {rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No dead, injured or missing persons reported yet.</p>
            ) : asTable ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <caption className="sr-only">Affected persons by barangay</caption>
                        <thead className="text-left text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th scope="col" className="py-2 pr-2 font-medium">Barangay</th>
                                {IMPACT_SERIES.map((s) => (
                                    <th key={s.key} scope="col" className="px-2 py-2 text-right font-medium">{s.label}</th>
                                ))}
                                <th scope="col" className="py-2 pl-2 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {visible.map((r) => (
                                <tr key={r.name}>
                                    <td className="py-1.5 pr-2">
                                        {r.name}
                                        {r.office && <span className="ml-1.5 text-xs text-muted-foreground">(office)</span>}
                                    </td>
                                    {IMPACT_SERIES.map((s) => (
                                        <td key={s.key} className="px-2 py-1.5 text-right tabular-nums">{r[s.key]}</td>
                                    ))}
                                    <td className="py-1.5 pl-2 text-right font-semibold tabular-nums">{r.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ul className="space-y-3" aria-label="Affected persons by barangay">
                    {visible.map((row) => {
                        const parts = IMPACT_SERIES.filter((s) => row[s.key] > 0);
                        return (
                            <li
                                key={row.name}
                                tabIndex={0}
                                aria-label={`${row.name}${row.office ? " (office)" : ""}: ${row.total} (${describe(row)})`}
                                className="group relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <p className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm text-foreground">
                                    <span className="break-words">{row.name}</span>
                                    {row.office && (
                                        <span className="rounded border px-1.5 text-[11px] leading-4 text-muted-foreground">City office</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 border-l border-[color:var(--viz-axis)]">
                                    <div
                                        className="flex h-5 max-w-[calc(100%-2.5rem)] gap-[2px] transition-[filter] group-hover:brightness-110"
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
                                <Tip className="bottom-full left-0 mb-1">
                                    <p className="mb-1.5 text-muted-foreground">{row.name}</p>
                                    <ul className="space-y-1">
                                        {IMPACT_SERIES.map((s) => (
                                            <li key={s.key} className="flex items-center gap-2">
                                                <LineKey color={s.color} />
                                                <span className="font-semibold tabular-nums text-foreground">{row[s.key]}</span>
                                                <span className="text-muted-foreground">{s.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-1.5 border-t pt-1.5 text-muted-foreground">
                                        <span className="font-semibold text-foreground">{grand ? Math.round((row.total / grand) * 100) : 0}%</span> of all affected
                                    </p>
                                </Tip>
                            </li>
                        );
                    })}
                </ul>
            )}

            {rows.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {rows.length > ROW_LIMIT && (
                        <Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={() => setShowAll((v) => !v)}>
                            {showAll ? `Show top ${ROW_LIMIT}` : `Show all ${rows.length}`}
                        </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-muted-foreground" onClick={() => setAsTable((v) => !v)}>
                        {asTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
                        {asTable ? "View as chart" : "View as table"}
                    </Button>
                </div>
            )}
        </GraphCard>
    );
}
