import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { AppSidebar } from '@/Components/app-sidebar';
import { Separator } from '@/Components/ui/separator';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import TablePagination, { laravelPagination } from '@/Components/ui/TablePagination';
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
    Search,
    SearchX,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    X,
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

const dayHeading = (iso) => {
    const d = new Date(iso);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEEE, MMM d, yyyy');
};
const dayKey = (iso) => format(new Date(iso), 'yyyy-MM-dd');
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

function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 py-0.5 pl-2.5 pr-1 text-sm text-gray-700">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`Remove filter: ${label}`}
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </span>
    );
}

function FilterSelect({ id, label, value, onChange, allLabel, options }) {
    return (
        <div className="min-w-0">
            <Label htmlFor={id} className="text-sm text-gray-600">{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="mt-1">
                    <SelectValue placeholder={allLabel} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{allLabel}</SelectItem>
                    {options.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
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

    // Filters apply as soon as they change.
    const applyFilters = (overrides) => {
        router.get(route('admin.audit-logs'), clean({ ...currentParams(), ...overrides }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
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

    const chips = [
        filters.search && { label: `“${filters.search}”`, clear: () => { setSearchQuery(''); applyFilters({ search: '' }); } },
        filters.action && { label: labelFor(filterOptions.actions, filters.action), clear: () => applyFilters({ action: '' }) },
        filters.user_id && { label: `By ${labelFor(filterOptions.users, filters.user_id, 'id', 'name')}`, clear: () => applyFilters({ user_id: '' }) },
        filters.module && { label: labelFor(filterOptions.modules, filters.module), clear: () => applyFilters({ module: '' }) },
        filters.disaster_id && { label: labelFor(filterOptions.disasters, filters.disaster_id, 'id', 'name'), clear: () => applyFilters({ disaster_id: '' }) },
        filters.start_date && { label: `From ${format(new Date(filters.start_date + 'T00:00'), 'MMM d, yyyy')}`, clear: () => applyFilters({ start_date: '' }) },
        filters.end_date && { label: `To ${format(new Date(filters.end_date + 'T00:00'), 'MMM d, yyyy')}`, clear: () => applyFilters({ end_date: '' }) },
    ].filter(Boolean);

    const clearAll = () => {
        setSearchQuery('');
        router.get(route('admin.audit-logs'), clean({ per_page: perPage === 20 ? '' : perPage }), { preserveScroll: true, replace: true });
    };

    // Group the page's entries by day.
    const groups = useMemo(() => {
        const out = [];
        logs.data.forEach((log) => {
            const key = log.created_at_iso ? dayKey(log.created_at_iso) : 'unknown';
            let group = out[out.length - 1];
            if (!group || group.key !== key) {
                group = { key, heading: log.created_at_iso ? dayHeading(log.created_at_iso) : 'Unknown date', items: [] };
                out.push(group);
            }
            group.items.push(log);
        });
        return out;
    }, [logs.data]);

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
        <SidebarProvider>
            <AppSidebar />
            <Head title="Audit Logs" />
            <SidebarInset>
                <Toaster position="top-right" richColors />
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 px-4 backdrop-blur-sm sm:px-6">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="mx-2 h-6" />
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h1 className="text-lg font-semibold text-blue-700 sm:text-xl">Audit Logs</h1>
                    <LiveIndicator live={live} className="ml-auto" />
                </header>

                <div className="flex-1 overflow-auto bg-gray-50/60 p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Title */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Activity</h2>
                                <p className="mt-1 text-base text-gray-600">
                                    Every sign-in and every report added, changed or removed, with who did it and when.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="self-start sm:self-auto">
                                <a href={exportUrl}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </a>
                            </Button>
                        </div>

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

                        {/* Filters */}
                        <div className="rounded-lg border bg-white p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="sm:col-span-2">
                                    <Label htmlFor="log-search" className="text-sm text-gray-600">Search</Label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="log-search"
                                            type="search"
                                            placeholder="Name, email, IP address or note"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="log-from" className="text-sm text-gray-600">From</Label>
                                    <Input
                                        id="log-from"
                                        type="date"
                                        value={filters.start_date || ''}
                                        max={filters.end_date || undefined}
                                        onChange={(e) => applyFilters({ start_date: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="log-to" className="text-sm text-gray-600">To</Label>
                                    <Input
                                        id="log-to"
                                        type="date"
                                        value={filters.end_date || ''}
                                        min={filters.start_date || undefined}
                                        onChange={(e) => applyFilters({ end_date: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
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
                            </div>

                            {chips.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                                    <span className="text-sm text-gray-500">Filtered by</span>
                                    {chips.map((chip) => (
                                        <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="ml-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Feed */}
                        <section className="overflow-hidden rounded-lg border bg-white">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Entries
                                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-blue-700">
                                        {logs.total}
                                    </span>
                                </h3>
                                {logs.data.length > 0 && (
                                    <p className="hidden text-sm text-gray-500 sm:block">Select an entry to see exactly what changed</p>
                                )}
                            </div>

                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center px-4 py-14 text-center">
                                    <SearchX className="mb-3 h-10 w-10 text-gray-300" />
                                    <p className="text-base font-medium text-gray-900">No activity matches these filters</p>
                                    <p className="mt-1 text-sm text-gray-500">Try a wider date range or remove a filter.</p>
                                    {chips.length > 0 && (
                                        <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
                                            Clear filters
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                groups.map((group) => (
                                    <div key={group.key}>
                                        <h4 className="border-b bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600">
                                            {group.heading}
                                        </h4>
                                        <ul className="divide-y">
                                            {group.items.map((log) => (
                                                <li key={log.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetails(log)}
                                                        className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 md:grid-cols-[5rem_auto_1fr_auto_auto] md:items-center"
                                                    >
                                                        <span className="hidden text-sm tabular-nums text-gray-500 md:block">
                                                            {log.created_at_iso ? timeOf(log.created_at_iso) : ''}
                                                        </span>
                                                        <ActionIcon action={log.action} />
                                                        <span className="min-w-0">
                                                            <span className="block text-base text-gray-700">
                                                                <Sentence log={log} />
                                                                {log.action === 'updated' && log.changes_count > 0 && (
                                                                    <span className="text-gray-500">
                                                                        {' '}· {log.changes_count} field{log.changes_count === 1 ? '' : 's'}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500">
                                                                <span className="md:hidden tabular-nums">
                                                                    {log.created_at_iso ? timeOf(log.created_at_iso) : ''}
                                                                </span>
                                                                {!isSystem(log) && <span className="truncate">{log.user.email}</span>}
                                                                {log.disaster?.name && (
                                                                    <span className="truncate text-gray-600">· {log.disaster.name}</span>
                                                                )}
                                                                {!RECORD_ACTIONS.includes(log.action) && log.description && (
                                                                    <span className="truncate">· {log.description}</span>
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span className="hidden lg:block">
                                                            <ActionChip log={log} />
                                                        </span>
                                                        <span className="hidden font-mono text-sm text-gray-500 md:block md:w-32 md:text-right">
                                                            {log.ip_address}
                                                        </span>
                                                        <ChevronRight className="h-4 w-4 self-center text-gray-400 md:hidden" aria-hidden="true" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}

                            {logs.data.length > 0 && (
                                <TablePagination
                                    {...laravelPagination(logs)}
                                    onPerPageChange={(n) => applyFilters({ per_page: n === 20 ? '' : n, page: '' })}
                                    itemLabel="entries"
                                    className="border-t px-4 py-3"
                                />
                            )}
                        </section>
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
            </SidebarInset>
        </SidebarProvider>
    );
}
