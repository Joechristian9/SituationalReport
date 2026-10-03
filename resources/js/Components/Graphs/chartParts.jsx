import React from "react";
import { AlertTriangle, HeartPulse, UserSearch } from "lucide-react";

// Shared chart building blocks. Series colors are --viz-* tokens in app.css,
// validated with the dataviz palette checker (light + dark). Text never wears them.

export const IMPACT_SERIES = [
    { key: "dead", label: "Dead", color: "var(--viz-dead)", icon: AlertTriangle, route: "admin.casualties.submissions", badgeKey: "casualties" },
    { key: "injured", label: "Injured", color: "var(--viz-injured)", icon: HeartPulse, route: "admin.injured.submissions", badgeKey: "injured" },
    { key: "missing", label: "Missing", color: "var(--viz-missing)", icon: UserSearch, route: "admin.missing.submissions", badgeKey: "missing" },
];

/** Legend / identity key for bars and areas. */
export function Swatch({ color }) {
    return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: color }} aria-hidden="true" />;
}

/** Legend / tooltip key for lines. */
export function LineKey({ color }) {
    return <span className="inline-block h-0.5 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

/** Hover / keyboard-focus tooltip for a `group` parent. Enhances only: values are also visible or in the table view. */
export function Tip({ className = "", children }) {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none invisible absolute z-20 min-w-36 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 motion-reduce:transition-none ${className}`}
        >
            {children}
        </div>
    );
}
