import React, { useMemo } from 'react';
import { History } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';

function Change({ title, change, muted = false }) {
    return (
        <div className={muted ? 'mt-2 border-t border-border pt-2' : undefined}>
            <p className={`mb-1 text-sm font-semibold ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{title}</p>
            <p className="text-sm text-foreground">
                <span className="font-semibold">{change.user?.name || 'Unknown user'}</span> changed from{' '}
                <span className="font-mono text-destructive">{change.old ?? 'nothing'}</span> to{' '}
                <span className="font-mono text-success">{change.new ?? 'nothing'}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{new Date(change.date).toLocaleString()}</p>
        </div>
    );
}

/**
 * Reusable Modification Indicator Component
 * A line under the input ("Last modified by …") with a history button that opens
 * the latest and previous change. Sits below the field rather than inside it, so it
 * never covers the text, a select's arrow or a date picker; opens on tap as well as click.
 *
 * @param {number|string} recordId - The ID of the record being tracked
 * @param {string} fieldName - The name of the field being tracked
 * @param {function} getFieldHistory - Function to retrieve field history: (recordId, fieldName) => array
 * @param {string} currentValue - Optional: Current value of the field (to determine if we show "Last modified by" text)
 * @param {boolean} showLastModified - Optional: Whether to show "Last modified by" text below the input (default: true)
 */
export default function ModificationIndicator({ recordId, fieldName, getFieldHistory, currentValue, showLastModified = true }) {
    // Memoize the field history to prevent unnecessary recalculations
    const fieldHistory = useMemo(() => {
        if (!getFieldHistory || !recordId || !fieldName) return [];
        return getFieldHistory(recordId, fieldName);
    }, [recordId, fieldName, getFieldHistory]);

    // Only show if this specific field has been modified
    if (!fieldHistory || fieldHistory.length === 0) return null;

    // Get the latest (current) and previous updates
    const latestChange = fieldHistory[0];
    if (!latestChange) return null;

    const previousChange = fieldHistory.length > 1 ? fieldHistory[1] : null;
    const editor = latestChange.user?.name || 'Unknown user';

    // Determine if we should show "Last modified by" text
    const shouldShowModifiedText = showLastModified && currentValue !== undefined && currentValue !== null && currentValue !== '';

    return (
        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Change history, last modified by ${editor}`}
                        className="-ml-1 inline-flex min-h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    >
                        <History className="h-4 w-4" aria-hidden="true" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-3">
                    <Change title="Latest change" change={latestChange} />
                    {previousChange && <Change title="Previous change" change={previousChange} muted />}
                </PopoverContent>
            </Popover>
            {shouldShowModifiedText ? (
                <span className="min-w-0 truncate" title={`Last modified by ${editor}`}>
                    Last modified by <span className="font-medium text-primary">{editor}</span>
                </span>
            ) : (
                <span>Changed</span>
            )}
        </div>
    );
}
