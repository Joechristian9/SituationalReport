import React, { useMemo, useState } from "react";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Droplet, OctagonAlert } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import { EmptyState } from "@/Components/data/DataView";
import { cn } from "@/lib/utils";

const STATUS = {
    critical: { label: "Critical", icon: OctagonAlert, text: "text-destructive", chip: "border-destructive/30 bg-destructive/10 text-destructive", bar: "bg-destructive" },
    alarm: { label: "Alarm", icon: AlertTriangle, text: "text-warning", chip: "border-warning/30 bg-warning/10 text-warning", bar: "bg-warning" },
    normal: { label: "Normal", icon: CheckCircle2, text: "text-success", chip: "border-success/30 bg-success/10 text-success", bar: "bg-primary" },
};
const ORDER = ["critical", "alarm", "normal"];

// A missing threshold (NaN) is never reached, so a station without one is not flagged.
export function statusOf(level, alarm, critical) {
    if (level >= critical) return "critical";
    if (level >= alarm) return "alarm";
    return "normal";
}

const metres = (value) => (Number.isFinite(value) ? `${value} m` : "—");
const pct = (value, max) => `${Math.min(100, Math.max(0, (value / max) * 100))}%`;

// "0.3 m above critical" / "1.2 m below alarm"; nothing when the threshold is missing.
export function distance(level, threshold, name) {
    if (!Number.isFinite(level) || !Number.isFinite(threshold)) return null;
    const diff = Number((level - threshold).toFixed(2));
    return diff >= 0 ? `${diff} m above ${name}` : `${-diff} m below ${name}`;
}

/** Server rows (levels arrive as strings) to stations with a status, worst first. */
export function stationsFrom(waterLevels) {
    return waterLevels
        .map((row) => {
            const level = parseFloat(row.current_level);
            const alarm = parseFloat(row.alarm_level);
            const critical = parseFloat(row.critical_level);
            return {
                id: row.id,
                name: row.gauging_station,
                level,
                alarm,
                critical,
                status: statusOf(level, alarm, critical),
                areas: row.affected_areas,
                updatedAt: row.updated_at ? parseISO(row.updated_at) : null,
                // How close to critical, for ordering stations of the same status.
                ratio: critical > 0 ? level / critical : 0,
            };
        })
        .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.ratio - a.ratio);
}

function StationRow({ station, expanded, onToggle }) {
    const { id, name, level, alarm, critical, status, areas, updatedAt } = station;
    const s = STATUS[status];
    // Each station has its own thresholds, so each bar has its own scale.
    const max = Math.max(...[level, alarm, critical].filter(Number.isFinite), 0) * 1.15 || 1;
    const distances = [distance(level, critical, "critical"), distance(level, alarm, "alarm")].filter(Boolean);

    return (
        <li className="py-1.5">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={`station-${id}`}
                className="-mx-2 block w-[calc(100%+1rem)] cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
                <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 break-words font-medium text-foreground">{name}</span>
                    <span className="flex items-center gap-2">
                        <span className="text-base font-semibold tabular-nums text-foreground">{metres(level)}</span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", s.chip)}>
                            <s.icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {s.label}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" />
                    </span>
                </span>
                {/* The level and thresholds are all in the text; the bar only shows them visually. */}
                <span className="relative mt-2 block h-2 rounded-full bg-muted" aria-hidden="true">
                    <span className={cn("block h-full rounded-full", s.bar)} style={{ width: pct(level, max) }} />
                    {Number.isFinite(alarm) && <span className="absolute -top-1 h-4 w-0.5 rounded bg-warning" style={{ left: pct(alarm, max) }} />}
                    {Number.isFinite(critical) && <span className="absolute -top-1 h-4 w-0.5 rounded bg-destructive" style={{ left: pct(critical, max) }} />}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>Alarm {metres(alarm)}</span>
                    <span>Critical {metres(critical)}</span>
                    {updatedAt && (
                        <time dateTime={updatedAt.toISOString()} title={format(updatedAt, "MMM d, yyyy h:mm a")}>
                            {formatDistanceToNowStrict(updatedAt, { addSuffix: true })}
                        </time>
                    )}
                </span>
            </button>
            {expanded && (
                <dl id={`station-${id}`} className="mt-1 space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
                    {distances.length > 0 && (
                        <div>
                            <dt className="sr-only">Distance to thresholds</dt>
                            <dd className="font-medium text-foreground">{distances.join(" · ")}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="inline text-muted-foreground">Affected areas: </dt>
                        <dd className="inline break-words text-foreground">{areas || "Not reported"}</dd>
                    </div>
                </dl>
            )}
        </li>
    );
}

/** One row per gauging station: its level against its own alarm and critical thresholds, worst first. */
export default function WaterLevelGraph({ waterLevels = [] }) {
    const [filter, setFilter] = useState(null); // null = every status
    const [open, setOpen] = useState(() => new Set());

    const stations = useMemo(() => stationsFrom(waterLevels), [waterLevels]);

    const counts = Object.fromEntries(ORDER.map((key) => [key, stations.filter((s) => s.status === key).length]));
    const latest = stations.reduce((max, s) => (s.updatedAt && (!max || s.updatedAt > max) ? s.updatedAt : max), null);
    const shown = filter ? stations.filter((s) => s.status === filter) : stations;
    const toggle = (id) =>
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <GraphCard
            title="Water Level"
            icon={<Droplet size={24} />}
            actions={
                latest && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" title={format(latest, "MMM d, yyyy h:mm a")}>
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Updated {formatDistanceToNowStrict(latest, { addSuffix: true })}
                    </span>
                )
            }
        >
            {stations.length === 0 ? (
                <EmptyState icon={Droplet} title="No water level readings for this disaster yet" description="Each station appears here once its level is entered in the Water Level form." />
            ) : (
                <>
                    {/* Counts double as filters; tapping the active one shows every station again. */}
                    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter stations by status">
                        {ORDER.map((key) => {
                            const { icon: Icon, label, text, chip } = STATUS[key];
                            const active = filter === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFilter(active ? null : key)}
                                    aria-pressed={active}
                                    className={cn(
                                        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors md:min-h-8",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                                        active ? chip : "border-border text-muted-foreground hover:bg-muted/60"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", counts[key] > 0 && text)} aria-hidden="true" />
                                    <span className="font-semibold tabular-nums text-foreground">{counts[key]}</span>
                                    {label.toLowerCase()}
                                </button>
                            );
                        })}
                    </div>
                    {shown.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No station is at {STATUS[filter].label.toLowerCase()} level right now. Tap the filter again to see all stations.</p>
                    ) : (
                        <ul className="divide-y divide-border" aria-label="Gauging stations, most urgent first">
                            {shown.map((station) => (
                                <StationRow key={station.id} station={station} expanded={open.has(station.id)} onToggle={() => toggle(station.id)} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </GraphCard>
    );
}
