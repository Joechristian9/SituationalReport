import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

const CLOSE_DELAY_MS = 150;

/**
 * A compact header chip: `children` is what shows (icon, short text), `label` the full text.
 * The full text, plus any `details` (buttons, lists), opens on mouse hover and on tap or
 * Enter, because phones have no hover. Hovering opens it without taking focus; a tap or
 * click pins it open until the person closes it.
 */
export default function StatusChip({ label, details, className, children }) {
    const [open, setOpen] = useState(false);
    const pinned = useRef(false);
    const closeTimer = useRef();

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const change = (next) => {
        clearTimeout(closeTimer.current);
        pinned.current = next;
        setOpen(next);
    };

    // Mouse only: a finger's touch fires these too, and must not fight the tap.
    const hoverIn = (event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const hoverOut = (event) => {
        if (event.pointerType !== 'mouse' || pinned.current) return;
        // A short wait, so the pointer can cross the gap to the buttons inside.
        closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    };

    return (
        <Popover open={open} onOpenChange={change}>
            <PopoverTrigger
                type="button"
                aria-label={label}
                onPointerEnter={hoverIn}
                onPointerLeave={hoverOut}
                onClick={(event) => {
                    // Already open from hovering: a click keeps it open instead of closing it.
                    if (!open || pinned.current) return;
                    event.preventDefault();
                    pinned.current = true;
                }}
                className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2.5 text-sm font-medium transition-colors md:min-h-9 md:min-w-9',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
                    className,
                )}
            >
                {children}
            </PopoverTrigger>
            <PopoverContent
                align="end"
                onPointerEnter={hoverIn}
                onPointerLeave={hoverOut}
                // Opened by hovering: leave focus where it is.
                onOpenAutoFocus={(event) => pinned.current || event.preventDefault()}
                className="w-auto max-w-[calc(100vw-2rem)] p-3 text-sm sm:max-w-sm"
            >
                <p className="font-medium text-foreground">{label}</p>
                {details}
            </PopoverContent>
        </Popover>
    );
}
