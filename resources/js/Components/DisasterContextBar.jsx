import React from "react";
import { Link } from "@inertiajs/react";
import { differenceInCalendarDays, format } from "date-fns";
import { AlertCircle, PauseCircle } from "lucide-react";

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
                className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
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
    const type = typeLabel(disaster.disaster_type);
    // A "·" goes before every item but the first; a phone-hidden item hides its own dot with it.
    const dotted = "[&>*+*]:before:mr-2 [&>*+*]:before:content-['·']";

    return (
        <section aria-label="Current disaster" className="border-b pb-4 sm:pb-6">
            <p className={`flex flex-wrap items-center gap-x-2 text-sm font-medium ${dotted}`}>
                <span className={`inline-flex items-center gap-1.5 ${paused ? "text-warning" : "text-success"}`}>
                    {paused ? (
                        <PauseCircle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                    )}
                    {paused ? "Paused" : "Active"}
                </span>
                {type && <span className="text-muted-foreground">{type}</span>}
            </p>
            <h2 className="mt-1 text-balance break-words text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                {disaster.name}
            </h2>
            {/* Phones: day and refresh time only; the start date joins from sm up. */}
            <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums text-muted-foreground ${dotted}`}>
                {day > 0 && <span className="font-medium text-foreground">Day {day}</span>}
                {started && <span className="hidden sm:inline">Started {format(started, "MMM d, yyyy")}</span>}
                {refreshed && <span>Updated {format(refreshed, "h:mm a")}</span>}
            </p>

            {paused && (
                <p className="mt-3 text-sm text-muted-foreground">
                    Reporting is paused: barangays can't submit new forms until it is resumed in Disaster Management.
                </p>
            )}
        </section>
    );
}
