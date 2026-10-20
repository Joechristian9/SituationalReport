import React, { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, Cloud, CloudOff, CloudRain, History, MapPin, Waves, Wind } from "lucide-react";
import GraphCard from "@/Components/ui/GraphCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { EmptyState } from "@/Components/data/DataView";
import { cn } from "@/lib/utils";

const FIELDS = [
    { key: "sky_condition", label: "Sky", icon: Cloud },
    { key: "wind", label: "Wind", icon: Wind },
    { key: "precipitation", label: "Rain", icon: CloudRain },
    { key: "sea_condition", label: "Sea", icon: Waves },
];

const when = (report, pattern) => (report.updated_at ? format(parseISO(report.updated_at), pattern) : "");

/** One weather report in full (the latest, or any update picked from the list), then every update to pick from. */
export default function WeatherGraph({ weatherReports = [] }) {
    // Newest first (copy so the shared prop array isn't re-ordered).
    const reports = useMemo(
        () => [...weatherReports].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
        [weatherReports]
    );
    const [pickedId, setPickedId] = useState(null);
    const [listOpen, setListOpen] = useState(false);
    const latest = reports[0];
    // Falls back to the latest if the picked report is gone after a refresh.
    const shown = reports.find((r) => r.id === pickedId) ?? latest;
    const isLatest = shown === latest;

    return (
        <GraphCard
            title="Weather"
            icon={<Cloud size={24} />}
            actions={shown && <span className="text-sm text-muted-foreground">{when(shown, "MMM d, h:mm a")}</span>}
        >
            {!shown ? (
                <EmptyState icon={CloudOff} title="No weather reports" description="Conditions appear here once the Weather form is filled in." />
            ) : (
                <div className="space-y-4">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                <span className="break-words">{shown.municipality}</span>
                            </span>
                            {isLatest ? (
                                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Latest</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPickedId(null)}
                                    className="min-h-11 shrink-0 cursor-pointer rounded-md px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9"
                                >
                                    Back to latest
                                </button>
                            )}
                        </div>
                        <dl className="grid grid-cols-2 gap-2 sm:gap-3" aria-live="polite">
                            {FIELDS.map(({ key, label, icon: Icon }) => (
                                <div key={key} className="rounded-lg border border-border bg-muted/30 p-3">
                                    <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {label}
                                    </dt>
                                    <dd className="mt-1 break-words text-sm font-medium text-foreground">{shown[key] || "—"}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {reports.length > 1 && (
                        <Popover open={listOpen} onOpenChange={setListOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:min-h-9"
                                >
                                    <span className="flex items-center gap-2">
                                        <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                        All updates
                                        <span className="tabular-nums text-muted-foreground">({reports.length})</span>
                                    </span>
                                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform motion-reduce:transition-none", listOpen && "rotate-180")} aria-hidden="true" />
                                </button>
                            </PopoverTrigger>
                            {/* As wide as the button; scrolls inside so a long disaster stays one screen tall. */}
                            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                                <ul className="max-h-80 divide-y divide-border overflow-y-auto overscroll-contain text-sm" aria-label="Weather updates, newest first">
                                    {reports.map((report) => {
                                        const active = report === shown;
                                        return (
                                            <li key={report.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPickedId(report === latest ? null : report.id);
                                                        setListOpen(false);
                                                    }}
                                                    aria-pressed={active}
                                                    className={cn(
                                                        "relative block w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-muted/60 motion-reduce:transition-none",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                                        active && "bg-accent before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary"
                                                    )}
                                                >
                                                    <span className="flex items-baseline justify-between gap-3">
                                                        <span className="min-w-0 break-words font-medium text-foreground">{report.municipality}</span>
                                                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{when(report, "MMM d, h:mm a")}</span>
                                                    </span>
                                                    <span className="mt-0.5 block text-muted-foreground">
                                                        {FIELDS.map(({ key, label }) => `${label}: ${report[key] || "—"}`).join(" · ")}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            )}
        </GraphCard>
    );
}
