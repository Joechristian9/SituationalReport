import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
import { Skeleton } from '@/Components/ui/skeleton';
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
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    Clock,
    HeartPulse,
    MapPin,
    UserSearch,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useIsMobile } from '@/hooks/use-mobile';
import LiveIndicator from '@/Components/LiveIndicator';

/**
 * Shared layout for the admin Dead / Injured / Missing submission pages.
 * Each page passes its records (a Laravel paginator) and a small config
 * describing its columns and detail fields.
 */

// Semantic accents (design-system tokens). Full class strings so Tailwind keeps them.
// Dead = destructive, Injured = warning, Missing = info. Each tab also has its own icon + label.
const ACCENTS = {
    destructive: {
        icon: 'text-destructive',
        avatar: 'bg-destructive/10 text-destructive',
        tabActive: 'bg-card text-destructive shadow-sm ring-1 ring-destructive/30',
        tabCount: 'bg-destructive/10 text-destructive',
        bar: 'bg-destructive',
        stripe: 'border-t-destructive',
    },
    warning: {
        icon: 'text-warning',
        avatar: 'bg-warning/10 text-warning',
        tabActive: 'bg-card text-warning shadow-sm ring-1 ring-warning/30',
        tabCount: 'bg-warning/10 text-warning',
        bar: 'bg-warning',
        stripe: 'border-t-warning',
    },
    info: {
        icon: 'text-info',
        avatar: 'bg-info/10 text-info',
        tabActive: 'bg-card text-info shadow-sm ring-1 ring-info/30',
        tabCount: 'bg-info/10 text-info',
        bar: 'bg-info',
        stripe: 'border-t-info',
    },
};

const CATEGORIES = [
    { key: 'casualties', label: 'Dead', routeName: 'admin.casualties.submissions', icon: AlertTriangle, accent: 'destructive' },
    { key: 'injured', label: 'Injured', routeName: 'admin.injured.submissions', icon: HeartPulse, accent: 'warning' },
    { key: 'missing', label: 'Missing', routeName: 'admin.missing.submissions', icon: UserSearch, accent: 'info' },
];

const EMPTY_STATS = { total: 0, male: 0, female: 0, submitters: 0, latest_at: null };

const formatDateTime = (value) => {
    if (!value) return null;
    try {
        return format(new Date(value), 'MMM d, yyyy · h:mm a');
    } catch {
        return value;
    }
};

