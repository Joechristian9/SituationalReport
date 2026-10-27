import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import AppLayout from "@/Layouts/AppLayout";
import Breadcrumbs from "@/Components/Breadcrumbs";
import { Button } from "@/Components/ui/button";
import { CheckCircle2, Clock, AlertCircle, BellRing, ChevronDown, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { SkeletonTable } from "@/Components/ui/skeleton";
import TablePagination from '@/Components/ui/TablePagination';
import {
    DataPanel,
    DataToolbar,
    EmptyState,
    FilterSelect,
    PANEL_PAGINATION,
    useTableSort,
} from '@/Components/data/DataView';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    SortableHead,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import axios from 'axios';
import { router } from '@inertiajs/react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Toaster } from 'sonner';
import RemindDialog from '@/Components/reminders/RemindDialog';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import useMediaQuery from '@/hooks/useMediaQuery';
import LiveIndicator from '@/Components/LiveIndicator';
import { cn } from '@/lib/utils';
import { buildSuggestions } from '@/lib/searchSuggestions';

// Matches FormReminder::COOLDOWN_MINUTES: the server skips an account reminded this recently.
const REMIND_COOLDOWN_MS = 60 * 60 * 1000;
const recentlyReminded = (user) => user.reminded_at && Date.now() - new Date(user.reminded_at).getTime() < REMIND_COOLDOWN_MS;

/** 'all' | 'some' | 'none' from the server's assigned-form count; 'unassigned' when the account has no forms. */
const formState = (user) => {
    const { done = 0, total = 0 } = user.forms ?? {};
    if (total === 0) return 'unassigned';
    return done >= total ? 'all' : done > 0 ? 'some' : 'none';
};
const STATE_ORDER = { all: 0, some: 1, none: 2, unassigned: 3 };
// Green only when every assigned form is in; amber part-way; red for none.
const STATE_STYLE = {
    all: { badge: 'border-success/30 bg-success/10 text-success', dot: 'bg-success' },
    some: { badge: 'border-warning/30 bg-warning/10 text-warning', dot: 'bg-warning' },
    none: { badge: 'border-destructive/30 bg-destructive/10 text-destructive', dot: 'bg-destructive' },
    unassigned: { badge: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

const SUBMISSION_SORT = {
    name: (u) => u.name.toLowerCase(),
    email: (u) => u.email.toLowerCase(),
    status: (u) => STATE_ORDER[formState(u)] * 1000 - (u.forms?.done ?? 0),
    last: (u) => (u.last_submission ? new Date(u.last_submission).getTime() : null),
};

// Columns the server adds to every form table; they mean nothing to the person reading.
const HIDDEN_COLUMNS = ['id', 'typhoon_id', 'disaster_id', 'user_id', 'created_at', 'updated_at', 'updated_by'];

const titleCase = (text) => text.replace(/\b\w/g, (letter) => letter.toUpperCase());

/** "access-weather-form" -> "Weather" */
const permissionLabel = (permission) =>
    titleCase(permission.replace('access-', '').replace('-form', '').replace(/-/g, ' '));

function FormChips({ title, forms, submitted = false }) {
    if (forms.length === 0) return null;
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title} <span className="tabular-nums">({forms.length})</span>
            </h4>
            <ul className="mt-2 flex flex-wrap gap-1.5">
                {forms.map((form) => (
                    <li
                        key={form}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium',
                            submitted ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-foreground'
                        )}
                    >
                        {submitted && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                        {form}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Year only when it is not this year, so the cell fits beside the pinned Actions column on laptops.
const submittedAt = (value) => {
    const date = new Date(value);
    return format(date, date.getFullYear() === new Date().getFullYear() ? 'MMM d, h:mm a' : 'MMM d, yyyy, h:mm a');
};

const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const isEmptyValue = (value) => value === null || value === undefined || value === '';

const initials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * The records of one submitted form: compact cards on phones, a table from md up,
 * paged so a form with hundreds of rows stays quick.
 */
function FormRecords({ rows }) {
    const isWide = useMediaQuery('(min-width: 768px)');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    if (!rows || rows.length === 0) {
        return <EmptyState icon={AlertCircle} title="No data available" className="py-8" />;
    }

    const keys = Object.keys(rows[0]).filter((key) => !HIDDEN_COLUMNS.includes(key));
    const totalPages = Math.ceil(rows.length / perPage);
    const start = (Math.min(page, totalPages) - 1) * perPage;
    const shown = rows.slice(start, start + perPage);
    const labelOf = (key) => titleCase(key.replace(/_/g, ' '));

    return (
        <div className="space-y-3 p-3 sm:p-4">
            {/* Phones: one card per record, two fields across; long values take the full width. */}
            {!isWide ? (
            <ul className="space-y-2.5">
                {shown.map((row, index) => (
                    <li key={index} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 tabular-nums text-primary">#{start + index + 1}</span>
                        </p>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {keys.map((key) => {
                                const empty = isEmptyValue(row[key]);
                                const wide = !empty && String(row[key]).length > 28;
                                return (
                                    <div key={key} className={cn('min-w-0', wide && 'col-span-2')}>
                                        <dt className="text-xs font-medium text-muted-foreground">{labelOf(key)}</dt>
                                        <dd className="mt-0.5 break-words text-sm font-medium text-foreground">
                                            {empty ? <span className="text-muted-foreground" aria-label="Empty">-</span> : String(row[key])}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </li>
                ))}
            </ul>
            ) : (
            /* md and up: a rounded, bordered table that scrolls sideways inside itself. */
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 text-right">
                                <span aria-hidden="true">#</span>
                                <span className="sr-only">Row</span>
                            </TableHead>
                            {keys.map((key) => (
                                <TableHead key={key}>{labelOf(key)}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shown.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-right tabular-nums text-muted-foreground">{start + index + 1}</TableCell>
                                {keys.map((key) => (
                                    <TableCell key={key} className="align-top text-foreground">
                                        {isEmptyValue(row[key]) ? (
                                            <span className="text-muted-foreground" aria-label="Empty">-</span>
                                        ) : (
                                            <span className="line-clamp-2 max-w-[16rem] break-words" title={String(row[key])}>
                                                {String(row[key])}
                                            </span>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}

            <TablePagination
                currentPage={Math.min(page, totalPages)}
                totalPages={totalPages}
                totalItems={rows.length}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={(value) => {
                    setPerPage(value);
                    setPage(1);
                }}
                itemLabel="records"
                className="border-t border-border pt-3"
            />
        </div>
    );
}

export default function FormSubmissionStatus({ users, activeTyphoon }) {
    // Only the layout in use is rendered: cards on phones, the table from md up.
    const isWide = useMediaQuery('(min-width: 768px)');
    // Slower than the other pages: this page runs about 20 grouped queries per refresh.
    const live = useLiveRefresh({ only: ['users', 'activeTyphoon'], interval: 30000, enabled: Boolean(activeTyphoon) });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // The form open inside the details panel, with its records once loaded.
    const [openForm, setOpenForm] = useState(null);
    const [formRows, setFormRows] = useState(null);
    const [formError, setFormError] = useState(false);
    const latestForm = useRef(null); // ignores a slow response for a form that was closed or replaced
    const panelBody = useRef(null);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    // Accounts the open reminder dialog will notify (null when closed).
    const [remindTargets, setRemindTargets] = useState(null);
    // Reminders only make sense while forms are open: an active disaster, not a paused one.
    const canRemind = activeTyphoon?.status === 'active';
    const remindable = useMemo(
        () => (canRemind ? users.filter((user) => user.pending_forms?.length > 0 && !recentlyReminded(user)) : []),
        [canRemind, users],
    );

    const handleViewDetails = (user) => {
        // A form still loading for the previous account must not fill in this one's panel.
        latestForm.current = null;
        setSelectedUser(user);
        setIsModalOpen(true);
        setOpenForm(null);
        setFormRows(null);
    };

    const loadFormData = async (userId, table, formName) => {
        latestForm.current = formName;
        setOpenForm(formName);
        setFormRows(null);
        setFormError(false);
        try {
            const response = await axios.get(route('admin.user-form-data', userId), {
                params: { table, form_name: formName },
            });
            if (latestForm.current === formName) setFormRows(response.data.data ?? []);
        } catch (error) {
            if (latestForm.current === formName) setFormError(true);
        }
    };

    // Clicking the open form again closes it.
    const handleViewFormData = (userId, table, formName) => {
        if (openForm === formName) {
            latestForm.current = null;
            setOpenForm(null);
            return;
        }
        loadFormData(userId, table, formName);
    };

    const closeModal = () => {
        latestForm.current = null;
        setIsModalOpen(false);
        setSelectedUser(null);
        setOpenForm(null);
        setFormRows(null);
    };

    // `interactive`: the badge opens the list of forms still to submit and those already in (green).
    const getStatusBadge = (user, { interactive = false } = {}) => {
        const state = formState(user);
        const { done, total } = user.forms ?? { done: 0, total: 0 };
        const text = {
            all: `All submitted · ${done}/${total}`,
            some: `${done} of ${total} submitted`,
            none: `Not submitted · 0/${total}`,
            unassigned: 'No forms',
        }[state];
        const badgeClass = cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums', STATE_STYLE[state].badge);
        const dot = <span className={cn('h-1.5 w-1.5 rounded-full', STATE_STYLE[state].dot)} aria-hidden="true" />;

        if (!interactive || state === 'unassigned') {
            return (
                <span className={badgeClass}>
                    {dot}
                    {text}
                </span>
            );
        }

        const { toSubmit = [], submitted = [] } = user.forms ?? {};
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label={`${text}. Show ${user.name}'s forms`}
                        // Keeps the badge's look; a 44px-tall hit area on phones without growing the pill.
                        className={cn(badgeClass, 'relative cursor-pointer transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring before:absolute before:-inset-y-3 before:inset-x-0 md:before:hidden')}
                    >
                        {dot}
                        {text}
                        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden="true" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(380px,calc(100vw-2rem))] space-y-4" align="start" collisionPadding={16}>
                    <FormChips title="To submit" forms={toSubmit} />
                    <FormChips title="Submitted" forms={submitted} submitted />
                </PopoverContent>
            </Popover>
        );
    };

    const formatPermissions = (permissions) => permissions.map(permissionLabel).join(', ');



    // Sort users: most recent submissions first, then by submission status
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            // All forms in first, then part-way, then none.
            const byState = STATE_ORDER[formState(a)] - STATE_ORDER[formState(b)];
            if (byState !== 0) return byState;

            // Same state: most recent submission first
            if (a.last_submission && b.last_submission) {
                return new Date(b.last_submission) - new Date(a.last_submission);
            }
            if (a.last_submission && !b.last_submission) return -1;
            if (!a.last_submission && b.last_submission) return 1;
            
            // If no submissions, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });
    }, [users]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return sortedUsers.filter((user) =>
            (statusFilter === 'all' ||
                (statusFilter === 'submitted' ? formState(user) === 'all' : ['some', 'none'].includes(formState(user)))) &&
            (!query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                formatPermissions(user.permissions).toLowerCase().includes(query))
        );
    }, [sortedUsers, searchQuery, statusFilter]);

    const suggestSearch = useCallback(
        (text) => buildSuggestions(sortedUsers, [{ get: (u) => u.name, label: 'account' }, 'email'], text),
        [sortedUsers]
    );

    // Column sorts; until one is picked the list keeps its "recent submitters first" order.
    const { sorted: tableUsers, sort, toggle: toggleSort } = useTableSort(filteredUsers, SUBMISSION_SORT);

    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(tableUsers.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = tableUsers.slice(startIndex, endIndex);

        return { totalPages, startIndex, endIndex, paginatedUsers };
    }, [tableUsers, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, itemsPerPage, sort]);

    // Previous / Next step through the accounts on this page that have something to view.
    const viewableUsers = paginationData.paginatedUsers.filter((user) => user.has_submitted);
    const selectedIndex = viewableUsers.findIndex((user) => user.id === selectedUser?.id);
    const step = (direction) => {
        const next = viewableUsers[selectedIndex + direction];
        if (!next) return;
        handleViewDetails(next);
        panelBody.current?.scrollTo({ top: 0 });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    const chips =
        statusFilter === 'all'
            ? []
            : [
                  {
                      key: 'status',
                      label: `Status: ${statusFilter === 'submitted' ? 'All assigned forms submitted' : 'Missing assigned forms'}`,
                      onRemove: () => setStatusFilter('all'),
                  },
              ];

    return (
        <AppLayout
            title="Form Submission Status"
            header={
                <Breadcrumbs
                    crumbs={[
                        { label: "Admin" },
                        { label: "Form Submission Status" },
                    ]}
                />
            }
            actions={<LiveIndicator live={live} />}
        >
                <Toaster position="top-right" richColors />
                <RemindDialog
                    users={remindTargets}
                    onClose={() => setRemindTargets(null)}
                    onSent={() => router.reload({ only: ['users'] })}
                />

                <main className="w-full p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <DataPanel
                            icon={FileText}
                            actions={
                                canRemind && remindable.length > 0 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRemindTargets(remindable)}
                                        className="hidden h-11 gap-2 bg-card shadow-sm sm:inline-flex md:h-9"
                                    >
                                        <BellRing className="h-4 w-4" aria-hidden="true" />
                                        Notify pending ({remindable.length})
                                    </Button>
                                ) : null
                            }
                            title="Form submissions"
                            count={users.length > 0 ? filteredUsers.length : undefined}
                            description={
                                activeTyphoon ? (
                                    <>
                                        Monitoring form submissions for{' '}
                                        <span className="font-semibold text-foreground">{activeTyphoon.name}</span>
                                    </>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                        No active disaster - showing all users
                                    </span>
                                )
                            }
                        >
                            {users.length > 0 ? (
                                <>
                                    {canRemind && remindable.length > 0 && (
                                        <div className="flex items-center justify-between gap-3 border-t border-border bg-warning/10 px-4 py-3 sm:hidden">
                                            <p className="min-w-0 text-sm text-foreground">
                                                <span className="font-semibold tabular-nums">{remindable.length}</span>{' '}
                                                {remindable.length === 1 ? 'account has' : 'accounts have'} forms to submit
                                            </p>
                                            <Button type="button" onClick={() => setRemindTargets(remindable)} className="h-11 shrink-0 gap-2">
                                                <BellRing className="h-4 w-4" aria-hidden="true" />
                                                Notify all
                                            </Button>
                                        </div>
                                    )}
                                    <DataToolbar
                                        search={{
                                            id: 'submission-search',
                                            value: searchQuery,
                                            onChange: setSearchQuery,
                                            placeholder: 'Search name, email or assigned form',
                                            suggest: suggestSearch,
                                        }}
                                        filters={
                                            <FilterSelect
                                                id="submission-status"
                                                label="Status"
                                                value={statusFilter}
                                                onChange={setStatusFilter}
                                                options={[
                                                    { value: 'submitted', label: 'All assigned forms submitted' },
                                                    { value: 'pending', label: 'Missing assigned forms' },
                                                ]}
                                            />
                                        }
                                        chips={chips}
                                        onClearAll={clearFilters}
                                    />

                                    {paginationData.paginatedUsers.length > 0 ? (
                                        <>
                                            {/* Phones: one compact row per user in a flat list, instead of a tall stack of labelled cells. */}
                                            {!isWide ? (
                                            <ul className="divide-y divide-border">
                                                {paginationData.paginatedUsers.map((user) => {
                                                    const { done = 0, total = 0 } = user.forms ?? {};
                                                    const percent = total ? Math.round((done / total) * 100) : 0;
                                                    return (
                                                        <li key={user.id} className="px-4 py-3.5">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-base font-semibold text-foreground">{user.name}</p>
                                                                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                                                            </div>

                                                            {/* The badge already says "3 of 5"; the bar beside it shows the same at a glance. */}
                                                            <div className="mt-3 flex items-center gap-3">
                                                                {getStatusBadge(user, { interactive: true })}
                                                                {total > 0 && (
                                                                    <div
                                                                        role="progressbar"
                                                                        aria-label={`Forms submitted by ${user.name}`}
                                                                        aria-valuemin={0}
                                                                        aria-valuemax={total}
                                                                        aria-valuenow={done}
                                                                        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                                                                    >
                                                                        <div className={cn('h-full rounded-full', STATE_STYLE[formState(user)].dot)} style={{ width: `${percent}%` }} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                                {user.last_submission ? (
                                                                    <span className="tabular-nums">
                                                                        Last submission{' '}
                                                                        <span className="font-medium text-foreground">
                                                                            {submittedAt(user.last_submission)}
                                                                        </span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="italic">No submissions yet</span>
                                                                )}
                                                            </p>

                                                            {activeTyphoon && user.pending_forms?.length > 0 && (
                                                                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                                                                    <div className="min-w-0 text-xs">
                                                                        <p className="font-semibold text-warning">
                                                                            {user.pending_forms.length} {user.pending_forms.length === 1 ? 'form' : 'forms'} to submit
                                                                        </p>
                                                                        {user.reminded_at && (
                                                                            <p className="text-muted-foreground">
                                                                                Reminded {formatDistanceToNowStrict(new Date(user.reminded_at), { addSuffix: true })}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {canRemind && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            onClick={() => setRemindTargets([user])}
                                                                            disabled={recentlyReminded(user)}
                                                                            className="h-11 shrink-0 gap-1.5 bg-card"
                                                                            aria-label={`Remind ${user.name} to submit ${user.pending_forms.length} ${user.pending_forms.length === 1 ? 'form' : 'forms'}`}
                                                                        >
                                                                            <BellRing className="h-4 w-4" aria-hidden="true" />
                                                                            Notify
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {user.has_submitted && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleViewDetails(user)}
                                                                    className="mt-3 h-11 w-full gap-1 rounded-lg font-medium text-primary hover:bg-accent hover:text-primary"
                                                                    aria-label={`View submissions from ${user.name}`}
                                                                >
                                                                    View
                                                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                                                </Button>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12 text-right">
                                                            <span aria-hidden="true">#</span>
                                                            <span className="sr-only">Row</span>
                                                        </TableHead>
                                                        <SortableHead sortKey="name" sort={sort} onSort={toggleSort}>Name</SortableHead>
                                                        <SortableHead sortKey="email" sort={sort} onSort={toggleSort} className="hidden xl:table-cell">Email</SortableHead>
                                                        <SortableHead sortKey="status" sort={sort} onSort={toggleSort}>Status</SortableHead>
                                                        <SortableHead sortKey="last" sort={sort} onSort={toggleSort}>Last submission</SortableHead>
                                                        <TableHead className="sticky right-0 z-[1] border-l border-border/60 bg-[color-mix(in_srgb,hsl(var(--accent))_50%,hsl(var(--card)))] text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginationData.paginatedUsers.map((user, index) => (
                                                        <TableRow key={user.id} className="group">
                                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                                {paginationData.startIndex + index + 1}
                                                            </TableCell>
                                                            <TableCell className="max-w-[16rem]">
                                                                <span className="block font-medium text-foreground">{user.name}</span>
                                                                {/* Below 1280px the Email column is hidden, so the address rides under the name. */}
                                                                <span className="block truncate text-xs text-muted-foreground xl:hidden" title={user.email}>{user.email}</span>
                                                            </TableCell>
                                                            <TableCell label="Email" className="hidden max-w-[14rem] truncate text-muted-foreground xl:table-cell" title={user.email}>
                                                                {user.email}
                                                            </TableCell>
                                                            <TableCell label="Status" className="min-w-[11rem]">
                                                                {getStatusBadge(user, { interactive: true })}
                                                                {activeTyphoon && user.pending_forms?.length > 0 && user.reminded_at && (
                                                                    <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                                                                        Reminded {formatDistanceToNowStrict(new Date(user.reminded_at), { addSuffix: true })}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell label="Last submission" className="whitespace-nowrap tabular-nums">
                                                                {user.last_submission ? (
                                                                    <span className="text-muted-foreground">
                                                                        {submittedAt(user.last_submission)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="italic text-muted-foreground">No submissions yet</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="sticky right-0 z-[1] border-l border-border/60 bg-card text-right group-hover:bg-[color-mix(in_srgb,hsl(var(--accent))_30%,hsl(var(--card)))]">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    {canRemind && user.pending_forms?.length > 0 && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setRemindTargets([user])}
                                                                            disabled={recentlyReminded(user)}
                                                                            // Icon only: the hover title names the action; screen readers get the aria-label.
                                                                            title={recentlyReminded(user) ? 'Reminded within the last hour' : 'Notify'}
                                                                            className="h-11 w-11 bg-card p-0 shadow-sm md:h-8 md:w-8"
                                                                            aria-label={`Remind ${user.name} to submit ${user.pending_forms.length} ${user.pending_forms.length === 1 ? 'form' : 'forms'}`}
                                                                        >
                                                                            <BellRing className="h-4 w-4" aria-hidden="true" />
                                                                        </Button>
                                                                    )}
                                                                    {user.has_submitted ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleViewDetails(user)}
                                                                            className="h-11 gap-1 font-medium text-primary hover:bg-accent hover:text-primary md:h-8"
                                                                            aria-label={`View submissions from ${user.name}`}
                                                                        >
                                                                            View
                                                                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                                                        </Button>
                                                                    ) : (
                                                                        !(canRemind && user.pending_forms?.length > 0) && (
                                                                            <span className="text-muted-foreground" aria-label="Nothing to view">-</span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            )}

                                            <TablePagination
                                                currentPage={currentPage}
                                                totalPages={paginationData.totalPages}
                                                totalItems={filteredUsers.length}
                                                perPage={itemsPerPage}
                                                onPageChange={setCurrentPage}
                                                onPerPageChange={(value) => {
                                                    setItemsPerPage(value);
                                                    setCurrentPage(1);
                                                }}
                                                itemLabel="users"
                                                className={PANEL_PAGINATION}
                                            />
                                        </>
                                    ) : (
                                        <EmptyState
                                            title="No users match"
                                            description="Try another search or clear the filters."
                                            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
                                        />
                                    )}
                                </>
                            ) : (
                                <EmptyState
                                    icon={AlertCircle}
                                    title="No users found"
                                    description="There are no users with form access permissions."
                                />
                            )}
                        </DataPanel>
                    </div>
                </main>

            {/* User details: which forms were submitted, and the records inside each. */}
            <Sheet open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden border-l border-border bg-background p-0 sm:max-w-3xl sm:rounded-l-2xl">
                    {(() => {
                        const submitted = selectedUser?.submitted_forms ?? [];
                        const pending = selectedUser?.forms?.toSubmit ?? [];
                        const { done = 0, total = 0 } = selectedUser?.forms ?? {};
                        const percent = total ? Math.round((done / total) * 100) : 0;

                        return (
                            <>
                                <SheetHeader className="shrink-0 space-y-3 border-b border-border bg-card px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
                                    {/* Right padding keeps the name clear of the close button. */}
                                    <div className="flex items-center gap-3 pr-9 sm:pr-6">
                                        <span
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                                            aria-hidden="true"
                                        >
                                            {initials(selectedUser?.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <SheetTitle className="break-words text-lg font-semibold leading-snug text-foreground">
                                                {selectedUser?.name}
                                            </SheetTitle>
                                            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                                {getStatusBadge(selectedUser ?? {})}
                                                <span className="min-w-0 break-all">{selectedUser?.email}</span>
                                                {activeTyphoon && (
                                                    <>
                                                        <span aria-hidden="true">·</span>
                                                        <span>{activeTyphoon.name}</span>
                                                    </>
                                                )}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-baseline justify-between gap-2 text-sm">
                                            <span className="font-medium text-foreground">Forms submitted</span>
                                            <span className="tabular-nums text-muted-foreground">
                                                <span className="font-semibold text-foreground">{done}</span> of {total}
                                            </span>
                                        </div>
                                        <div
                                            role="progressbar"
                                            aria-label="Forms submitted"
                                            aria-valuemin={0}
                                            aria-valuemax={total}
                                            aria-valuenow={done}
                                            className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
                                        >
                                            <div className={cn('h-full rounded-full', STATE_STYLE[formState(selectedUser ?? {})].dot)} style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                </SheetHeader>

                                <div ref={panelBody} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                                    {submitted.length > 0 ? (
                                        <ul className="space-y-3">
                                            {submitted.map((form) => {
                                                const open = openForm === form.name;
                                                const panelId = `form-panel-${form.table}`;
                                                return (
                                                    <li
                                                        key={form.table}
                                                        className={cn(
                                                            'overflow-hidden rounded-2xl border bg-card shadow-sm',
                                                            open ? 'border-primary/40' : 'border-border'
                                                        )}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewFormData(selectedUser.id, form.table, form.name)}
                                                            aria-expanded={open}
                                                            aria-controls={panelId}
                                                            className="flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                                                        >
                                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                                <FileText className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-semibold text-foreground sm:text-base">
                                                                    {form.name}
                                                                </span>
                                                                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                                                    <span className="font-medium tabular-nums text-foreground">
                                                                        {form.count} {form.count === 1 ? 'entry' : 'entries'}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                                                        Updated {formatDate(form.last_updated)}
                                                                    </span>
                                                                </span>
                                                            </span>
                                                            <ChevronRight
                                                                className={cn(
                                                                    'h-5 w-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
                                                                    open && 'rotate-90 text-primary'
                                                                )}
                                                                aria-hidden="true"
                                                            />
                                                        </button>

                                                        {open && (
                                                            <div id={panelId} className="border-t border-border bg-muted/20">
                                                                {formError ? (
                                                                    <div
                                                                        className="m-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
                                                                        role="alert"
                                                                    >
                                                                        Couldn't load these records.
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-11 md:h-8"
                                                                            onClick={() => loadFormData(selectedUser.id, form.table, form.name)}
                                                                        >
                                                                            Retry
                                                                        </Button>
                                                                    </div>
                                                                ) : formRows === null ? (
                                                                    <SkeletonTable columns={4} label="Loading form data…" className="p-4" />
                                                                ) : (
                                                                    <>
                                                                        <p className="px-4 pt-3 text-xs font-medium tabular-nums text-muted-foreground sm:px-5">
                                                                            {formRows.length} {formRows.length === 1 ? 'record' : 'records'}
                                                                        </p>
                                                                        <FormRecords key={form.table} rows={formRows} />
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <EmptyState
                                            icon={FileText}
                                            title="No forms submitted"
                                            description="This account hasn't submitted any data for the current disaster yet."
                                        />
                                    )}

                                    {pending.length > 0 && (
                                        <section aria-labelledby="pending-forms-heading">
                                            <h3 id="pending-forms-heading" className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                                Not yet submitted
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                                                    {pending.length}
                                                </span>
                                            </h3>
                                            <ul className="flex flex-wrap gap-2">
                                                {pending.map((form) => (
                                                    <li
                                                        key={form}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                                                    >
                                                        <Clock className="h-3 w-3" aria-hidden="true" />
                                                        {form}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>

                                {/* Step through the accounts on this page without closing the panel. */}
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
                                        aria-label={`Account ${selectedIndex + 1} of ${viewableUsers.length} on this page`}
                                    >
                                        {selectedIndex + 1} of {viewableUsers.length}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 gap-1 px-3"
                                        disabled={selectedIndex < 0 || selectedIndex >= viewableUsers.length - 1}
                                        onClick={() => step(1)}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
