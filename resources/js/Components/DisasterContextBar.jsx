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
                className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
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
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10"
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
        <section aria-label="Current disaster" className="rounded-xl border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="hidden shrink-0 rounded-lg bg-info/10 p-2 text-info sm:block" aria-hidden="true">
                        <Cloud className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">Showing data for</p>
                        <h2 className="break-words text-lg font-semibold leading-snug text-foreground sm:text-2xl">{disaster.name}</h2>
                        {/* Phones: one short line (type · day · refresh time); the start date joins from sm up. */}
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:mt-1 sm:gap-x-4">
                            {typeLabel(disaster.disaster_type) && <span>{typeLabel(disaster.disaster_type)}</span>}
                            {started && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">Started {format(started, "MMM d, yyyy")}</span>
                                    {day > 0 && (
                                        <span className="text-foreground sm:before:mr-1 sm:before:content-['·']">Day {day}</span>
                                    )}
                                </span>
                            )}
                            {refreshed && (
                                <span className="inline-flex items-center gap-1.5">
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    <span className="sm:hidden">
                                        <span className="sr-only">Updated </span>
                                        {format(refreshed, "h:mm a")}
                                    </span>
                                    <span className="hidden sm:inline">Updated {format(refreshed, "h:mm a")}</span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3 sm:text-sm ${
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
