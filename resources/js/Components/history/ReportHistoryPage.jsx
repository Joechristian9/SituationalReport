import { memo, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, ChevronRight, Download, FileText, History, Pause, RefreshCw } from 'lucide-react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { PANEL_PAGINATION } from '@/Components/data/DataView';
import FormPanel from '@/Components/forms/FormPanel';
import { Button } from '@/Components/ui/button';
import DownloadExcelButton from '@/Components/ui/DownloadExcelButton';
import SearchBar from '@/Components/ui/SearchBar';
import TablePagination from '@/Components/ui/TablePagination';
import { SkeletonTable } from '@/Components/ui/skeleton';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import useMediaQuery from '@/hooks/useMediaQuery';
import { HISTORY_TYPES, TRAILING_COLUMNS, cellText, formatDate } from './historyTypes';

const DEFAULT_PER_PAGE = 10;
const DISASTERS_PER_PAGE = 5;

/**
 * One "Report History" page: the user's reports of one type, grouped by disaster
 * (newest first). Each disaster opens to a read-only table with Excel export, and
 * PDF links for the types that have them. `type` is a key of HISTORY_TYPES.
 */
export default function ReportHistoryPage({ type }) {
    const config = HISTORY_TYPES[type];
    const columns = useMemo(() => [...config.columns, ...TRAILING_COLUMNS], [config]);
    const Icon = config.icon;
    // Phones get cards, wider screens the table; only the one in use is rendered.
    const isWide = useMediaQuery('(min-width: 768px)');

    // The server pages the disasters and filters them by search, so only one page is ever loaded.
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const [perPage, setPerPage] = useState(DISASTERS_PER_PAGE);
    const [page, setPage] = useState(1);

    // No wait needed: the search box only sends a search on Enter or a picked suggestion.
    useEffect(() => {
        setTerm(search.trim());
        setPage(1);
    }, [search]);

    const { data, isLoading, isError, refetch, isFetching, isPlaceholderData } = useQuery({
        queryKey: ['report-history', type, page, perPage, term],
        queryFn: async () => {
            const params = { ...config.apiParams, page, per_page: perPage, ...(term ? { search: term } : {}) };
            return (await axios.get(route(config.api, params))).data;
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const groups = data?.data ?? [];
    const meta = data?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
    const offset = (meta.current_page - 1) * meta.per_page;

    // A refresh can leave the page past the end (a disaster was removed); step back.
    useEffect(() => {
        if (data && groups.length === 0 && meta.total > 0 && page > meta.last_page) setPage(meta.last_page);
    }, [data]);

    // One disaster open at a time; the newest starts open (undefined = not touched yet, null = all closed).
    const [openId, setOpenId] = useState(undefined);
    const isOpen = (id, index) => (openId === undefined ? index === 0 : openId === id);

    return (
        <AppLayout
            title={config.title}
            header={<Breadcrumbs crumbs={[{ label: 'Report history' }, { label: config.title }]} />}
        >

                <main className="h-full w-full bg-background p-4 sm:p-6">
                    <FormPanel className="overflow-hidden p-0 sm:p-0">
                        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h1 className="text-lg font-semibold leading-tight text-foreground">{config.title}</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">Reports you can see, grouped by disaster, newest first.</p>
                                </div>
                            </div>
                            {(meta.total > 1 || search) && <SearchBar value={search} onChange={setSearch} placeholder="Search disaster" />}
                        </div>

                        {isLoading ? (
                            <div className="p-4 sm:p-6">
                                <SkeletonTable columns={5} label="Loading history…" />
                            </div>
                        ) : isError ? (
                            <Message title="Could not load the history." text="Check your connection and try again.">
                                <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="mt-3 min-h-11 sm:min-h-9">
                                    <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
                                    Try again
                                </Button>
                            </Message>
                        ) : groups.length === 0 && !term ? (
                            <Message title="No reports yet." text="Reports you save during a disaster appear here, grouped by disaster." />
                        ) : groups.length === 0 ? (
                            <Message title={`No disaster matches “${term}”.`}>
                                <Button type="button" variant="link" onClick={() => { setSearch(''); setTerm(''); setPage(1); }} className="min-h-11 sm:min-h-9">
                                    Clear search
                                </Button>
                            </Message>
                        ) : (
                            <div aria-busy={isPlaceholderData} className={cn('transition-opacity motion-reduce:transition-none', isPlaceholderData && 'opacity-60')}>
                                {groups.map((group, i) => {
                                    const index = offset + i;
                                    return (
                                        <DisasterSection
                                            key={group.typhoon.id}
                                            group={group}
                                            config={config}
                                            columns={columns}
                                            isWide={isWide}
                                            open={isOpen(group.typhoon.id, index)}
                                            onToggle={() => setOpenId(isOpen(group.typhoon.id, index) ? null : group.typhoon.id)}
                                        />
                                    );
                                })}
                                <TablePagination
                                    currentPage={meta.current_page}
                                    totalPages={meta.last_page}
                                    totalItems={meta.total}
                                    perPage={meta.per_page}
                                    onPageChange={setPage}
                                    onPerPageChange={(n) => {
                                        setPerPage(n);
                                        setPage(1);
                                    }}
                                    itemLabel="disasters"
                                    className={PANEL_PAGINATION}
                                />
                            </div>
                        )}
                    </FormPanel>
                </main>
        </AppLayout>
    );
}

function DisasterSection({ group, config, columns, open, onToggle, isWide }) {
    const { typhoon, reports } = group;
    const panelId = `history-${typhoon.id}`;
    const period = `${formatDate(typhoon.started_at)} – ${typhoon.ended_at ? formatDate(typhoon.ended_at) : 'ongoing'}`;

    // The data is already loaded, so paging is client-side. Clamped in case a refresh shrinks the list.
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    const [pageState, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(reports.length / perPage));
    const page = Math.min(pageState, totalPages);
    const pageReports = reports.slice((page - 1) * perPage, page * perPage);

    return (
        <section className="border-b border-border last:border-b-0">
            <h2>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-6"
                >
                    <ChevronRight
                        className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', open && 'rotate-90')}
                        aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-foreground">{typhoon.name}</span>
                        <span className="block text-sm text-muted-foreground">
                            {typhoon.disaster_type ? `${typhoon.disaster_type} · ` : ''}
                            {period}
                        </span>
                    </span>
                    <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                        {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                    </span>
                    <StatusChip status={typhoon.status} />
                </button>
            </h2>

            {open && (
                <div id={panelId} className="space-y-3 px-4 pb-6 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm tabular-nums text-muted-foreground sm:hidden">
                            {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                        </p>
                        <div className="ml-auto flex flex-wrap gap-2">
                            {config.pdf && (
                                <>
                                    <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
                                        <a href={route(config.pdf, typhoon.id)} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4" aria-hidden="true" />
                                            View PDF
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
                                        <a href={route(config.pdf, { typhoon: typhoon.id, download: 1 })}>
                                            <Download className="h-4 w-4" aria-hidden="true" />
                                            Download PDF
                                        </a>
                                    </Button>
                                </>
                            )}
                            <ExportExcel reports={reports} columns={columns} config={config} typhoon={typhoon} />
                        </div>
                    </div>

                    {/* Only the layout in use is rendered, so a phone never builds the table (or a desktop the cards). */}
                    {!isWide ? (
                        <ul className="space-y-3" aria-label={`${config.title}: ${typhoon.name}`}>
                            {pageReports.map((report) => (
                                <li key={report.id}>
                                    <ReportCard report={report} columns={columns} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full min-w-[48rem] border-collapse text-sm">
                                <caption className="sr-only">
                                    {config.title}: {typhoon.name}
                                </caption>
                                <thead className="bg-muted/60">
                                    <tr>
                                        {columns.map((column) => (
                                            <th
                                                key={column.name}
                                                scope="col"
                                                className={cn('px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', column.align === 'right' && 'text-right')}
                                            >
                                                {column.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageReports.map((report) => (
                                        <tr key={report.id} className="border-t border-border">
                                            {columns.map((column) => {
                                                const text = cellText(column, report);
                                                return (
                                                    <td
                                                        key={column.name}
                                                        className={cn(
                                                            'whitespace-pre-line px-3 py-2.5 align-top text-foreground',
                                                            column.align === 'right' && 'tabular-nums text-right',
                                                        )}
                                                    >
                                                        {text || <span className="text-muted-foreground">—</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <TablePagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={reports.length}
                        perPage={perPage}
                        onPageChange={setPage}
                        onPerPageChange={(n) => {
                            setPerPage(n);
                            setPage(1);
                        }}
                        itemLabel="reports"
                        className="pt-1"
                    />
                </div>
            )}
        </section>
    );
}

const TRAILING_NAMES = TRAILING_COLUMNS.map((column) => column.name);

/**
 * A report on a phone: the first column is the heading, a text second column its
 * subtitle, numbers sit two to a row, text takes the full width, and who/when closes the card.
 */
const ReportCard = memo(function ReportCard({ report, columns }) {
    const [titleColumn, secondColumn] = columns;
    const subtitle = secondColumn && secondColumn.align !== 'right' ? cellText(secondColumn, report) : '';
    const skip = secondColumn && secondColumn.align !== 'right' ? 2 : 1;
    const fields = columns
        .slice(skip)
        .filter((column) => !TRAILING_NAMES.includes(column.name))
        .map((column) => ({ column, text: cellText(column, report) }))
        .filter(({ text }) => text !== '');
    const updatedBy = report.user?.name;
    const updatedAt = cellText(TRAILING_COLUMNS[0], report);

    return (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="break-words text-base font-semibold leading-snug text-foreground">
                {cellText(titleColumn, report) || '—'}
            </h3>
            {subtitle && <p className="mt-0.5 break-words text-sm text-muted-foreground">{subtitle}</p>}

            {fields.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3">
                    {fields.map(({ column, text }) => (
                        <div key={column.name} className={cn('min-w-0', column.align !== 'right' && 'col-span-2')}>
                            <dt className="text-xs font-medium text-muted-foreground">{column.label}</dt>
                            <dd
                                className={cn(
                                    'mt-0.5 whitespace-pre-line break-words text-sm text-foreground',
                                    column.align === 'right' && 'text-base font-semibold tabular-nums',
                                )}
                            >
                                {text}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {(updatedBy || updatedAt) && (
                <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
                    {updatedBy ? `Updated by ${updatedBy}` : 'Updated'}
                    {updatedAt ? ` · ${updatedAt}` : ''}
                </p>
            )}
        </article>
    );
});

// Design system status mapping: icon and text, never colour alone.
const STATUS = {
    active: { label: 'Active', icon: null, className: 'border-success/30 bg-success/10 text-success' },
    paused: { label: 'Paused', icon: Pause, className: 'border-warning/30 bg-warning/10 text-warning' },
    ended: { label: 'Ended', icon: CheckCircle2, className: 'border-border bg-muted text-muted-foreground' },
};

function StatusChip({ status }) {
    const chip = STATUS[status] ?? { label: status, icon: null, className: 'border-border bg-muted text-muted-foreground' };
    const ChipIcon = chip.icon;
    return (
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', chip.className)}>
            {ChipIcon ? <ChipIcon className="h-3 w-3" aria-hidden="true" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
            {chip.label}
        </span>
    );
}

function Message({ title, text, children }) {
    return (
        <div className="px-4 py-14 text-center">
            <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium text-foreground">{title}</p>
            {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
            {children}
        </div>
    );
}

// The Excel rows are built when the section is open, and only re-built when its data changes.
function ExportExcel({ reports, columns, config, typhoon }) {
    const rows = useMemo(
        () => reports.map((report) => Object.fromEntries(columns.map((column) => [column.label, cellText(column, report)]))),
        [reports, columns],
    );

    return (
        <DownloadExcelButton
            data={rows}
            fileName={`${config.title} - ${typhoon.name}`.replace(/[^\w -]+/g, '').replace(/\s+/g, '_')}
            sheetName={typhoon.name.slice(0, 31)}
        />
    );
}
