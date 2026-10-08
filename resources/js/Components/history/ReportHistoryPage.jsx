import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, ChevronRight, Download, FileText, History, Pause, RefreshCw } from 'lucide-react';
import { AppSidebar } from '@/Components/app-sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import FormPanel from '@/Components/forms/FormPanel';
import { Button } from '@/Components/ui/button';
import DownloadExcelButton from '@/Components/ui/DownloadExcelButton';
import SearchBar from '@/Components/ui/SearchBar';
import { Separator } from '@/Components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { SkeletonTable } from '@/Components/ui/skeleton';
import { CELL_LABEL, STACKED_TABLE } from '@/lib/responsiveTable';
import { cn } from '@/lib/utils';
import { HISTORY_TYPES, TRAILING_COLUMNS, cellText, formatDate } from './historyTypes';

/**
 * One "Report History" page: the user's reports of one type, grouped by disaster
 * (newest first). Each disaster opens to a read-only table with Excel export, and
 * PDF links for the types that have them. `type` is a key of HISTORY_TYPES.
 */
export default function ReportHistoryPage({ type }) {
    const config = HISTORY_TYPES[type];
    const columns = useMemo(() => [...config.columns, ...TRAILING_COLUMNS], [config]);
    const Icon = config.icon;

    const { data: groups = [], isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['report-history', type],
        queryFn: async () => (await axios.get(route(config.api))).data,
        staleTime: 5 * 60 * 1000,
    });

    const [search, setSearch] = useState('');
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return groups;
        return groups.filter(({ typhoon }) => `${typhoon.name} ${typhoon.disaster_type ?? ''}`.toLowerCase().includes(term));
    }, [groups, search]);

    // The newest disaster starts open; everything else is the user's choice.
    const [open, setOpen] = useState({});
    const isOpen = (id, index) => open[id] ?? index === 0;

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title={config.title} />
            <SidebarInset>
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 px-4 backdrop-blur-sm sm:px-6">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="mx-2 h-6" />
                        <Breadcrumbs crumbs={[{ label: 'Report history' }, { label: config.title }]} />
                    </div>
                </header>

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
                            {groups.length > 1 && <SearchBar value={search} onChange={setSearch} placeholder="Search disaster" />}
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
                        ) : groups.length === 0 ? (
                            <Message title="No reports yet." text="Reports you save during a disaster appear here, grouped by disaster." />
                        ) : visible.length === 0 ? (
                            <Message title={`No disaster matches “${search}”.`}>
                                <Button type="button" variant="link" onClick={() => setSearch('')} className="min-h-11 sm:min-h-9">
                                    Clear search
                                </Button>
                            </Message>
                        ) : (
                            visible.map((group, index) => (
                                <DisasterSection
                                    key={group.typhoon.id}
                                    group={group}
                                    config={config}
                                    columns={columns}
                                    open={isOpen(group.typhoon.id, index)}
                                    onToggle={() => setOpen((prev) => ({ ...prev, [group.typhoon.id]: !isOpen(group.typhoon.id, index) }))}
                                />
                            ))
                        )}
                    </FormPanel>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

function DisasterSection({ group, config, columns, open, onToggle }) {
    const { typhoon, reports } = group;
    const panelId = `history-${typhoon.id}`;
    const period = `${formatDate(typhoon.started_at)} – ${typhoon.ended_at ? formatDate(typhoon.ended_at) : 'ongoing'}`;
    const exportRows = useMemo(
        () => reports.map((report) => Object.fromEntries(columns.map((column) => [column.label, cellText(column, report)]))),
        [reports, columns],
    );

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
                            <DownloadExcelButton
                                data={exportRows}
                                fileName={`${config.title} - ${typhoon.name}`.replace(/[^\w -]+/g, '').replace(/\s+/g, '_')}
                                sheetName={typhoon.name.slice(0, 31)}
                            />
                        </div>
                    </div>

                    <div className="md:overflow-x-auto md:rounded-lg md:border md:border-border">
                        <table className={cn('w-full border-collapse text-sm', STACKED_TABLE, 'md:min-w-[48rem]')}>
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
                                {reports.map((report) => (
                                    <tr key={report.id} className="md:border-t md:border-border">
                                        {columns.map((column) => {
                                            const text = cellText(column, report);
                                            return (
                                                <td
                                                    key={column.name}
                                                    className={cn(
                                                        'whitespace-pre-line px-3 py-2.5 align-top text-foreground',
                                                        column.align === 'right' && 'tabular-nums md:text-right',
                                                    )}
                                                >
                                                    <span className={CELL_LABEL}>{column.label}</span>
                                                    {text || <span className="text-muted-foreground">—</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}

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
