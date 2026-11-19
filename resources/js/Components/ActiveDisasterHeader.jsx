import { Pause, Siren } from 'lucide-react';
import StatusChip from '@/Components/StatusChip';
import { cn } from '@/lib/utils';

/**
 * The active or paused disaster, as a compact chip for the right of the app header: the name
 * shows from 640px up, and the full name and status on hover or tap. The paused notice itself
 * lives in the bell of the app header (NotificationBell).
 *
 * @param {Object} typhoon - The active/paused disaster object (null if no active disaster)
 * @param {boolean} hasActive - Whether there's an active or paused disaster
 */
export default function ActiveTyphoonHeader({ typhoon, hasActive }) {
    if (!hasActive || !typhoon) return null;

    const isPaused = typhoon.status === 'paused';
    if (!isPaused && typhoon.status !== 'active') return null;

    return (
        <StatusChip
            label={`${typhoon.name} · ${isPaused ? 'Paused' : 'Active'}`}
            className={cn('min-w-0', isPaused ? 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/15' : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15')}
        >
            <Siren className="h-4 w-4 shrink-0" aria-hidden="true" />
            {/* Phones: icon and status mark only, so the page title keeps its room; a tap shows the name. */}
            <span className="hidden max-w-[14rem] truncate sm:inline">{typhoon.name}</span>
            {/* Status mark (design system: active = dot, paused = pause icon); the word is in the label. */}
            {isPaused ? (
                <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
            )}
        </StatusChip>
    );
}
