import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Cloud, CloudOff, CloudRain, MapPin, Waves, Wind } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import { EmptyState } from "@/Components/data/DataView";

const FIELDS = [
    { key: "sky_condition", label: "Sky", icon: Cloud },
    { key: "wind", label: "Wind", icon: Wind },
    { key: "precipitation", label: "Rain", icon: CloudRain },
    { key: "sea_condition", label: "Sea", icon: Waves },
];
const RECENT = 3;

/** The latest weather report in full, then a one-line summary of the few before it. */
export default function WeatherGraph({ weatherReports = [] }) {
    // Newest first (copy so the shared prop array isn't re-ordered).
    const reports = useMemo(
        () => [...weatherReports].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
        [weatherReports]
    );
    const [latest, ...older] = reports;
    const when = (report, pattern) => (report.updated_at ? format(parseISO(report.updated_at), pattern) : "");

    return (
        <GraphCard
            title="Weather"
            icon={<Cloud size={24} />}
            actions={latest && <span className="text-sm text-muted-foreground">{when(latest, "MMM d, h:mm a")}</span>}
        >
            {!latest ? (
                <EmptyState icon={CloudOff} title="No weather reports" description="Conditions appear here once the Weather form is filled in." />
            ) : (
                <div className="space-y-4">
                    <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                <span className="break-words">{latest.municipality}</span>
                            </span>
                            <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Latest</span>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 sm:gap-3">
                            {FIELDS.map(({ key, label, icon: Icon }) => (
                                <div key={key} className="rounded-lg border border-border bg-muted/30 p-3">
                                    <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {label}
                                    </dt>
                                    <dd className="mt-1 break-words text-sm font-medium text-foreground">{latest[key] || "—"}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {older.length > 0 && (
                        <div>
                            <h4 className="mb-1 text-sm font-semibold text-foreground">Recent updates</h4>
                            <ul className="divide-y divide-border text-sm">
                                {older.slice(0, RECENT).map((report) => (
                                    <li key={report.id} className="py-2">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="min-w-0 break-words font-medium text-foreground">{report.municipality}</span>
                                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{when(report, "MMM d, h:mm a")}</span>
                                        </div>
                                        <p className="mt-0.5 text-muted-foreground">
                                            {FIELDS.map(({ key, label }) => `${label}: ${report[key] || "—"}`).join(" · ")}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </GraphCard>
    );
}
