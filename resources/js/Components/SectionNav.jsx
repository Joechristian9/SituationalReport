import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SCROLL_DELTA = 8; // ignore tiny jitters
const TOP_ZONE = 80; // always shown near the top
const BOTTOM_ZONE = 160; // and near the end of the page

/**
 * True while the bar should be tucked away: scrolling down through the middle of the page.
 * Scrolling up, being near either end, or `lock` (focus inside the bar) brings it back.
 */
function useHideOnScroll(lock) {
    const [hidden, setHidden] = useState(false);
    const last = useRef(0);

    useEffect(() => {
        last.current = window.scrollY;
        let frame = 0;

        const update = () => {
            frame = 0;
            const y = window.scrollY;
            const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - BOTTOM_ZONE;
            if (y < TOP_ZONE || nearBottom) {
                setHidden(false);
            } else if (Math.abs(y - last.current) >= SCROLL_DELTA) {
                setHidden(y > last.current);
            }
            last.current = y;
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return hidden && !lock;
}

function Item({ tab, active, onSelect, count, liveState }) {
    const Icon = tab.icon;
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-label={[
                tab.label,
                count > 0 && `${count} new`,
                liveState && (liveState === "live" ? "live updates on" : "live updates paused"),
            ].filter(Boolean).join(", ")}
            aria-pressed={active}
            className={cn(
                // Phones: sits above the sliding pill (z-10); the chosen tab's text turns white on it.
                "relative z-10 flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 text-xs transition-[color,transform] duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                "sm:min-h-10 sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:focus-visible:ring-offset-2",
                active
                    ? "font-semibold text-primary-foreground sm:bg-primary sm:shadow-sm"
                    : "font-medium text-muted-foreground hover:text-foreground active:scale-95 sm:hover:bg-accent sm:hover:text-accent-foreground sm:active:scale-100"
            )}
        >
            <span className="relative flex h-6 items-center justify-center">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" className="sm:size-[18px]" />
                {count > 0 && (
                    <span
                        className="absolute -right-3.5 -top-1.5 min-w-[18px] rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-[18px] tabular-nums text-destructive-foreground ring-2 ring-card sm:static sm:ml-2 sm:ring-0"
                        aria-hidden="true"
                    >
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </span>
            {/* The live dot sits with the label, so it isn't mistaken for a notification badge. */}
            <span className="inline-flex items-center gap-1.5">
                {liveState && (
                    <span
                        aria-hidden="true"
                        className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            // Paused grey would vanish on the blue pill, so it goes light there.
                            liveState === "live" ? "bg-success" : active ? "bg-primary-foreground/70" : "bg-muted-foreground/60"
                        )}
                    />
                )}
                <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
            </span>
        </button>
    );
}

/**
 * Dashboard sections. Phones: a frosted capsule floating above the bottom edge, with a solid
 * pill that slides to the chosen tab; it tucks away while scrolling down. sm and up: a plain pill row.
 * `tabs` = [{ key, label, shortLabel?, icon }]; `counts` / `liveStates` are keyed by tab key.
 */
export default function SectionNav({ tabs, active, onChange, counts = {}, liveStates = {} }) {
    const [focused, setFocused] = useState(false);
    const hidden = useHideOnScroll(focused);
    const index = Math.max(0, tabs.findIndex((tab) => tab.key === active));

    return (
        <nav
            aria-label="Dashboard sections"
            // Keyboard focus keeps the bar on screen; a touch tap also focuses the button, which must not.
            onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
            onBlur={() => setFocused(false)}
            className={cn(
                // Only the capsule takes taps; the clear strip around it lets them through to the page.
                "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
                "transition-transform duration-300 ease-out motion-reduce:transition-none",
                hidden && "max-sm:translate-y-[calc(100%+1rem)]",
                "sm:pointer-events-auto sm:static sm:z-auto sm:p-0"
            )}
        >
            <div
                className={cn(
                    "pointer-events-auto relative mx-auto flex max-w-md rounded-full border border-border/60 p-1.5",
                    // Frosted glass where the browser can blur; nearly solid where it can't, so labels stay readable.
                    "bg-card/95 shadow-[0_12px_32px_-12px_rgba(30,58,138,0.45),0_2px_8px_-2px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-card/75",
                    "sm:inline-flex sm:max-w-none sm:gap-1 sm:border-border sm:bg-card sm:p-1 sm:shadow-sm sm:backdrop-blur-none"
                )}
            >
                {/* The sliding pill: tabs are equal width, so it moves by whole multiples of its own width. */}
                <span
                    aria-hidden="true"
                    className="absolute inset-y-1.5 left-1.5 rounded-full bg-primary shadow-md transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none sm:hidden"
                    style={{ width: `calc((100% - 0.75rem) / ${tabs.length})`, transform: `translateX(${index * 100}%)` }}
                />
                {tabs.map((tab) => (
                    <Item
                        key={tab.key}
                        tab={tab}
                        active={tab.key === active}
                        onSelect={() => onChange(tab.key)}
                        count={counts[tab.key] ?? 0}
                        liveState={liveStates[tab.key]}
                    />
                ))}
            </div>
        </nav>
    );
}
