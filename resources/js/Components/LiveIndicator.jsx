import { useEffect, useState } from 'react';
import { Pause, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
    live: 'border-success/30 bg-success/10 text-success hover:bg-success/15',
    paused: 'border-border bg-muted text-muted-foreground hover:bg-secondary',
    stale: 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15',
};

function ago(seconds) {
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
}

/**
 * Status pill for a page driven by useLiveRefresh. The whole pill is one button
 * that pauses/resumes updates, so the touch target stays large.
 */
export default function LiveIndicator({ live, className }) {
    const { paused, updatedAt, interval, toggle } = live;
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (paused) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [paused]);

    const seconds = Math.max(0, Math.round((now - updatedAt) / 1000));
    // Three missed refreshes in a row means something is wrong (offline, session expired).
    const stale = !paused && now - updatedAt > interval * 3;
    const state = paused ? 'paused' : stale ? 'stale' : 'live';

    const label = { live: 'Live', paused: 'Paused', stale: 'Not updating' }[state];
    const announcement = {
        live: 'Live updates on',
        paused: 'Live updates paused',
        stale: 'Live updates are not refreshing',
    }[state];

    return (
        <>
            <button
                type="button"
                onClick={toggle}
                aria-pressed={paused}
                aria-label={paused ? 'Resume live updates' : 'Pause live updates'}
                title={paused ? 'Resume live updates' : 'Pause live updates'}
                className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium tabular-nums transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none md:min-h-8',
                    TONES[state],
                    className,
                )}
            >
                {state === 'live' && (
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                )}
                {state === 'paused' && <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
                {state === 'stale' && <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
                {/* Phones: icon/dot only to save header space; the button keeps its aria-label and title. */}
                <span aria-hidden="true" className="hidden sm:inline">{label}</span>
                {state === 'live' && (
                    <span className="hidden text-xs font-normal opacity-80 sm:inline" aria-hidden="true">
                        · {ago(seconds)}
                    </span>
                )}
            </button>
            {/* Announces state changes only, not the ticking seconds. */}
            <span role="status" aria-live="polite" className="sr-only">
                {announcement}
            </span>
        </>
    );
}
