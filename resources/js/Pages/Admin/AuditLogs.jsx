import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import AppLayout from '@/Layouts/AppLayout';
import PageTitle from '@/Components/PageTitle';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import TablePagination, { laravelPagination } from '@/Components/ui/TablePagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeletonRows,
} from '@/Components/ui/table';
import {
    DataPanel,
    DataToolbar,
    EmptyState,
    FilterDate,
    FilterSelect,
    PANEL_PAGINATION,
    useDelayedFlag,
} from '@/Components/data/DataView';
import { toast, Toaster } from 'sonner';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import LiveIndicator from '@/Components/LiveIndicator';
import {
    Activity,
    ArrowRight,
    ChevronRight,
    Download,
    FilePen,
    KeyRound,
    LogIn,
    LogOut,
    Plus,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { SkeletonList } from '@/Components/ui/skeleton';

// How each action is drawn and phrased. Full class strings so Tailwind keeps them.
const ACTIONS = {
    created: { icon: Plus, verb: 'created', tone: 'bg-emerald-100 text-emerald-700', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    updated: { icon: FilePen, verb: 'updated', tone: 'bg-blue-100 text-blue-700', chip: 'bg-blue-50 text-blue-700 ring-blue-200' },
    deleted: { icon: Trash2, verb: 'deleted', tone: 'bg-red-100 text-red-700', chip: 'bg-red-50 text-red-700 ring-red-200' },
    login: { icon: LogIn, verb: 'signed in', tone: 'bg-violet-100 text-violet-700', chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
    logout: { icon: LogOut, verb: 'signed out', tone: 'bg-gray-100 text-gray-600', chip: 'bg-gray-50 text-gray-700 ring-gray-200' },
    failed_login: { icon: ShieldAlert, verb: 'failed sign-in attempt', tone: 'bg-orange-100 text-orange-700', chip: 'bg-orange-50 text-orange-700 ring-orange-200' },
    exported: { icon: Download, verb: 'exported data', tone: 'bg-indigo-100 text-indigo-700', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    password_changed: { icon: KeyRound, verb: 'changed a password', tone: 'bg-amber-100 text-amber-700', chip: 'bg-amber-50 text-amber-800 ring-amber-200' },
    permission_changed: { icon: ShieldCheck, verb: 'changed permissions', tone: 'bg-pink-100 text-pink-700', chip: 'bg-pink-50 text-pink-700 ring-pink-200' },
};
const FALLBACK_ACTION = { icon: Activity, verb: null, tone: 'bg-gray-100 text-gray-600', chip: 'bg-gray-50 text-gray-700 ring-gray-200' };
const actionStyle = (action) => ACTIONS[action] || FALLBACK_ACTION;
const RECORD_ACTIONS = ['created', 'updated', 'deleted'];

const dateOf = (iso) => {
    const d = new Date(iso);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
};
const timeOf = (iso) => format(new Date(iso), 'h:mm a');

const isSystem = (log) => !log.user?.id;

function ActionIcon({ action, size = 'h-8 w-8' }) {
    const { icon: Icon, tone } = actionStyle(action);
    return (
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
            <Icon className="h-4 w-4" />
        </span>
    );
}

function ActionChip({ log }) {
    const { chip } = actionStyle(log.action);
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${chip}`}>
            {log.action_name}
        </span>
    );
}

// "Cdrrmo created Casualty #10"
function Sentence({ log }) {
    const { verb } = actionStyle(log.action);
    const who = <span className="font-semibold text-gray-900">{log.user?.name || 'System'}</span>;
    const target =
        log.auditable_id || log.module !== 'System' ? (
            <span className="font-semibold text-gray-900">
                {log.module}
                {log.auditable_id ? <span className="font-normal text-gray-500"> #{log.auditable_id}</span> : null}
            </span>
        ) : null;

    if (RECORD_ACTIONS.includes(log.action)) {
        return (
            <>
                {who} {verb} {target}
            </>
        );
    }
    if (log.action === 'failed_login') {
        return <span className="font-semibold text-orange-800">Failed sign-in attempt</span>;
    }
    return (
        <>
            {who} {verb || log.action_name.toLowerCase()}
            {target && log.module !== 'System' ? <> on {target}</> : null}
        </>
    );
}

function SummaryTile({ label, value, icon: Icon, tone, warn }) {
    return (
        <div className={`flex items-center gap-3 rounded-lg border bg-white p-4 ${warn ? 'border-orange-300' : ''}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
            </div>
        </div>
    );
}


function EmptyValue() {
    return <span className="italic text-gray-500">empty</span>;
}

function LogDetail({ details }) {
    const { log, changes = [] } = details;
    const isUpdate = log.action === 'updated';

    return (
        <div className="space-y-6">
            <dl className="divide-y rounded-lg border text-sm">
                {[
                    ['When', <>{log.created_at}<span className="block text-gray-500">{log.created_at_human}</span></>],
                    ['By', <>{log.user.name}<span className="block text-gray-500">{log.user.email}</span></>],
                    ['Record', log.auditable_id ? `${log.module} #${log.auditable_id}` : log.module],
                    log.disaster && ['Disaster', log.disaster.name],
                    ['IP address', <span className="font-mono">{log.ip_address || '—'}</span>],
                    log.user_agent && ['Device', <span className="break-all text-gray-600">{log.user_agent}</span>],
                    log.description && ['Note', log.description],
                ]
                    .filter(Boolean)
                    .map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3 px-3 py-2.5">
                            <dt className="text-gray-500">{label}</dt>
                            <dd className="min-w-0 break-words text-gray-900">{value}</dd>
                        </div>
                    ))}
            </dl>

            <section>
                <h3 className="mb-2 flex items-baseline justify-between text-sm font-semibold text-gray-900">
                    {isUpdate ? 'What changed' : log.action === 'created' ? 'Values entered' : log.action === 'deleted' ? 'Values removed' : 'Details'}
                    {changes.length > 0 && (
                        <span className="text-xs font-normal text-gray-500">
                            {changes.length} field{changes.length === 1 ? '' : 's'}
                        </span>
                    )}
                </h3>

                {changes.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-gray-500">
                        No field changes were recorded for this entry.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {changes.map((change, i) => (
                            <li key={`${change.field_key}-${i}`} className="px-3 py-2.5">
                                <p className="text-sm font-medium text-gray-700">{change.field}</p>
                                {isUpdate ? (
                                    <div className="mt-1 flex flex-wrap items-start gap-2 text-sm">
                                        <span className="min-w-0 break-words rounded bg-red-50 px-2 py-1 text-red-800 line-through decoration-red-300">
                                            {change.old_value || <EmptyValue />}
                                        </span>
                                        <ArrowRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" /><span className="sr-only">changed to</span>
                                        <span className="min-w-0 break-words rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                                            {change.new_value || <EmptyValue />}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="mt-0.5 break-words text-sm text-gray-900">{change.value || <EmptyValue />}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default function AuditLogs({ logs, filters, filterOptions, summary }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selected, setSelected] = useState(null);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const perPage = Number(filters.per_page) || 20;
    const stats = summary || { events: 0, changes: 0, active_users: 0, failed_logins: 0 };
    const live = useLiveRefresh({ only: ['logs', 'summary'] });

    const currentParams = () => ({
        search: filters.search || '',
        user_id: filters.user_id || '',
        action: filters.action || '',
        module: filters.module || '',
        disaster_id: filters.disaster_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        per_page: perPage === 20 ? '' : perPage,
    });

    const clean = (params) =>
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

    const [loading, setLoading] = useState(false);
    const showSkeleton = useDelayedFlag(loading);
    const visitOptions = { onStart: () => setLoading(true), onFinish: () => setLoading(false) };

    // Filters apply as soon as they change.
    const applyFilters = (overrides) => {
        router.get(route('admin.audit-logs'), clean({ ...currentParams(), ...overrides }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            ...visitOptions,
        });
    };

    // Search applies after a short pause in typing.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if ((filters.search || '') === searchQuery) return;
        const t = setTimeout(() => applyFilters({ search: searchQuery }), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const exportUrl = route('admin.audit-logs.export', clean({ ...currentParams(), per_page: '' }));

    const labelFor = (list, value, key = 'value', labelKey = 'label') =>
        list.find((o) => String(o[key]) === String(value))?.[labelKey] || value;
    const dayLabel = (value) => format(new Date(`${value}T00:00`), 'MMM d, yyyy');

    const chips = [
        filters.action && { key: 'action', label: `Action: ${labelFor(filterOptions.actions, filters.action)}`, onRemove: () => applyFilters({ action: '' }) },
        filters.user_id && { key: 'user', label: `Account: ${labelFor(filterOptions.users, filters.user_id, 'id', 'name')}`, onRemove: () => applyFilters({ user_id: '' }) },
        filters.module && { key: 'module', label: `Report type: ${labelFor(filterOptions.modules, filters.module)}`, onRemove: () => applyFilters({ module: '' }) },
        filters.disaster_id && { key: 'disaster', label: `Disaster: ${labelFor(filterOptions.disasters, filters.disaster_id, 'id', 'name')}`, onRemove: () => applyFilters({ disaster_id: '' }) },
        filters.start_date && { key: 'from', label: `From: ${dayLabel(filters.start_date)}`, onRemove: () => applyFilters({ start_date: '' }) },
        filters.end_date && { key: 'to', label: `To: ${dayLabel(filters.end_date)}`, onRemove: () => applyFilters({ end_date: '' }) },
    ].filter(Boolean);
    const activeFilterCount = chips.length;

    const clearAll = () => {
        setSearchQuery('');
        router.get(route('admin.audit-logs'), clean({ per_page: perPage === 20 ? '' : perPage }), {
            preserveScroll: true,
            replace: true,
            ...visitOptions,
        });
    };

    const openDetails = async (log) => {
        setSelected(log);
        setDetails(null);
        setLoadingDetails(true);
        try {
            const response = await axios.get(route('admin.audit-logs.show', log.id));
            setDetails(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not load this entry. Try again.');
            setSelected(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <AppLayout
            title="Audit Logs"
            header={<PageTitle icon={Shield}>Audit Logs</PageTitle>}
            actions={<LiveIndicator live={live} />}
        >
                <Toaster position="top-right" richColors />

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Today */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <SummaryTile label="Events today" value={stats.events} icon={Activity} tone="bg-blue-50 text-blue-600" />
                            <SummaryTile label="Report changes today" value={stats.changes} icon={FilePen} tone="bg-emerald-50 text-emerald-700" />
                            <SummaryTile label="Accounts active today" value={stats.active_users} icon={UserCheck} tone="bg-violet-50 text-violet-700" />
                            <SummaryTile
                                label="Failed sign-ins today"
                                value={stats.failed_logins}
                                icon={ShieldAlert}
                                tone={stats.failed_logins > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}
                                warn={stats.failed_logins > 0}
                            />
                        </div>

                        <DataPanel
                            icon={Activity}
                            title="Activity"
                            count={logs.total}
                            description="Every sign-in and every report added, changed or removed, with who did it and when."
                            actions={
                                <Button asChild variant="outline" className="h-11 gap-2 bg-card shadow-sm md:h-9">
                                    <a href={exportUrl}>
                                        <Download className="h-4 w-4" aria-hidden="true" />
                                        Export CSV
                                    </a>
                                </Button>
                            }
                        >
                            <DataToolbar
                                search={{
                                    id: 'log-search',
                                    value: searchQuery,
                                    onChange: setSearchQuery,
                                    placeholder: 'Name, email, IP address or note',
                                }}
                                filters={
                                    <>
                                        <FilterSelect
                                            id="log-action"
                                            label="Action"
                                            value={filters.action || 'all'}
                                            onChange={(v) => applyFilters({ action: v === 'all' ? '' : v })}
                                            allLabel="All actions"
                                            options={filterOptions.actions}
                                        />
                                        <FilterSelect
                                            id="log-user"
                                            label="Account"
                                            value={filters.user_id ? String(filters.user_id) : 'all'}
                                            onChange={(v) => applyFilters({ user_id: v === 'all' ? '' : v })}
                                            allLabel="All accounts"
                                            options={filterOptions.users.map((u) => ({ value: u.id, label: u.name }))}
                                        />
                                        <FilterSelect
                                            id="log-module"
                                            label="Report type"
                                            value={filters.module || 'all'}
                                            onChange={(v) => applyFilters({ module: v === 'all' ? '' : v })}
                                            allLabel="All report types"
                                            options={filterOptions.modules}
                                        />
                                        <FilterSelect
                                            id="log-disaster"
                                            label="Disaster"
                                            value={filters.disaster_id ? String(filters.disaster_id) : 'all'}
                                            onChange={(v) => applyFilters({ disaster_id: v === 'all' ? '' : v })}
                                            allLabel="All disasters"
                                            options={filterOptions.disasters.map((d) => ({ value: d.id, label: d.name }))}
                                        />
                                        <FilterDate
                                            id="log-from"
                                            label="From"
                                            value={filters.start_date || ''}
                                            max={filters.end_date || undefined}
                                            onChange={(value) => applyFilters({ start_date: value })}
                                        />
                                        <FilterDate
                                            id="log-to"
                                            label="To"
                                            value={filters.end_date || ''}
                                            min={filters.start_date || undefined}
                                            onChange={(value) => applyFilters({ end_date: value })}
                                        />
                                    </>
                                }
                                chips={chips}
                                onClearAll={clearAll}
                            />

                            {logs.data.length === 0 && !showSkeleton ? (
                                <EmptyState
                                    title="No activity matches these filters"
                                    description="Try a wider date range or remove a filter."
                                    action={
                                        (filters.search || activeFilterCount > 0) && (
                                            <Button variant="outline" onClick={clearAll}>
                                                Clear filters
                                            </Button>
                                        )
                                    }
                                />
                            ) : (
                                <>
                                    <Table stacked>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>When</TableHead>
                                                <TableHead>Account</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Record</TableHead>
                                                <TableHead className="hidden lg:table-cell">IP address</TableHead>
                                                <TableHead className="text-right">
                                                    <span className="sr-only">Details</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody aria-busy={loading}>
                                            {showSkeleton ? (
                                                <TableSkeletonRows columns={6} rows={Math.min(logs.data.length || 8, 10)} />
                                            ) : logs.data.map((log) => (
                                                <TableRow
                                                    key={log.id}
                                                    onClick={() => openDetails(log)}
                                                    className="cursor-pointer"
                                                >
                                                    <TableCell label="When" className="whitespace-nowrap tabular-nums">
                                                        {log.created_at_iso ? (
                                                            <>
                                                                <div className="text-foreground">{dateOf(log.created_at_iso)}</div>
                                                                <div className="text-xs text-muted-foreground">{timeOf(log.created_at_iso)}</div>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground">Unknown</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell label="Account">
                                                        <div className="font-medium text-foreground">{log.user?.name || 'System'}</div>
                                                        {!isSystem(log) && (
                                                            <div className="max-w-[16rem] truncate text-xs text-muted-foreground">{log.user.email}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell label="Action">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <ActionChip log={log} />
                                                            {log.action === 'updated' && log.changes_count > 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {log.changes_count} field{log.changes_count === 1 ? '' : 's'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell label="Record">
                                                        <div className="text-foreground">
                                                            {log.module}
                                                            {log.auditable_id ? <span className="text-muted-foreground"> #{log.auditable_id}</span> : null}
                                                        </div>
                                                        {(log.disaster?.name || (!RECORD_ACTIONS.includes(log.action) && log.description)) && (
                                                            <div className="max-w-[18rem] truncate text-xs text-muted-foreground">
                                                                {log.disaster?.name || log.description}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell label="IP address" className="font-mono text-xs text-muted-foreground md:hidden lg:table-cell">
                                                        {log.ip_address || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDetails(log);
                                                            }}
                                                            className="h-11 gap-1 text-primary hover:bg-accent hover:text-primary md:h-8"
                                                            aria-label={`View entry: ${log.user?.name || 'System'} ${log.action_name}`}
                                                        >
                                                            View
                                                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {showSkeleton && <tr className="sr-only"><td>Loading entries…</td></tr>}
                                        </TableBody>
                                    </Table>

                                    <TablePagination
                                        {...laravelPagination(logs)}
                                        onPerPageChange={(n) => applyFilters({ per_page: n === 20 ? '' : n, page: '' })}
                                        itemLabel="entries"
                                        className={PANEL_PAGINATION}
                                    />
                                </>
                            )}
                        </DataPanel>
                    </div>
                </div>

                {/* Entry detail */}
                <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                        {selected && (
                            <>
                                <SheetHeader className="pr-6 text-left">
                                    <div className="flex items-start gap-3">
                                        <ActionIcon action={selected.action} size="h-10 w-10" />
                                        <div className="min-w-0">
                                            <SheetTitle className="text-lg font-normal leading-snug text-gray-700">
                                                <Sentence log={selected} />
                                            </SheetTitle>
                                            <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                                                <ActionChip log={selected} />
                                                <span>{selected.created_at}</span>
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                                <div className="mt-6">
                                    {loadingDetails || !details ? (
                                        <SkeletonList rows={3} label="Loading entry…" />
                                    ) : (
                                        <LogDetail details={details} />
                                    )}
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
        </AppLayout>
    );
}
