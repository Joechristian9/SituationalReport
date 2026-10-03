import React from "react";
import { Link } from "@inertiajs/react";
import { Users } from "lucide-react";
import { IMPACT_SERIES, Swatch } from "./chartParts";

const SPARK_DAYS = 14;

/** Tiny trend line: de-emphasis gray, latest point in the series color. */
function Sparkline({ values, color }) {
    if (values.length < 2) return null;
    const max = Math.max(1, ...values);
    const step = 100 / (values.length - 1);
    const y = (v) => 30 - (v / max) * 26;
    const points = values.map((v, i) => `${i * step},${y(v)}`).join(" ");
    const last = values[values.length - 1];

    return (
        <div className="relative mt-3 h-8" aria-hidden="true">
            <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <polyline points={points} fill="none" stroke="var(--viz-unknown)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            {/* End dot drawn in HTML so the stretched SVG doesn't squash it */}
            <span
                className="absolute right-0 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-card"
                style={{ top: `${(y(last) / 32) * 100}%`, background: color }}
            />
        </div>
    );
}

function Delta({ value }) {
    return (
        <p className="mt-1 text-xs text-muted-foreground">
            {value > 0 ? (
                <>
                    <span className="font-semibold text-foreground">+{value}</span> in the last 24 hours
                </>
            ) : (
                "No new reports in the last 24 hours"
            )}
        </p>
    );
}

/**
 * Stat cards: current totals for Dead / Injured / Missing (+ overall), straight from
 * the database summary, each with its 24-hour change and a 14-day sparkline.
 */
export default function ImpactStatCards({ summary, renderBadge }) {
    const trend = (summary?.trend || []).slice(-SPARK_DAYS);
    const totals = summary?.totals || { dead: 0, injured: 0, missing: 0, total: 0 };
    const last24h = summary?.last24h || { dead: 0, injured: 0, missing: 0 };
    const total24h = last24h.dead + last24h.injured + last24h.missing;

    const tileClass =
        "relative block h-full rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {IMPACT_SERIES.map((s) => {
                const Icon = s.icon;
                return (
                    <Link key={s.key} href={route(s.route)} className={tileClass} aria-label={`${s.label}: ${totals[s.key]}. View submissions`}>
                        {renderBadge?.(s.badgeKey)}
                        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Swatch color={s.color} />
                            {s.label}
                            <Icon className="ml-auto h-4 w-4" aria-hidden="true" />
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{totals[s.key].toLocaleString()}</p>
                        <Delta value={last24h[s.key]} />
                        <Sparkline values={trend.map((d) => d[s.key])} color={s.color} />
                    </Link>
                );
            })}
            <div className={`${tileClass} hover:shadow-sm`}>
                {renderBadge?.("total")}
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    Total affected
                    <Users className="ml-auto h-4 w-4" aria-hidden="true" />
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{totals.total.toLocaleString()}</p>
                <Delta value={total24h} />
                <Sparkline values={trend.map((d) => d.dead + d.injured + d.missing)} color="var(--viz-unknown)" />
            </div>
        </div>
    );
}
