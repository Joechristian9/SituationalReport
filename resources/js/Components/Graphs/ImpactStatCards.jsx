import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { addDays, format, subDays } from "date-fns";
import { ArrowUp, ChevronDown, ChevronRight, TrendingUp, Users } from "lucide-react";
import { IMPACT_SERIES, Swatch, useFloatingTip } from "./chartParts";

const DAYS = 7;

/**
 * The last DAYS calendar days ending today, one count per day. The server's trend only
 * runs to the last day with a report, so quiet days at the end are filled with 0 here.
 */
function lastDays(trend) {
    const byDate = new Map(trend.map((row) => [row.date, row]));
    const start = subDays(new Date(), DAYS - 1);
    return Array.from({ length: DAYS }, (_, i) => {
        const date = addDays(start, i);
        return { date, row: byDate.get(format(date, "yyyy-MM-dd")) };
    });
}

// Plot area in % of the box: room above the highest point for today's value label.
const TOP = 22;
const BOTTOM = 92;

/**
 * New reports per day as a small line. Plain SVG (no chart library) because the cards
 * render on every dashboard load; it stretches to any card width. The line keeps a 2px
 * stroke at any size, and the dots are HTML so they stay round. Each dot has a larger
 * tap/focus target that shows the exact day and count.
 */