const formatDay = (value) => {
    if (!value) return null;
    try {
        return format(new Date(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
};

const formatTime = (value) => {
    if (!value) return null;
    try {
        return format(new Date(value), 'h:mm a');
    } catch {
        return '';
    }
};

const timeAgo = (value) => {
    if (!value) return null;
    try {
        return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch {
        return null;
    }
};

const formatField = (record, field) => {
    const value = record[field.key];
    if (value === null || value === undefined || value === '') return null;
    if (field.type === 'date') return formatDay(value);
    if (field.type === 'datetime') return formatDateTime(value);
    return value;
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : null);

const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return letters.toUpperCase();
};

const ageSex = (record) => {
    const bits = [];
    if (record.age !== null && record.age !== undefined && record.age !== '') bits.push(`${record.age} yrs`);
    if (record.sex) bits.push(capitalize(record.sex));
    return bits.length ? bits.join(' · ') : 'Age and sex not given';
};

const wasEdited = (record) =>
    record.updater && record.updated_at && record.created_at && record.updated_at !== record.created_at;

function Empty({ children }) {
    return <span className="text-muted-foreground">{children}</span>;
}

function SexSplit({ stats, accent }) {
    const other = Math.max(stats.total - stats.male - stats.female, 0);
    const pct = (n) => (stats.total ? (n / stats.total) * 100 : 0);

    return (
        <>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-xl font-semibold tabular-nums text-foreground sm:gap-x-3 sm:text-2xl">
                <span>
                    {stats.male}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">male</span>
                </span>
                <span>
                    {stats.female}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">female</span>
                </span>
            </p>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className={accent.bar} style={{ width: `${pct(stats.male)}%` }} />
                <div className="bg-muted-foreground/50" style={{ width: `${pct(stats.female)}%` }} />
            </div>
            {other > 0 && <p className="mt-1 text-xs text-muted-foreground">{other} not specified</p>}
        </>
    );
}

// Label over value, so a long address or cause gets the whole sheet width on a phone.
function DetailRow({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 min-w-0 break-words text-base text-foreground">{children}</dd>
        </div>
    );
}

/** One record on a phone: a single tap target with the essentials, instead of a stacked table row. */
function RecordCard({ record, config, accent, onOpen }) {
    const chips = config.columns
        .map((col) => ({ col, value: formatField(record, col) }))
        .filter((chip) => chip.value);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex min-h-[4.5rem] w-full items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.avatar}`}
                aria-hidden="true"
            >
                {initials(record.name)}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-foreground">{record.name || 'No name'}</span>
                <span className="block text-sm text-muted-foreground">{ageSex(record)}</span>
                {record.address && (
                    <span className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{record.address}</span>
                    </span>
                )}
                {chips.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                        {chips.map(({ col, value }) => (
                            <span key={col.key} className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                                <span className="shrink-0 text-muted-foreground">{col.label}:</span>
                                <span className="truncate font-medium text-foreground">{value}</span>
                            </span>
                        ))}
                    </span>
                )}
                <span className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{record.user?.name || 'Unknown'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                        {formatDay(record.created_at) || '—'}, {formatTime(record.created_at)}
                    </span>
                    {wasEdited(record) && (
                        <span className="rounded bg-accent px-1.5 py-0.5 font-medium text-accent-foreground">edited</span>
                    )}
                </span>
            </span>
            <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
    );
}

function RecordCardSkeleton() {
    return (
        <li aria-hidden="true" className="flex gap-3 px-4 py-3.5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-full" />
            </div>
        </li>
    );
}

export default function PersonSubmissions({ config, records, users = [], filters = {}, stats, disaster }) {
    const category = CATEGORIES.find((c) => c.key === config.category);
    const accent = ACCENTS[category.accent];
    const Icon = category.icon;
    const summary = { ...EMPTY_STATS, ...(stats || {}) };
    // The records prop is named after the category (casualties / injured / missing).
    // Live only while a disaster is active: without one, no new reports can arrive.
    const live = useLiveRefresh({ only: [config.category, 'stats', 'disaster'], enabled: Boolean(disaster) });

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id ? String(filters.user_id) : 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const perPage = Number(filters.per_page) || 20;

    const isMobile = useIsMobile();
    const sheetBodyRef = useRef(null);
    const selectedIndex = selected ? records.data.findIndex((r) => r.id === selected.id) : -1;
    const step = (delta) => {
        const next = records.data[selectedIndex + delta];
        if (!next) return;
        setSelected(next);
        sheetBodyRef.current?.scrollTo({ top: 0 });
    };

    const hasFilters = Boolean(filters.search || filters.user_id || filters.date_from || filters.date_to);
    const showSkeleton = useDelayedFlag(loading);

    const userName = users.find((u) => String(u.id) === String(filters.user_id))?.name;
    const chips = [
        filters.user_id && {
            key: 'user',
            label: `Submitted by: ${userName || 'selected account'}`,
            onRemove: () => { setSelectedUser('all'); visit({ user_id: '', page: '' }); },
        },
        filters.date_from && {
            key: 'from',
            label: `From: ${formatDay(filters.date_from)}`,
            onRemove: () => { setDateFrom(''); visit({ date_from: '', page: '' }); },
        },
        filters.date_to && {
            key: 'to',
            label: `To: ${formatDay(filters.date_to)}`,
            onRemove: () => { setDateTo(''); visit({ date_to: '', page: '' }); },
        },
    ].filter(Boolean);

    const visit = (overrides = {}) => {
        const params = {
            search: searchQuery,
            user_id: selectedUser === 'all' ? '' : selectedUser,
            date_from: dateFrom,
            date_to: dateTo,
            per_page: perPage === 20 ? '' : perPage,
            ...overrides,
        };
        Object.keys(params).forEach((key) => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) delete params[key];
        });
        router.get(route(category.routeName), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        setSelectedUser('all');
        setDateFrom('');
        setDateTo('');
        visit({ search: '', user_id: '', date_from: '', date_to: '' });
    };

    // Search applies after a short pause in typing; the other filters apply on change.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if ((filters.search || '') === searchQuery) return;
        const t = setTimeout(() => visit({ search: searchQuery, page: '' }), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const scopeLabel = disaster ? disaster.name : 'All disasters';

    return (
        <AppLayout
            title={config.title}
            header={
                <>
                    <Icon className={`h-5 w-5 shrink-0 ${accent.icon}`} aria-hidden="true" />
                    <Breadcrumbs
                        crumbs={[
                            { href: route('dashboard'), label: 'Dashboard' },
                            { label: config.title },
                        ]}
                    />
                </>
            }
            actions={<LiveIndicator live={live} />}
        >

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Title row */}
                        <div className="space-y-1 sm:space-y-3">
                            <Link
                                href={route('dashboard')}
                                className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded px-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:text-base"
                            >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                Dashboard
                            </Link>
                            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{config.title}</h1>
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:mt-1.5 sm:line-clamp-none sm:text-base">{config.description}</p>
                                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground sm:mt-2.5">
                                        <span
                                            className={`h-2 w-2 rounded-full ${disaster ? 'bg-success' : 'bg-muted-foreground/40'}`}
                                            aria-hidden="true"
                                        />
                                        {disaster ? (
                                            <>
                                                Active disaster: <span className="font-semibold text-foreground">{disaster.name}</span>
                                            </>
                                        ) : (
                                            'No active disaster. Showing records from all disasters.'
                                        )}
                                    </p>
                                </div>

                                {/* Category switcher: first and full width on phones (equal thirds), compact on the right from lg. */}
                                <nav className="order-first flex w-full rounded-xl bg-muted p-1 sm:inline-flex sm:w-auto sm:self-start sm:rounded-lg lg:order-none lg:self-auto" aria-label="Report type">
                                    {CATEGORIES.map((c) => {
                                        const active = c.key === category.key;
                                        const TabIcon = c.icon;
                                        return (
                                            <Link
                                                key={c.key}
                                                href={route(c.routeName)}
                                                aria-current={active ? 'page' : undefined}
                                                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:flex-none sm:rounded-md ${
                                                    active ? ACCENTS[c.accent].tabActive : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                <TabIcon className="h-4 w-4" aria-hidden="true" />
                                                {c.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Summary strip */}
                        <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-t-4 bg-border lg:grid-cols-4 ${accent.stripe}`}>
                            {/* Phones: the total is a wide cell with the latest submission folded in, so the strip is 1.5 rows instead of 2. */}
                            <div className="col-span-2 bg-card p-4 lg:col-span-1">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{config.statLabel}</dt>
                                <dd className="mt-1 flex items-end justify-between gap-3 lg:block">
                                    <span className="min-w-0">
                                        <span className="text-3xl font-semibold tabular-nums text-foreground">{summary.total}</span>
                                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                            {hasFilters ? 'Matching your filters' : scopeLabel}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-xs text-muted-foreground sm:hidden">
                                        Latest
                                        <span className="block text-sm font-semibold text-foreground">
                                            {summary.latest_at ? timeAgo(summary.latest_at) : 'None yet'}
                                        </span>
                                    </span>
                                </dd>
                            </div>
                            <div className="bg-card p-3 sm:p-4">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By sex</dt>
                                <dd className="mt-1">
                                    <SexSplit stats={summary} accent={accent} />
                                </dd>
                            </div>
                            <div className="bg-card p-3 sm:p-4">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reporting offices</dt>
                                <dd className="mt-1">
                                    <span className="flex items-center gap-2 text-2xl font-semibold tabular-nums text-foreground">
                                        <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                        {summary.submitters}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">With at least one record</span>
                                </dd>
                            </div>
                            <div className="bg-card p-4 max-sm:hidden">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest submission</dt>
                                <dd className="mt-1">
                                    <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                        <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                        {summary.latest_at ? timeAgo(summary.latest_at) : 'None yet'}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{formatDateTime(summary.latest_at)}</span>
                                </dd>
                            </div>
                        </dl>

                        {/* Records */}
                        <DataPanel
                            icon={Icon}
                            title={config.listTitle}
                            count={records.total}
                            description={hasFilters ? 'Matching your filters' : scopeLabel}
                        >
                            <DataToolbar
                                search={{
                                    id: 'record-search',
                                    value: searchQuery,
                                    onChange: setSearchQuery,
                                    placeholder: config.searchPlaceholder,
                                }}
                                filters={
                                    <>
                                        <FilterSelect
                                            id="record-user"
                                            label="Submitted by"
                                            value={selectedUser}
                                            onChange={(value) => {
                                                setSelectedUser(value);
                                                visit({ user_id: value === 'all' ? '' : value, page: '' });
                                            }}
                                            allLabel="Anyone"
                                            options={users.map((user) => ({ value: user.id, label: user.name }))}
                                        />
                                        <FilterDate
                                            id="record-from"
                                            label="From"
                                            value={dateFrom}
                                            max={dateTo || undefined}
                                            onChange={(value) => {
                                                setDateFrom(value);
                                                visit({ date_from: value, page: '' });
                                            }}
                                        />
                                        <FilterDate
                                            id="record-to"
                                            label="To"
                                            value={dateTo}
                                            min={dateFrom || undefined}
                                            onChange={(value) => {
                                                setDateTo(value);
                                                visit({ date_to: value, page: '' });
                                            }}
                                        />
                                    </>
                                }
                                chips={chips}
                                onClearAll={handleReset}
                            />

                            {records.data.length > 0 || showSkeleton ? (
                                <div aria-busy={loading}>
                                    {/* Phones: compact tappable cards. md and up: the table. */}
                                    <ul className="divide-y divide-border md:hidden">
                                        {showSkeleton ? (
                                            <>
                                                {Array.from({ length: Math.min(records.data.length || 6, 8) }, (_, i) => (
                                                    <RecordCardSkeleton key={i} />
                                                ))}
                                                <li className="sr-only">Loading records…</li>
                                            </>
                                        ) : (
                                            records.data.map((record) => (
                                                <li key={record.id}>
                                                    <RecordCard
                                                        record={record}
                                                        config={config}
                                                        accent={accent}
                                                        onOpen={() => setSelected(record)}
                                                    />
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                    <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Person</TableHead>
                                                <TableHead>Address</TableHead>
                                                {config.columns.map((col) => (
                                                    <TableHead key={col.key}>{col.label}</TableHead>
                                                ))}
                                                <TableHead>Submitted by</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead className="text-right">
                                                    <span className="sr-only">Details</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {showSkeleton ? (
                                                <TableSkeletonRows
                                                    columns={config.columns.length + 5}
                                                    rows={Math.min(records.data.length || 8, 10)}
                                                />
                                            ) : records.data.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    onClick={() => setSelected(record)}
                                                    className="cursor-pointer"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.avatar}`}
                                                                aria-hidden="true"
                                                            >
                                                                {initials(record.name)}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-foreground">{record.name || 'No name'}</div>
                                                                <div className="text-xs text-muted-foreground">{ageSex(record)}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell label="Address" className="text-muted-foreground">
                                                        <span className="line-clamp-2 max-w-[16rem]">{record.address || '—'}</span>
                                                    </TableCell>
                                                    {config.columns.map((col) => (
                                                        <TableCell key={col.key} label={col.label} className="text-foreground">
                                                            <span className="line-clamp-2 max-w-[16rem]">{formatField(record, col) || '—'}</span>
                                                        </TableCell>
                                                    ))}
                                                    <TableCell label="Submitted by" className="text-foreground">
                                                        {record.user?.name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell label="Submitted" className="whitespace-nowrap tabular-nums">
                                                        <div className="text-foreground">{formatDay(record.created_at) || '—'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatTime(record.created_at)}
                                                            {wasEdited(record) && ' · edited'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelected(record);
                                                            }}
                                                            className="h-11 gap-1 text-primary hover:bg-accent hover:text-primary md:h-8"
                                                            aria-label={`View record for ${record.name || 'unnamed person'}`}
                                                        >
                                                            View
                                                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {showSkeleton && <tr className="sr-only"><td>Loading records…</td></tr>}
                                        </TableBody>
                                    </Table>
                                    </div>

                                    <TablePagination
                                        {...laravelPagination(records)}
                                        onPerPageChange={(n) => visit({ per_page: n === 20 ? '' : n, page: '' })}
                                        itemLabel="records"
                                        className={PANEL_PAGINATION}
                                    />
                                </div>
                            ) : hasFilters ? (
                                <EmptyState
                                    title="No records match these filters"
                                    description="Try a different search or a wider date range."
                                    action={<Button variant="outline" onClick={handleReset}>Clear filters</Button>}
                                />
                            ) : (
                                <EmptyState
                                    icon={Icon}
                                    title={config.emptyTitle}
                                    description="Records appear here as soon as an office submits them in the situational report."
                                />
                            )}
                        </DataPanel>
                    </div>
                </div>

                {/* Record detail: bottom sheet on phones, side panel from md. */}
                <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                    <SheetContent
                        side={isMobile ? 'bottom' : 'right'}
                        className="flex w-full flex-col gap-0 overflow-hidden p-0 max-md:max-h-[88dvh] max-md:rounded-t-2xl md:max-w-md md:rounded-l-2xl"
                    >
                        {selected && (
                            <>
                                {/* Grab handle: a visual cue that the sheet can be dismissed. */}
                                <span className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 md:hidden" aria-hidden="true" />

                                <SheetHeader className="shrink-0 px-5 pb-4 pt-3 pr-14 text-left md:pt-6">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${accent.avatar}`}
                                            aria-hidden="true"
                                        >
                                            {initials(selected.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <SheetTitle className="break-words text-lg leading-snug">{selected.name || 'No name'}</SheetTitle>
                                            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${accent.tabCount}`}>
                                                    {category.label}
                                                </span>
                                                <span>{ageSex(selected)}</span>
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                <div ref={sheetBodyRef} className="min-h-0 flex-1 overflow-y-auto border-t border-border px-5 py-4">
                                    <dl className="space-y-4">
                                        <DetailRow label="Address">
                                            {selected.address ? (
                                                <span className="inline-flex gap-1.5">
                                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                                    {selected.address}
                                                </span>
                                            ) : (
                                                <Empty>Not given</Empty>
                                            )}
                                        </DetailRow>
                                        {config.details.map((field) => (
                                            <DetailRow key={field.key} label={field.label}>
                                                {formatField(selected, field) || <Empty>Not given</Empty>}
                                            </DetailRow>
                                        ))}
                                    </dl>

                                    <section className="mt-5 rounded-xl border border-border bg-muted/40 p-4" aria-labelledby="submission-heading">
                                        <h4 id="submission-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Submission
                                        </h4>
                                        <dl className="mt-3 space-y-3">
                                            <DetailRow label="Submitted by">{selected.user?.name || 'Unknown'}</DetailRow>
                                            <DetailRow label="Submitted">{formatDateTime(selected.created_at) || '—'}</DetailRow>
                                            {wasEdited(selected) && (
                                                <DetailRow label="Last edited">
                                                    {formatDateTime(selected.updated_at)}
                                                    <span className="block text-sm text-muted-foreground">by {selected.updater.name}</span>
                                                </DetailRow>
                                            )}
                                        </dl>
                                    </section>
                                </div>

                                {/* Step through the records on this page without closing the sheet. */}
                                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 gap-1 px-3"
                                        disabled={selectedIndex <= 0}
                                        onClick={() => step(-1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                        Previous
                                    </Button>
                                    <span
                                        className="text-sm tabular-nums text-muted-foreground"
                                        aria-live="polite"
                                        aria-label={`Record ${selectedIndex + 1} of ${records.data.length} on this page`}
                                    >
                                        {selectedIndex + 1} of {records.data.length}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 gap-1 px-3"
                                        disabled={selectedIndex < 0 || selectedIndex >= records.data.length - 1}
                                        onClick={() => step(1)}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
        </AppLayout>
    );
}
