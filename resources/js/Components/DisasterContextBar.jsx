import React from "react";
import { Link } from "@inertiajs/react";
import { differenceInCalendarDays, format } from "date-fns";
import { AlertCircle, CalendarDays, CheckCircle2, Cloud, PauseCircle, RefreshCw } from "lucide-react";

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const typeLabel = (type) => (type ? type.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null);

/**
 * Tells the admin which disaster the dashboard data belongs to: name, type,
 * status (icon + label), how long it has been running and when the data refreshed.
 */
export default function DisasterContextBar({ disaster, updatedAt }) {
    if (!disaster) {
        return (
            <section
                aria-label="Current disaster"
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                        <p className="font-semibold text-foreground">No active disaster</p>
                        <p className="text-sm text-muted-foreground">
                            The dashboard shows data for the active or paused disaster. Start one to begin collecting reports.
                        </p>
                    </div>
                </div>
                <Link
                    href={route("disasters.index")}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Disaster Management
                </Link>
            </section>
        );
    }

    const paused = disaster.status === "paused";
    const started = toDate(disaster.started_at);
    const refreshed = toDate(updatedAt);
    const day = started ? differenceInCalendarDays(new Date(), started) + 1 : null;

    return (
        <section aria-label="Current disaster" className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="shrink-0 rounded-lg bg-info/10 p-2 text-info" aria-hidden="true">
                        <Cloud className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Showing data for</p>
                        <h2 className="break-words text-xl font-semibold text-foreground sm:text-2xl">{disaster.name}</h2>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {typeLabel(disaster.disaster_type) && <span>{typeLabel(disaster.disaster_type)}</span>}
                            {started && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    Started {format(started, "MMM d, yyyy")}
                                    {day > 0 && <span className="text-foreground">· Day {day}</span>}
                                </span>
                            )}
                            {refreshed && (
                                <span className="inline-flex items-center gap-1.5">
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    Updated {format(refreshed, "h:mm a")}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                        paused ? "border-warning/30 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success"
                    }`}
                >
                    {paused ? <PauseCircle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    {paused ? "Paused" : "Active"}
                </span>
            </div>

            {paused && (
                <p className="mt-3 text-sm text-muted-foreground">
                    Reporting is paused: barangays can't submit new forms until it is resumed in Disaster Management.
                </p>
            )}
        </section>
    );
}
