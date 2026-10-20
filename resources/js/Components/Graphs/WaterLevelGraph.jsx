import React, { useMemo } from "react";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, Droplet, OctagonAlert } from "lucide-react";
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
function statusOf(level, alarm, critical) {
    if (level >= critical) return "critical";
    if (level >= alarm) return "alarm";
    return "normal";
}

const metres = (value) => (Number.isFinite(value) ? `${value} m` : "—");
const pct = (value, max) => `${Math.min(100, Math.max(0, (value / max) * 100))}%`;

function StationRow({ station }) {
    const { name, level, alarm, critical, status, updatedAt } = station;
    const s = STATUS[status];
    // Each station has its own thresholds, so each bar has its own scale.
    const max = Math.max(...[level, alarm, critical].filter(Number.isFinite), 0) * 1.15 || 1;

    return (
        <li className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 break-words font-medium text-foreground">{name}</span>
                <span className="flex items-center gap-2">
                    <span className="text-base font-semibold tabular-nums text-foreground">{metres(level)}</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", s.chip)}>
                        <s.icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {s.label}
                    </span>
                </span>
            </div>
            {/* The level and thresholds are all in the text below; the bar only shows them visually. */}
            <div className="relative mt-2 h-2 rounded-full bg-muted" aria-hidden="true">
                <div className={cn("h-full rounded-full", s.bar)} style={{ width: pct(level, max) }} />
                {Number.isFinite(alarm) && <span className="absolute -top-1 h-4 w-0.5 rounded bg-warning" style={{ left: pct(alarm, max) }} />}
                {Number.isFinite(critical) && <span className="absolute -top-1 h-4 w-0.5 rounded bg-destructive" style={{ left: pct(critical, max) }} />}
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>Alarm {metres(alarm)}</span>
                <span>Critical {metres(critical)}</span>
                {updatedAt && (
                    <time dateTime={updatedAt.toISOString()} title={format(updatedAt, "MMM d, yyyy h:mm a")}>
                        {formatDistanceToNowStrict(updatedAt, { addSuffix: true })}
                    </time>
                )}
            </p>
        </li>
    );
}

/** One row per gauging station: its level against its own alarm and critical thresholds, worst first. */
export default function WaterLevelGraph({ waterLevels = [] }) {
    const stations = useMemo(
        () =>
            waterLevels
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
                        updatedAt: row.updated_at ? parseISO(row.updated_at) : null,
                        // How close to critical, for ordering stations of the same status.
                        ratio: critical > 0 ? level / critical : 0,
                    };
                })
                .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.ratio - a.ratio),
        [waterLevels]
    );

    const counts = Object.fromEntries(ORDER.map((key) => [key, stations.filter((s) => s.status === key).length]));
    const latest = stations.reduce((max, s) => (s.updatedAt && (!max || s.updatedAt > max) ? s.updatedAt : max), null);

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
                <EmptyState icon={Droplet} title="No water level readings" description="Readings appear here once the Water Level form is filled in." />
            ) : (
                <>
                    <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {ORDER.map((key) => {
                            const Icon = STATUS[key].icon;
                            return (
                                <span key={key} className="inline-flex items-center gap-1.5">
                                    <Icon className={cn("h-4 w-4", counts[key] > 0 && STATUS[key].text)} aria-hidden="true" />
                                    <span className="font-semibold tabular-nums text-foreground">{counts[key]}</span>
                                    {STATUS[key].label.toLowerCase()}
                                </span>
                            );
                        })}
                    </p>
                    <ul className="divide-y divide-border" aria-label="Gauging stations, most urgent first">
                        {stations.map((station) => (
                            <StationRow key={station.id} station={station} />
                        ))}
                    </ul>
                </>
            )}
        </GraphCard>
    );
}
