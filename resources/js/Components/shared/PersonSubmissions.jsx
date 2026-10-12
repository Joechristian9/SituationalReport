import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
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
    ChevronRight,
    Clock,
    HeartPulse,
    MapPin,
    UserSearch,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import useLiveRefresh from '@/hooks/useLiveRefresh';
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
            <p className="flex items-baseline gap-3 text-2xl font-semibold tabular-nums text-foreground">
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

function DetailRow({ label, children }) {
    return (
        <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words text-foreground">{children}</dd>
        </div>
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
                            { href: route('admin.dashboard'), label: 'Dashboard' },
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
                        <div className="space-y-3">
                            <Link
                                href={route('admin.dashboard')}
                                className="inline-flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-3xl font-semibold text-foreground">{config.title}</h1>
                                    <p className="mt-1.5 text-base text-muted-foreground">{config.description}</p>
                                    <p className="mt-2.5 inline-flex items-center gap-2 text-sm text-muted-foreground">
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

                                {/* Category switcher */}
                                <nav className="inline-flex self-start rounded-lg bg-muted p-1 lg:self-auto" aria-label="Report type">
                                    {CATEGORIES.map((c) => {
                                        const active = c.key === category.key;
                                        const TabIcon = c.icon;
                                        return (
                                            <Link
                                                key={c.key}
                                                href={route(c.routeName)}
                                                aria-current={active ? 'page' : undefined}
                                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
                            <div className="bg-card p-4">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{config.statLabel}</dt>
                                <dd className="mt-1">
                                    <span className="text-3xl font-semibold tabular-nums text-foreground">{summary.total}</span>
                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                        {hasFilters ? 'Matching your filters' : scopeLabel}
                                    </span>
                                </dd>
                            </div>
                            <div className="bg-card p-4">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By sex</dt>
                                <dd className="mt-1">
                                    <SexSplit stats={summary} accent={accent} />
                                </dd>
                            </div>
                            <div className="bg-card p-4">
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reporting offices</dt>
                                <dd className="mt-1">
                                    <span className="flex items-center gap-2 text-2xl font-semibold tabular-nums text-foreground">
                                        <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                        {summary.submitters}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">With at least one record</span>
                                </dd>
                            </div>
                            <div className="bg-card p-4">
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
                                    <Table stacked>
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

                {/* Record detail */}
                <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                    <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                        {selected && (
                            <>
                                <SheetHeader className="text-left">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${accent.avatar}`}
                                            aria-hidden="true"
                                        >
                                            {initials(selected.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <SheetTitle className="break-words">{selected.name || 'No name'}</SheetTitle>
                                            <SheetDescription>
                                                {category.label} · {ageSex(selected)}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                <dl className="mt-6 divide-y border-y">
                                    <DetailRow label="Address">
                                        {selected.address ? (
                                            <span className="inline-flex gap-1.5">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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

                                <h4 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submission</h4>
                                <dl className="mt-2 divide-y border-y">
                                    <DetailRow label="Submitted by">{selected.user?.name || 'Unknown'}</DetailRow>
                                    <DetailRow label="Submitted">{formatDateTime(selected.created_at) || '—'}</DetailRow>
                                    {wasEdited(selected) && (
                                        <DetailRow label="Last edited">
                                            {formatDateTime(selected.updated_at)}
                                            <span className="block text-xs text-muted-foreground">by {selected.updater.name}</span>
                                        </DetailRow>
                                    )}
                                </dl>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
        </AppLayout>
    );
}
