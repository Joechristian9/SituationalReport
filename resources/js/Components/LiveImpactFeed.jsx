import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { IMPACT_SERIES, Swatch } from '@/Components/Graphs/chartParts';
import { reporterLabel } from '@/hooks/useNewImpactReports';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import { cn } from '@/lib/utils';

const SERIES = Object.fromEntries(IMPACT_SERIES.map((s) => [s.key, s]));
// The server sends up to 50 per type, so the largest choice is always filled.
const SIZES = [10, 20, 50];
const COLUMNS = 'md:grid md:grid-cols-[9rem_8rem_minmax(0,1fr)_minmax(0,2fr)] md:gap-4';

function NewTag() {
    return (
        <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 text-xs font-medium text-primary">New</span>
    );
}

function FilterButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors md:min-h-9',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

/**
 * Live Feed tab: the newest Dead / Injured / Missing reports for the active
 * disaster (10, 20 or 50 of them), newest first. Rows link to the matching submissions page.
 */
export default function LiveImpactFeed({ items = [], totals = null, fresh = new Set(), paused = false, disaster = null }) {
    const [type, setType] = useState('all');
    const [size, setSize] = useState(20);
    const count = (key) => totals?.[key] ?? items.filter((i) => key === 'total' || i.type === key).length;
    const shown = (type === 'all' ? items : items.filter((i) => i.type === type)).slice(0, size);
    const freshShown = shown.filter((i) => fresh.has(i.key)).length;

    return (
        <section className="rounded-xl border bg-card shadow-sm" aria-labelledby="live-feed-title">
            <div className="flex flex-col gap-4 border-b p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h2 id="live-feed-title" className="text-lg font-semibold text-foreground">
                        Live feed
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Latest {size} reports{disaster ? ` for ${disaster.name}` : ''}, newest first.{' '}
                        {paused ? 'Live updates are paused; resume them from the Live button at the top.' : 'Updates automatically.'}
                    </p>
                    {freshShown > 0 && (
                        <p className="mt-2 text-sm font-medium text-foreground">
                            {freshShown} new since you opened this page
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                    <RowsPerPage rowsPerPage={size} setRowsPerPage={setSize} choices={SIZES} label="Show" />
                    {/* Counts are the disaster's full totals, not just the rows listed. */}
                    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Filter by report type">
                        <FilterButton active={type === 'all'} onClick={() => setType('all')}>
                            All <span className="tabular-nums text-muted-foreground">{count('total')}</span>
                        </FilterButton>
                        {IMPACT_SERIES.map((s) => (
                            <FilterButton key={s.key} active={type === s.key} onClick={() => setType(s.key)}>
                                <Swatch color={s.color} />
                                {s.label} <span className="tabular-nums text-muted-foreground">{count(s.key)}</span>
                            </FilterButton>
                        ))}
                    </div>
                </div>
            </div>

            {shown.length === 0 ? (
                <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                    {type === 'all'
                        ? 'No dead, injured or missing reports yet. New reports appear here as they are filed.'
                        : `No ${SERIES[type].label.toLowerCase()} reports yet.`}
                </p>
            ) : (
                <>
                    {/* Column labels for the wide layout; each row also says what it is. */}
                    <div className={cn('hidden border-b bg-muted/40 px-6 py-2 text-xs font-medium text-muted-foreground', COLUMNS)} aria-hidden="true">
                        <span>Reported</span>
                        <span>Type</span>
                        <span>Reported by</span>
                        <span>Details</span>
                    </div>
                    <ol className="divide-y" aria-label="Latest human impact reports">
                        {shown.map((item) => {
                            const series = SERIES[item.type];
                            const isNew = fresh.has(item.key);
                            const reportedAt = item.reportedAt ? parseISO(item.reportedAt) : null;

                            return (
                                <li key={item.key}>
                                    <Link
                                        href={route(series.route, { search: item.name })}
                                        className={cn(
                                            'block cursor-pointer px-4 py-3 text-sm transition-colors hover:bg-muted/60 sm:px-6 md:items-center',
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
                                            <span className="order-1 flex items-center gap-2 md:order-none">
                                                <Swatch color={series.color} />
                                                <span className="font-semibold text-foreground">{series.label}</span>
                                                {isNew && <NewTag />}
                                            </span>
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
