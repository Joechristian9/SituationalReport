import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    Clock,
    HeartPulse,
    MapPin,
    Search,
    SearchX,
    UserSearch,
    Users,
    X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Shared layout for the admin Dead / Injured / Missing submission pages.
 * Each page passes its records (a Laravel paginator) and a small config
 * describing its columns and detail fields.
 */

// Full class strings so Tailwind keeps them in the build.
const ACCENTS = {
    red: {
        icon: 'text-red-600',
        title: 'text-red-700',
        avatar: 'bg-red-100 text-red-700',
        tabActive: 'bg-white text-red-700 shadow-sm ring-1 ring-red-200',
        tabCount: 'bg-red-100 text-red-700',
        bar: 'bg-red-500',
        stripe: 'border-t-red-500',
    },
    amber: {
        icon: 'text-amber-600',
        title: 'text-amber-700',
        avatar: 'bg-amber-100 text-amber-800',
        tabActive: 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-200',
        tabCount: 'bg-amber-100 text-amber-800',
        bar: 'bg-amber-500',
        stripe: 'border-t-amber-500',
    },
    orange: {
        icon: 'text-orange-600',
        title: 'text-orange-700',
        avatar: 'bg-orange-100 text-orange-800',
        tabActive: 'bg-white text-orange-700 shadow-sm ring-1 ring-orange-200',
        tabCount: 'bg-orange-100 text-orange-800',
        bar: 'bg-orange-500',
        stripe: 'border-t-orange-500',
    },
};

const CATEGORIES = [
    { key: 'casualties', label: 'Dead', routeName: 'admin.casualties.submissions', icon: AlertTriangle, accent: 'red' },
    { key: 'injured', label: 'Injured', routeName: 'admin.injured.submissions', icon: HeartPulse, accent: 'amber' },
    { key: 'missing', label: 'Missing', routeName: 'admin.missing.submissions', icon: UserSearch, accent: 'orange' },
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
    return <span className="text-gray-400">{children}</span>;
}

function StatTile({ label, children, hint }) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <div className="mt-2">{children}</div>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

function SexSplit({ stats, accent }) {
    const other = Math.max(stats.total - stats.male - stats.female, 0);
    const pct = (n) => (stats.total ? (n / stats.total) * 100 : 0);

    return (
        <>
            <div className="flex items-baseline gap-4 tabular-nums">
                <span className="text-2xl font-bold text-gray-900">
                    {stats.male}
                    <span className="ml-1 text-xs font-medium text-gray-500">male</span>
                </span>
                <span className="text-2xl font-bold text-gray-900">
                    {stats.female}
                    <span className="ml-1 text-xs font-medium text-gray-500">female</span>
                </span>
            </div>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                <div className={accent.bar} style={{ width: `${pct(stats.male)}%` }} />
                <div className="bg-gray-400" style={{ width: `${pct(stats.female)}%` }} />
            </div>
            {other > 0 && <p className="mt-1 text-xs text-gray-500">{other} not specified</p>}
        </>
    );
}

function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 py-0.5 pl-2.5 pr-1 text-xs text-gray-700">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                aria-label={`Remove filter: ${label}`}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

function Pagination({ records }) {
    if (records.last_page <= 1) return null;

    const pages = (records.links || []).slice(1, -1);

    const NavButton = ({ url, label, children }) =>
        url ? (
            <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                <Link href={url} preserveScroll preserveState aria-label={label}>
                    {children}
                </Link>
            </Button>
        ) : (
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled aria-label={label}>
                {children}
            </Button>
        );

    return (
        <nav className="flex items-center gap-1" aria-label="Pagination">
            <NavButton url={records.prev_page_url} label="Previous page">
                <ChevronLeft className="h-4 w-4" />
            </NavButton>
            {pages.map((link, i) =>
                link.url ? (
                    <Button
                        key={`${link.label}-${i}`}
                        asChild
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        className="h-8 min-w-8 px-2 tabular-nums"
                    >
                        <Link href={link.url} preserveScroll preserveState aria-current={link.active ? 'page' : undefined}>
                            {link.label}
                        </Link>
                    </Button>
                ) : (
                    <span key={`gap-${i}`} className="px-1.5 text-sm text-gray-400">
                        …
                    </span>
                ),
            )}
            <NavButton url={records.next_page_url} label="Next page">
                <ChevronRight className="h-4 w-4" />
            </NavButton>
        </nav>
    );
}

