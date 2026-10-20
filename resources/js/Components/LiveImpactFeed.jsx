import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ChevronRight, Clock, Radio } from 'lucide-react';
import { IMPACT_SERIES, Swatch } from '@/Components/Graphs/chartParts';
import { EmptyState } from '@/Components/data/DataView';
import { reporterLabel } from '@/hooks/useNewImpactReports';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import { cn } from '@/lib/utils';

const SERIES = Object.fromEntries(IMPACT_SERIES.map((s) => [s.key, s]));
// The server sends up to 50 per type, so the largest choice is always filled.
const SIZES = [10, 20, 50];
// Narrow enough to fit the xl column beside the chart (~600px on a 1366px screen).
const COLUMNS = 'md:grid md:grid-cols-[7rem_6.5rem_minmax(0,1fr)_minmax(0,2fr)] md:gap-4';

function NewTag() {
    return (
        <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 text-xs font-medium text-primary">New</span>
    );
}

// Phones: four equal segments with the count under the label; lg and up: inline buttons.
function FilterButton({ active, onClick, label, count, color }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex min-h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-medium transition-colors',
                'lg:min-h-9 lg:flex-row lg:gap-2 lg:rounded-md lg:px-3 lg:text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
        >
            <span className="flex items-center gap-1.5">
                {color && <Swatch color={color} />}
                {label}
            </span>
            <span className={cn('tabular-nums', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{count}</span>
        </button>
    );
}

/**
 * Live Feed tab: the newest Dead / Injured / Missing reports for the active
 * disaster (10, 20 or 50 of them), newest first. Rows link to the matching submissions page.
 */
export default function LiveImpactFeed({ items = [], totals = null, fresh = new Set(), paused = false, disaster = null, barangaysToday }) {
    const [type, setType] = useState('all');
    // Items arrive newest first.
    const latest = items[0]?.reportedAt ? parseISO(items[0].reportedAt) : null;
    const [size, setSize] = useState(20);
    const count = (key) => totals?.[key] ?? items.filter((i) => key === 'total' || i.type === key).length;
    const shown = (type === 'all' ? items : items.filter((i) => i.type === type)).slice(0, size);
    const freshShown = shown.filter((i) => fresh.has(i.key)).length;

    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-labelledby="live-feed-title">
            <div className="space-y-3 border-b border-border p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 id="live-feed-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                            Live feed
                            {freshShown > 0 && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                                    title="New since you opened this page"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                                    {freshShown} new
                                    <span className="sr-only"> since you opened this page</span>
                                </span>
                            )}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="sm:hidden">
                                {disaster ? `${disaster.name} · ` : ''}
                                {paused ? 'Paused' : 'Updates automatically'}
                            </span>
                            <span className="hidden sm:inline">
                                Latest {size} reports{disaster ? ` for ${disaster.name}` : ''}, newest first.{' '}
                                {paused ? 'Live updates are paused; resume them from the Live button at the top.' : 'Updates automatically.'}
                            </span>
                        </p>
                        {/* Heartbeat: a long silence during a disaster means reporting has stalled. */}
                        {latest && (
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    <span>
                                        Last report{' '}
                                        <time dateTime={items[0].reportedAt} title={format(latest, 'MMM d, yyyy h:mm a')} className="font-medium text-foreground">
                                            {formatDistanceToNowStrict(latest, { addSuffix: true })}
                                        </time>
                                    </span>
                                </span>
                                {barangaysToday != null && (
                                    <span>
                                        <span className="font-medium tabular-nums text-foreground">{barangaysToday}</span>{' '}
                                        {barangaysToday === 1 ? 'barangay' : 'barangays'} reported in the last 24 h
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="shrink-0">
                        <RowsPerPage rowsPerPage={size} setRowsPerPage={setSize} choices={SIZES} label="Show" />
                    </div>
                </div>

                <div>
                    {/* Counts are the disaster's full totals, not just the rows listed. */}
                    <div className="grid w-full grid-cols-4 gap-1 rounded-xl bg-muted p-1 lg:inline-flex lg:w-auto lg:rounded-lg" role="group" aria-label="Filter by report type">
                        <FilterButton active={type === 'all'} onClick={() => setType('all')} label="All" count={count('total')} />
                        {IMPACT_SERIES.map((s) => (
                            <FilterButton
                                key={s.key}
                                active={type === s.key}
                                onClick={() => setType(s.key)}
                                label={s.label}
                                count={count(s.key)}
                                color={s.color}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {shown.length === 0 ? (
                <EmptyState
                    icon={Radio}
                    title={type === 'all' ? 'No reports yet' : `No ${SERIES[type].label.toLowerCase()} reports yet`}
                    description={
                        type === 'all'
                            ? 'No dead, injured or missing reports yet. New reports appear here as they are filed.'
                            : 'Reports of this type appear here as they are filed.'
                    }
                />
            ) : (
                <>
                    {/* Column labels for the wide layout; each row also says what it is. */}
                    <div className={cn('hidden border-b bg-muted/40 px-6 py-2 text-xs font-medium text-muted-foreground', COLUMNS)} aria-hidden="true">
                        <span>Reported</span>
                        <span>Type</span>
                        <span>Reported by</span>
                        <span>Details</span>
                    </div>
                    <ol className="divide-y divide-border" aria-label="Latest human impact reports">
                        {shown.map((item) => {
                            const series = SERIES[item.type];
                            const isNew = fresh.has(item.key);
                            const reportedAt = item.reportedAt ? parseISO(item.reportedAt) : null;

                            return (
                                <li key={item.key}>
                                    <Link
                                        href={route(series.route, { search: item.name })}
                                        style={{ '--bar': series.color }}
                                        className={cn(
                                            'relative block cursor-pointer py-3 pl-5 pr-4 text-sm transition-colors hover:bg-muted/60 active:bg-muted sm:pl-7 sm:pr-6 md:items-center md:pl-6',
                                            // Phones: a color bar down the left edge groups the rows by type (the label is always shown too).
                                            'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--bar)] md:before:hidden',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none',
                                            COLUMNS,
                                            isNew && 'bg-accent/50',
                                        )}
                                    >
                                        {/* Mobile: type + time on one line */}
                                        <div className="flex items-center gap-2 md:contents">
                                            <span className="order-2 ml-auto shrink-0 text-xs tabular-nums text-muted-foreground md:order-none md:ml-0">
                                                {reportedAt && (
                                                    <time dateTime={item.reportedAt} title={format(reportedAt, 'MMM d, yyyy h:mm a')}>
                                                        {formatDistanceToNowStrict(reportedAt, { addSuffix: true })}
                                                        <span className="hidden md:block">{format(reportedAt, 'MMM d, h:mm a')}</span>
                                                    </time>
                                                )}
                                            </span>
                                            <span className="order-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:order-none">
                                                <Swatch color={series.color} />
                                                <span className="font-semibold text-foreground">{series.label}</span>
                                                {isNew && <NewTag />}
                                            </span>
                                            <ChevronRight className="order-3 h-4 w-4 shrink-0 text-muted-foreground md:hidden" aria-hidden="true" />
                                        </div>

                                        <p className="mt-1 min-w-0 font-medium text-foreground md:mt-0">{reporterLabel(item)}</p>
                                        <p className="mt-0.5 line-clamp-2 min-w-0 text-muted-foreground md:mt-0">{item.detail || '—'}</p>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}
        </section>
    );
}
