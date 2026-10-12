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
            aria-label={count > 0 ? `${tab.label}, ${count} new` : tab.label}
            aria-pressed={active}
            className={cn(
                "relative z-10 flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                "active:bg-accent/60 sm:active:bg-transparent",
                "sm:min-h-10 sm:flex-none sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:focus-visible:ring-offset-2",
                active
                    ? "font-semibold text-accent-foreground sm:bg-primary sm:text-primary-foreground sm:shadow-sm"
                    : "font-medium text-muted-foreground hover:text-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
            )}
        >
            <span className="relative flex h-6 items-center justify-center">
                <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 1.9}
                    aria-hidden="true"
                    className={cn("transition-colors duration-200 motion-reduce:transition-none sm:size-[18px]", active && "text-primary sm:text-current")}
                />
                {count > 0 ? (
                    <span
                        className="absolute -right-3 -top-1.5 min-w-[18px] rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-[18px] tabular-nums text-destructive-foreground ring-2 ring-card sm:static sm:ml-2 sm:ring-0"
                        aria-hidden="true"
                    >
                        {count > 99 ? "99+" : count}
                    </span>
                ) : (
                    liveState && (
                        <span className="absolute -right-1.5 -top-0.5 flex h-2.5 w-2.5 sm:static sm:ml-1.5" aria-hidden="true">
                            {liveState === "live" && (
                                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                            )}
                            <span
                                className={cn(
                                    "relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-card sm:ring-0",
                                    liveState === "live" ? "bg-success" : "bg-muted-foreground/60"
                                )}
                            />
                        </span>
                    )
                )}
            </span>
            <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {liveState && count === 0 && (
                <span className="sr-only">{liveState === "live" ? "Live updates on" : "Live updates paused"}</span>
            )}
        </button>
    );
}

/**
 * Dashboard sections. Phones: a floating dock at the bottom with a highlight that slides
 * to the chosen item and tucks away while scrolling down. sm and up: a plain pill row.
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
                "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
                "transition-transform duration-300 ease-out motion-reduce:transition-none",
                hidden && "max-sm:translate-y-[calc(100%+1rem)]",
                "sm:pointer-events-auto sm:static sm:z-auto sm:p-0"
            )}
        >
            <div
                className={cn(
                    "pointer-events-auto relative mx-auto flex max-w-sm gap-0 rounded-2xl border border-border/70 bg-card/95 p-1 backdrop-blur",
                    "shadow-[0_10px_30px_-10px_rgba(30,58,138,0.35),0_2px_6px_-2px_rgba(15,23,42,0.12)] supports-[backdrop-filter]:bg-card/85",
                    "sm:inline-flex sm:max-w-none sm:gap-1 sm:rounded-full sm:border-border sm:bg-card sm:shadow-sm"
                )}
            >
                {/* The sliding highlight: items are equal width, so it moves by whole multiples of its own width. */}
                <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-1 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none sm:hidden"
                    style={{ width: `calc((100% - 0.5rem) / ${tabs.length})`, transform: `translateX(${index * 100}%)` }}
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
