import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { format, parseISO } from "date-fns";
import { History, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import HistoryTrendChart from "./HistoryTrendChart";
import BarangayRanking from "./BarangayRanking";

const ALL = "all";
const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const ordinal = (n) => {
    const tens = n % 100;
    return `${n}${tens >= 11 && tens <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
};

function Filter({ id, label, value, onChange, options, disabled }) {
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                {label}
            </label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger id={id} className="h-11 w-full bg-card md:h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function Tile({ label, value, detail }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{number(value)}</p>
            {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
    );
}

// The latest disaster in plain words; the numbers and comparisons come from the server.
function insightText(insight, group) {
    const noun = group.type ? `${group.type.toLowerCase()} events` : "disasters";
    const unit = { affected: "persons affected", housesDamaged: "houses damaged", evacuatedPersons: "persons evacuated" }[insight.key];
    let place = "";
    if (insight.of > 1 && insight.value > 0) {
        place = insight.rank === 1 ? ` — the most of ${insight.of} ${noun}` : ` — ${ordinal(insight.rank)} highest of ${insight.of} ${noun}`;
    }
    let usual = "";
    if (insight.average === 0 && insight.value > 0) {
        usual = `; earlier ${noun} had none`;
    } else if (insight.average !== null) {
        usual = { above: `, above the usual ${number(insight.average)}`, below: `, below the usual ${number(insight.average)}`, about: ", about the usual" }[insight.comparison];
    }
    return `${number(insight.value)} ${unit}${place}${usual}.`;
}

/**
 * Shown on the admin dashboard while no disaster is active. One row of filters drives
 * everything below it; changing one reloads only this data from the server.
 */
export default function DisasterHistory({ history }) {
    const [busy, setBusy] = useState(false);
    const { filters, options, summary, series, ranking, latest } = history;
    const barangayName = options.barangays.find((b) => b.id === filters.barangay)?.name;
    const metricLabel = options.metrics.find((m) => m.key === filters.metric)?.label ?? "Persons affected";

    const apply = (changes) => {
        const next = { ...filters, ...changes };
        const query = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== null && !(key === "metric" && value === "affected")));
        router.get(route("admin.dashboard"), query, {
            only: ["history"],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
        });
    };

    const where = barangayName ? `in ${barangayName}` : "citywide";
    const scope = `${filters.type ? `${filters.type.toLowerCase()} ` : ""}disaster${summary.events === 1 ? "" : "s"}`;

    return (
        <section className="space-y-6" aria-labelledby="history-heading" aria-busy={busy}>
            <div className="space-y-1">
                <h2 id="history-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <History className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    Disaster history
                </h2>
                <p className="text-sm text-muted-foreground">No disaster is active. Here is what past disasters did, so you can plan for the next one.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/40 p-3 sm:grid-cols-3" role="group" aria-label="Filters">
                <Filter
                    id="history-type"
                    label="Disaster type"
                    value={filters.type ?? ALL}
                    onChange={(v) => apply({ type: v === ALL ? null : v })}
                    options={[{ value: ALL, label: "All types" }, ...options.types.map((t) => ({ value: t, label: t }))]}
                    disabled={busy}
                />
                <Filter
                    id="history-barangay"
                    label="Barangay"
                    value={filters.barangay ? String(filters.barangay) : ALL}
                    onChange={(v) => apply({ barangay: v === ALL ? null : Number(v) })}
                    options={[{ value: ALL, label: "All barangays" }, ...options.barangays.map((b) => ({ value: String(b.id), label: b.name }))]}
                    disabled={busy}
                />
                <Filter
                    id="history-metric"
                    label="Measure"
                    value={filters.metric}
                    onChange={(v) => apply({ metric: v })}
                    options={options.metrics.map((m) => ({ value: m.key, label: m.label }))}
                    disabled={busy}
                />
            </div>

            {barangayName && (
                <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                    Showing <span className="font-semibold">{barangayName}</span> only.
                    <Button type="button" variant="ghost" size="sm" className="h-9 gap-1 px-2 text-muted-foreground" onClick={() => apply({ barangay: null })}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        Show all barangays
                    </Button>
                </p>
            )}

            {summary.events === 0 ? (
                <div className="rounded-xl border bg-card px-6 py-10 text-center shadow-sm">
                    <p className="font-medium text-foreground">No past {scope} yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Once a disaster ends, its numbers show up here.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Tile label="Past disasters" value={summary.events} detail={filters.type ? filters.type : "All types"} />
                        <Tile label={`Persons affected ${where}`} value={summary.affected} detail={`${number(summary.dead)} dead · ${number(summary.injured)} injured · ${number(summary.missing)} missing`} />
                        <Tile label={`Houses damaged ${where}`} value={summary.housesDamaged} />
                        <Tile label={`Persons evacuated ${where}`} value={summary.evacuatedPersons} />
                    </div>

                    {latest && (
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-sm text-muted-foreground">
                                Latest: <span className="font-semibold text-foreground">{latest.name}</span>
                                {latest.type ? ` (${latest.type})` : ""}, ended {format(parseISO(latest.endedAt), "MMM d, yyyy")}
                                {barangayName ? `, in ${barangayName}` : ""}
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                                {latest.insights.map((insight) => (
                                    <li key={insight.key}>{insightText(insight, latest.group)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <HistoryTrendChart series={series} metricLabel={metricLabel} lineLabel={barangayName ?? "All barangays (citywide)"} />

                    <BarangayRanking
                        rows={ranking}
                        events={summary.events}
                        metricLabel={metricLabel}
                        selected={filters.barangay}
                        onSelect={(id) => apply({ barangay: id === filters.barangay ? null : id })}
                    />
                </>
            )}
        </section>
    );
}