function DetailRow({ label, children }) {
    return (
        <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="min-w-0 break-words text-gray-900">{children}</dd>
        </div>
    );
}

export default function PersonSubmissions({ config, records, users = [], filters = {}, stats, disaster }) {
    const category = CATEGORIES.find((c) => c.key === config.category);
    const accent = ACCENTS[category.accent];
    const Icon = category.icon;
    const summary = { ...EMPTY_STATS, ...(stats || {}) };

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id ? String(filters.user_id) : 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selected, setSelected] = useState(null);
    const perPage = Number(filters.per_page) || 20;

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
        router.get(route(category.routeName), params, { preserveState: true, preserveScroll: true, replace: true });
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
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 px-4 backdrop-blur-sm sm:px-6">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="mx-2 h-6" />
                    <Icon className={`h-5 w-5 ${accent.icon}`} />
                    <h1 className={`text-lg font-semibold sm:text-xl ${accent.title}`}>{config.title}</h1>
                </header>

                <div className="flex-1 overflow-auto bg-gray-50/60 p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Title row */}
                        <div className="space-y-3">
                            <Link
                                href={route('admin.dashboard')}
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
                                    <p className="mt-1 text-sm text-gray-600">{config.description}</p>
                                    <p className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                                        <span
                                            className={`h-2 w-2 rounded-full ${disaster ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            aria-hidden="true"
                                        />
                                        {disaster ? (
                                            <>
                                                Active disaster: <span className="font-semibold text-gray-900">{disaster.name}</span>
                                            </>
                                        ) : (
                                            'No active disaster. Showing records from all disasters.'
                                        )}
                                    </p>
                                </div>

                                {/* Category switcher */}
                                <nav className="inline-flex self-start rounded-lg bg-gray-100 p-1 lg:self-auto" aria-label="Report type">
                                    {CATEGORIES.map((c) => {
                                        const active = c.key === category.key;
                                        const TabIcon = c.icon;
                                        return (
                                            <Link
                                                key={c.key}
                                                href={route(c.routeName)}
                                                aria-current={active ? 'page' : undefined}
                                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                                    active ? ACCENTS[c.accent].tabActive : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <TabIcon className="h-4 w-4" />
                                                {c.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className={`rounded-lg border border-t-4 bg-white p-4 ${accent.stripe}`}>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{config.statLabel}</p>
                                <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{summary.total}</p>
                                <p className="mt-1 text-xs text-gray-500">{hasFilters ? 'Matching your filters' : scopeLabel}</p>
                            </div>
                            <StatTile label="By sex">
                                <SexSplit stats={summary} accent={accent} />
                            </StatTile>
                            <StatTile label="Reporting offices" hint="Accounts that submitted at least one record">
                                <p className="flex items-center gap-2 text-2xl font-bold tabular-nums text-gray-900">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                    {summary.submitters}
                                </p>
                            </StatTile>
                            <StatTile label="Latest submission" hint={formatDateTime(summary.latest_at)}>
                                <p className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                    {summary.latest_at ? timeAgo(summary.latest_at) : 'None yet'}
                                </p>
                            </StatTile>
                        </div>

                        {/* Filters */}
                        <form
                            className="rounded-lg border bg-white p-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                visit();
                            }}
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <Label htmlFor="search" className="text-xs text-gray-600">Search</Label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="search"
                                            type="search"
                                            placeholder={config.searchPlaceholder}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-3">
                                    <Label htmlFor="user" className="text-xs text-gray-600">Submitted by</Label>
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger id="user" className="mt-1">
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
                                <div className="lg:col-span-2">
                                    <Label htmlFor="date_from" className="text-xs text-gray-600">Submitted from</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={dateFrom}
                                        max={dateTo || undefined}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <Label htmlFor="date_to" className="text-xs text-gray-600">Submitted to</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={dateTo}
                                        min={dateFrom || undefined}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                                    <Button type="submit" className="flex-1">
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            {chips.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                                    <span className="text-xs text-gray-500">Filtered by</span>
                                    {chips.map((chip) => (
                                        <FilterChip key={chip.label} label={chip.label} onRemove={chip.clear} />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="ml-1 text-xs font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </form>

                        {/* Records */}
                        <section className="overflow-hidden rounded-lg border bg-white">
                            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {config.listTitle}
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${accent.tabCount}`}>
                                        {records.total}
                                    </span>
                                </h3>
                                {records.data.length > 0 && (
                                    <p className="hidden text-xs text-gray-500 sm:block">Select a row to see the full record</p>
                                )}
                            </div>

                            {records.data.length > 0 ? (
                                <>
                                    {/* Table: md and up */}
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2.5 font-medium">Person</th>
                                                    <th className="px-4 py-2.5 font-medium">Address</th>
                                                    {config.columns.map((col) => (
                                                        <th key={col.key} className="px-4 py-2.5 font-medium">{col.label}</th>
                                                    ))}
                                                    <th className="px-4 py-2.5 font-medium">Submitted by</th>
                                                    <th className="px-4 py-2.5 text-right font-medium">Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {records.data.map((record) => (
                                                    <tr
                                                        key={record.id}
                                                        tabIndex={0}
                                                        onClick={() => setSelected(record)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                setSelected(record);
                                                            }
                                                        }}
                                                        className="cursor-pointer align-top hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-300"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.avatar}`}
                                                                    aria-hidden="true"
                                                                >
                                                                    {initials(record.name)}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-900">{record.name || <Empty>No name</Empty>}</p>
                                                                    <p className="text-xs text-gray-500">{ageSex(record)}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="max-w-[16rem] px-4 py-3 text-gray-600">
                                                            <p className="line-clamp-2" title={record.address || undefined}>
                                                                {record.address || <Empty>Not given</Empty>}
                                                            </p>
                                                        </td>
                                                        {config.columns.map((col) => (
                                                            <td key={col.key} className="max-w-[16rem] px-4 py-3 text-gray-700">
                                                                <p className="line-clamp-2" title={formatField(record, col) || undefined}>
                                                                    {formatField(record, col) || <Empty>—</Empty>}
                                                                </p>
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                                                {record.user?.name || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                            <p className="text-gray-900">{formatDay(record.created_at) || '—'}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatTime(record.created_at)}
                                                                {wasEdited(record) && <span className="ml-1.5 text-gray-400">· edited</span>}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Cards: below md */}
                                    <ul className="divide-y md:hidden">
                                        {records.data.map((record) => (
                                            <li key={record.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(record)}
                                                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.avatar}`}
                                                        aria-hidden="true"
                                                    >
                                                        {initials(record.name)}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-baseline justify-between gap-2">
                                                            <span className="truncate font-medium text-gray-900">{record.name || 'No name'}</span>
                                                            <span className="shrink-0 text-xs tabular-nums text-gray-500">{formatDay(record.created_at)}</span>
                                                        </span>
                                                        <span className="block text-xs text-gray-500">{ageSex(record)}</span>
                                                        <span className="mt-1 block text-sm text-gray-700 line-clamp-2">
                                                            {formatField(record, config.columns[0]) || 'No details given'}
                                                        </span>
                                                        <span className="mt-1 block text-xs text-gray-500">By {record.user?.name || 'Unknown'}</span>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm tabular-nums text-gray-600">
                                            Showing {records.from}–{records.to} of {records.total}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <RowsPerPage
                                                rowsPerPage={perPage}
                                                setRowsPerPage={(n) => visit({ per_page: n === 20 ? '' : n, page: '' })}
                                                totalRows={records.total}
                                            />
                                            <Pagination records={records} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center px-4 py-14 text-center">
                                    {hasFilters ? (
                                        <>
                                            <SearchX className="mb-3 h-10 w-10 text-gray-300" />
                                            <p className="font-medium text-gray-900">No records match these filters</p>
                                            <p className="mt-1 text-sm text-gray-500">Try a different search or a wider date range.</p>
                                            <Button variant="outline" size="sm" onClick={handleReset} className="mt-4">
                                                Clear filters
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Icon className="mb-3 h-10 w-10 text-gray-300" />
                                            <p className="font-medium text-gray-900">{config.emptyTitle}</p>
                                            <p className="mt-1 max-w-sm text-sm text-gray-500">
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
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
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

                                <h4 className="mt-6 text-xs font-medium uppercase tracking-wide text-gray-500">Submission</h4>
                                <dl className="mt-2 divide-y border-y">
                                    <DetailRow label="Submitted by">{selected.user?.name || 'Unknown'}</DetailRow>
                                    <DetailRow label="Submitted">{formatDateTime(selected.created_at) || '—'}</DetailRow>
                                    {wasEdited(selected) && (
                                        <DetailRow label="Last edited">
                                            {formatDateTime(selected.updated_at)}
                                            <span className="block text-xs text-gray-500">by {selected.updater.name}</span>
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
