import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
import TablePagination, { laravelPagination } from '@/Components/ui/TablePagination';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronRight,
    Clock,
    HeartPulse,
    MapPin,
    Search,
    SearchX,
    SlidersHorizontal,
    UserSearch,
    Users,
    X,
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

// Text sizes for the records list.
const TEXT = { name: 'text-base', meta: 'text-sm', chip: 'text-sm' };

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

function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pl-2.5 pr-1 text-xs text-foreground">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="flex h-8 w-8 items-center justify-center rounded-full md:h-6 md:w-6 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove filter: ${label}`}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const perPage = Number(filters.per_page) || 20;

    const advancedCount = [filters.user_id, filters.date_from, filters.date_to].filter(Boolean).length;
    const hasFilters = Boolean(filters.search || filters.user_id || filters.date_from || filters.date_to);

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

    const userName = useMemo(() => {
        const match = users.find((u) => String(u.id) === String(filters.user_id));
        return match ? match.name : null;
    }, [users, filters.user_id]);

    const chips = [
        filters.search && {
            label: `“${filters.search}”`,
            clear: () => { setSearchQuery(''); visit({ search: '' }); },
        },
        filters.user_id && {
            label: `By ${userName || 'selected user'}`,
            clear: () => { setSelectedUser('all'); visit({ user_id: '' }); },
        },
        filters.date_from && {
            label: `From ${formatDay(filters.date_from)}`,
            clear: () => { setDateFrom(''); visit({ date_from: '' }); },
        },
        filters.date_to && {
            label: `To ${formatDay(filters.date_to)}`,
            clear: () => { setDateTo(''); visit({ date_to: '' }); },
        },
    ].filter(Boolean);

    const scopeLabel = disaster ? disaster.name : 'All disasters';

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title={config.title} />
            <SidebarInset>
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="mx-2 h-6" />
                    <Icon className={`h-5 w-5 ${accent.icon}`} aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">Admin</span>
                    <span className="text-muted-foreground" aria-hidden="true">/</span>
                    <span className="truncate text-sm font-semibold text-foreground">{config.title}</span>
                    <LiveIndicator live={live} className="ml-auto" />
                </header>

                <div className="flex-1 overflow-auto bg-muted/40 p-4 sm:p-6">
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

                        {/* Search + filters */}
                        <div className="space-y-3">
                            <form
                                className="flex flex-col gap-2 sm:flex-row"
                                role="search"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    visit();
                                }}
                            >
                                <div className="relative flex-1">
                                    <Label htmlFor="search" className="sr-only">Search</Label>
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                    <Input
                                        id="search"
                                        type="search"
                                        placeholder={config.searchPlaceholder}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-11 bg-card pl-9 md:h-9"
                                    />
                                </div>

                                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" className="h-11 gap-2 bg-card md:h-9">
                                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                                            Filters
                                            {advancedCount > 0 && (
                                                <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                                                    {advancedCount}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] space-y-4">
                                        <div>
                                            <Label htmlFor="user" className="text-xs text-muted-foreground">Submitted by</Label>
                                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                                <SelectTrigger id="user" className="mt-1 h-11 md:h-9">
                                                    <SelectValue placeholder="Anyone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Anyone</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="date_from" className="text-xs text-muted-foreground">Submitted from</Label>
                                                <Input
                                                    id="date_from"
                                                    type="date"
                                                    value={dateFrom}
                                                    max={dateTo || undefined}
                                                    onChange={(e) => setDateFrom(e.target.value)}
                                                    className="mt-1 h-11 md:h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="date_to" className="text-xs text-muted-foreground">Submitted to</Label>
                                                <Input
                                                    id="date_to"
                                                    type="date"
                                                    value={dateTo}
                                                    min={dateFrom || undefined}
                                                    onChange={(e) => setDateTo(e.target.value)}
                                                    className="mt-1 h-11 md:h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 border-t pt-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-11 md:h-9"
                                                onClick={() => {
                                                    handleReset();
                                                    setFiltersOpen(false);
                                                }}
                                            >
                                                Reset
                                            </Button>
                                            <Button
                                                type="button"
                                                className="h-11 md:h-9"
                                                onClick={() => {
                                                    visit();
                                                    setFiltersOpen(false);
                                                }}
                                            >
                                                Apply filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button type="submit" className="h-11 md:h-9" disabled={loading}>
                                    {loading ? 'Searching…' : 'Search'}
                                </Button>
                            </form>

                            {chips.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Filtered by</span>
                                    {chips.map((chip) => (
                                        <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="ml-1 rounded text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Records */}
                        <section className="overflow-hidden rounded-lg border bg-card" aria-busy={loading}>
                            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                <h2 className="text-sm font-semibold text-foreground">
                                    {config.listTitle}
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${accent.tabCount}`}>
                                        {records.total}
                                    </span>
                                </h2>
                                {records.data.length > 0 && (
                                    <p className="hidden text-xs text-muted-foreground sm:block">Select a record to see the full details</p>
                                )}
                            </div>

                            {records.data.length > 0 ? (
                                <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                                    <ul className="divide-y">
                                        {records.data.map((record) => (
                                            <li key={record.id} className="even:bg-muted/50">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(record)}
                                                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                                >
                                                    <span
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.avatar}`}
                                                        aria-hidden="true"
                                                    >
                                                        {initials(record.name)}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-baseline gap-x-2">
                                                            <span className={`font-medium text-foreground ${TEXT.name}`}>{record.name || 'No name'}</span>
                                                            <span className={`text-muted-foreground ${TEXT.meta}`}>{ageSex(record)}</span>
                                                        </span>
                                                        {record.address && (
                                                            <span className={`mt-0.5 flex items-start gap-1 text-muted-foreground ${TEXT.meta}`}>
                                                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                                <span className="line-clamp-1">{record.address}</span>
                                                            </span>
                                                        )}
                                                        <span className="mt-2 flex flex-wrap gap-1.5">
                                                            {config.columns.map((col) => {
                                                                const value = formatField(record, col);
                                                                if (!value) return null;
                                                                return (
                                                                    <span
                                                                        key={col.key}
                                                                        title={`${col.label}: ${value}`}
                                                                        className={`inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 ${TEXT.chip}`}
                                                                    >
                                                                        <span className="shrink-0 text-muted-foreground">{col.label}:</span>
                                                                        <span className="max-w-[16rem] truncate font-medium text-foreground">{value}</span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </span>
                                                        <span className={`mt-2 flex items-center gap-1.5 text-muted-foreground sm:hidden ${TEXT.meta}`}>
                                                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                                            {record.user?.name || 'Unknown'} · {formatDay(record.created_at) || '—'}
                                                        </span>
                                                    </span>

                                                    <span className={`hidden shrink-0 text-right tabular-nums sm:block ${TEXT.meta}`}>
                                                        <span className="flex items-center justify-end gap-1.5 font-medium text-foreground">
                                                            <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                                            {record.user?.name || 'Unknown'}
                                                        </span>
                                                        <span className="mt-0.5 block text-muted-foreground">{formatDay(record.created_at) || '—'}</span>
                                                        <span className="block text-muted-foreground">
                                                            {formatTime(record.created_at)}
                                                            {wasEdited(record) && ' · edited'}
                                                        </span>
                                                    </span>
                                                    <ChevronRight className="mt-2.5 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <TablePagination
                                        {...laravelPagination(records)}
                                        onPerPageChange={(n) => visit({ per_page: n === 20 ? '' : n, page: '' })}
                                        itemLabel="records"
                                        className="border-t bg-muted/30 px-4 py-3"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center px-4 py-14 text-center">
                                    {hasFilters ? (
                                        <>
                                            <SearchX className="mb-3 h-10 w-10 text-muted-foreground/60" />
                                            <p className="font-medium text-foreground">No records match these filters</p>
                                            <p className="mt-1 text-sm text-muted-foreground">Try a different search or a wider date range.</p>
                                            <Button variant="outline" size="sm" onClick={handleReset} className="mt-4">
                                                Clear filters
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Icon className="mb-3 h-10 w-10 text-muted-foreground/60" />
                                            <p className="font-medium text-foreground">{config.emptyTitle}</p>
                                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                                Records appear here as soon as an office submits them in the situational report.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
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
            </SidebarInset>
        </SidebarProvider>
    );
}