function DailyLine({ days, color, noun, tip }) {
    const max = Math.max(1, ...days.map((d) => d.value));
    const points = days.map((day, i) => ({
        ...day,
        x: (i / (days.length - 1)) * 100,
        y: BOTTOM - (day.value / max) * (BOTTOM - TOP),
    }));
    const line = points.map((p) => `${p.x},${p.y}`).join(" ");
    const peak = points.reduce((best, p) => (p.value > best.value ? p : best), points[0]);
    const today = points[points.length - 1];
    const dayLabel = (p) => (p === today ? "Today" : format(p.date, "EEE, MMM d"));

    return (
        <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs">
                <p className="font-medium text-muted-foreground">New reports per day</p>
                {peak.value > 0 && (
                    <p className="text-muted-foreground">
                        Peak <span className="font-semibold tabular-nums text-foreground">{peak.value}</span> on {peak === today ? "today" : format(peak.date, "MMM d")}
                    </p>
                )}
            </div>
            {/* px-2 keeps the first and last dots inside the card. */}
            <div className="relative mt-1.5 h-16 px-2">
                <div className="relative h-full">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                        <line x1="0" x2="100" y1={BOTTOM} y2={BOTTOM} stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        <polygon points={`0,${BOTTOM} ${line} 100,${BOTTOM}`} fill={color} fillOpacity="0.12" />
                        <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    {points.map((p, i) => {
                        const isToday = p === today;
                        const label = `${dayLabel(p)}: ${p.value} new ${noun}`;
                        return (
                            <button
                                key={i}
                                type="button"
                                aria-label={label}
                                {...tip.bind(<span className="font-medium text-foreground">{label}</span>)}
                                className="group absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            >
                                <span
                                    className={`block rounded-full ring-2 ring-card transition-transform group-hover:scale-125 motion-reduce:transition-none ${isToday ? "h-2.5 w-2.5" : "h-1.5 w-1.5"}`}
                                    style={{ background: color }}
                                />
                                {isToday && (
                                    <span className="absolute bottom-full right-1/2 translate-x-1/2 text-xs font-semibold tabular-nums text-foreground" aria-hidden="true">
                                        {p.value}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{format(days[0].date, "MMM d")}</span>
                <span>Today</span>
            </div>
        </div>
    );
}

// `short` is the phone wording for the compact cards: "↑ 20 in 24h".
function NewToday({ value, short = false }) {
    return value > 0 ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-foreground sm:text-sm">
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
            {short ? (
                <>
                    <span className="sm:hidden">in 24h</span>
                    <span className="hidden sm:inline">new in the last 24 hours</span>
                </>
            ) : (
                "new in the last 24 hours"
            )}
        </p>
    ) : (
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {short ? (
                <>
                    <span className="sm:hidden">None in 24h</span>
                    <span className="hidden sm:inline">No new reports in the last 24 hours</span>
                </>
            ) : (
                "No new reports in the last 24 hours"
            )}
        </p>
    );
}

/** Dead / injured / missing shares of the total as one segmented bar with numbers below. */
function Split({ totals }) {
    const total = totals.dead + totals.injured + totals.missing;
    return (
        <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">Breakdown</p>
            <div className="mt-1.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {total > 0 &&
                    IMPACT_SERIES.filter((s) => totals[s.key] > 0).map((s) => (
                        <span key={s.key} style={{ width: `${(totals[s.key] / total) * 100}%`, background: s.color }} />
                    ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {IMPACT_SERIES.map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5">
                        <Swatch color={s.color} />
                        <span className="font-semibold tabular-nums text-foreground">{totals[s.key].toLocaleString()}</span>
                        {s.label.toLowerCase()}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Stat cards for the active disaster: current Dead / Injured / Missing totals (+ overall)
 * from the database summary, what is new in the last 24 hours, and the last 7 days.
 */
export default function ImpactStatCards({ summary, renderBadge }) {
    const tip = useFloatingTip();
    const [trendsOpen, setTrendsOpen] = useState(false);
    const days = lastDays(summary?.trend || []);
    const totals = summary?.totals || { dead: 0, injured: 0, missing: 0, total: 0 };
    const last24h = summary?.last24h || { dead: 0, injured: 0, missing: 0 };
    const total24h = last24h.dead + last24h.injured + last24h.missing;
    const dailyFor = (s) => days.map((d) => ({ date: d.date, value: d.row?.[s.key] ?? 0 }));

    // Phones: the three series are compact cards in one row under a wide Total card.
    const cardClass = "relative flex h-full flex-col rounded-xl border bg-card p-3 shadow-sm max-sm:h-auto sm:p-4";

    return (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {IMPACT_SERIES.map((s) => {
                const Icon = s.icon;
                return (
                    <div key={s.key} className={cardClass}>
                        {renderBadge?.(s.badgeKey)}
                        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground sm:gap-2">
                            <Swatch color={s.color} />
                            {s.label}
                            <Icon className="ml-auto hidden h-4 w-4 sm:block" aria-hidden="true" />
                        </p>
                        <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground sm:mt-2 sm:text-3xl">{totals[s.key].toLocaleString()}</p>
                        <NewToday value={last24h[s.key]} short />
                        <div className="hidden sm:block">
                            <DailyLine days={dailyFor(s)} color={s.color} noun={s.label.toLowerCase()} tip={tip} />
                        </div>
                        <Link
                            href={route(s.route)}
                            className="mt-2 inline-flex min-h-11 items-center gap-0.5 self-end rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-3 sm:gap-1 md:min-h-8"
                        >
                            <span className="sm:hidden">View</span>
                            <span className="hidden sm:inline">View records</span>
                            <span className="sr-only"> records: {s.label.toLowerCase()}</span>
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                );
            })}
            <div className={`${cardClass} order-first col-span-3 sm:order-none sm:col-span-1`}>
                {renderBadge?.("total")}
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    Total affected
                    <Users className="ml-auto h-4 w-4" aria-hidden="true" />
                </p>
                <p className="mt-1.5 text-3xl font-semibold tabular-nums text-foreground sm:mt-2">{totals.total.toLocaleString()}</p>
                <NewToday value={total24h} />
                <Split totals={totals} />
            </div>

            {/* Phones only: the 7-day sparklines, one tap away instead of inside every card. */}
            <div className="col-span-3 sm:hidden">
                <button
                    type="button"
                    onClick={() => setTrendsOpen((open) => !open)}
                    aria-expanded={trendsOpen}
                    aria-controls="impact-trends"
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                    {trendsOpen ? "Hide" : "Show"} 7-day trends
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${trendsOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                    />
                </button>
                {trendsOpen && (
                    <div id="impact-trends" className="mt-2.5 space-y-2.5">
                        {IMPACT_SERIES.map((s) => (
                            <div key={s.key} className="rounded-xl border bg-card p-3 shadow-sm">
                                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Swatch color={s.color} />
                                    {s.label}
                                </p>
                                <DailyLine days={dailyFor(s)} color={s.color} noun={s.label.toLowerCase()} tip={tip} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {tip.node}
        </div>
    );
}
