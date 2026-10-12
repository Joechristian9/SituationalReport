import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageTitle from '@/Components/PageTitle';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import TablePagination from '@/Components/ui/TablePagination';
import { SortableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import {
    DataPanel,
    DataToolbar,
    EmptyState,
    FilterSelect,
    PANEL_PAGINATION,
    useTableSort,
} from '@/Components/data/DataView';
import {
    AlertTriangle,
    Building2,
    Edit,
    Eye,
    EyeOff,
    Home,
    MoreVertical,
    Shield,
    ShieldCheck,
    Trash2,
    User as UserIcon,
    UserPlus,
    Users,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Form permissions grouped the way the situational report is organised.
const PERMISSION_GROUPS = [
    {
        title: 'Situation overview',
        items: {
            'access-weather-form': 'Weather',
            'access-water-level-form': 'Water level',
            'access-electricity-form': 'Electricity',
            'access-water-service-form': 'Water services',
            'access-communication-form': 'Communications',
            'access-road-form': 'Roads',
            'access-bridge-form': 'Bridges',
        },
    },
    {
        title: 'Evacuation and response',
        items: {
            'access-pre-emptive-form': 'Pre-emptive evacuation',
            'access-pre-positioning-form': 'Pre-positioning',
            'access-declaration-form': 'Declarations',
            'access-response-operations': 'Response operations',
            'access-assistance-extended': 'Assistance extended',
        },
    },
    {
        title: 'Effects and casualties',
        items: {
            'access-incident-form': 'Incidents monitored',
            'access-agriculture-form': 'Agriculture',
            'access-damaged-houses-form': 'Damaged houses',
            'access-tourist-form': 'Affected tourists',
            'access-casualty-form': 'Casualties (dead)',
            'access-injured-form': 'Casualties (injured)',
            'access-missing-form': 'Casualties (missing)',
        },
    },
];

const KNOWN_LABELS = Object.assign({}, ...PERMISSION_GROUPS.map((g) => g.items));

const permissionLabel = (name) =>
    KNOWN_LABELS[name] ||
    name
        .replace(/^access-/, '')
        .replace(/-form$/, '')
        .replace(/-/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase());

const isBarangay = (user) => user.email?.toLowerCase().endsWith('@barangay.local');
const isAdmin = (user) => user.roles.includes('admin');

const initials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const TABS = [
    { key: 'all', label: 'All', test: () => true },
    { key: 'offices', label: 'Offices', test: (u) => !isBarangay(u) && !isAdmin(u) },
    { key: 'barangays', label: 'Barangays', test: (u) => isBarangay(u) && !isAdmin(u) },
    { key: 'admins', label: 'Admins', test: (u) => isAdmin(u) },
];

// Column sorts. Ids grow with creation, so "created" sorts by id (created_at arrives formatted).
const USER_SORT = {
    name: (u) => u.name.toLowerCase(),
    type: (u) => (isAdmin(u) ? 'Admin' : isBarangay(u) ? 'Barangay' : 'Office'),
    created: (u) => u.id,
};

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
    permissions: [],
};

function Avatar({ user }) {
    const tone = isAdmin(user)
        ? 'bg-violet-100 text-violet-700'
        : isBarangay(user)
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-blue-100 text-blue-700';
    return (
        <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
            aria-hidden="true"
        >
            {initials(user.name)}
        </span>
    );
}

function RoleBadge({ user }) {
    if (isAdmin(user)) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-sm font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                <ShieldCheck className="h-3 w-3" />
                Admin
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
            {isBarangay(user) ? <Home className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
            {isBarangay(user) ? 'Barangay' : 'Office'}
        </span>
    );
}

function AccessSummary({ user, max = 3 }) {
    if (isAdmin(user)) {
        return <span className="text-sm font-medium text-violet-700">All forms</span>;
    }
    if (user.permissions.length === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                No forms assigned
            </span>
        );
    }
    return <AccessChips permissions={user.permissions} max={max} />;
}

// Shows the first few forms; "+N more" expands the rest (works with keyboard, not only hover).
function AccessChips({ permissions, max }) {
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? permissions : permissions.slice(0, max);
    const rest = permissions.length - max;
    return (
        <div className="flex flex-wrap gap-1">
            {shown.map((p) => (
                <span key={p} className="rounded bg-blue-50 px-1.5 py-0.5 text-sm text-blue-800">
                    {permissionLabel(p)}
                </span>
            ))}
            {rest > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    {expanded ? 'Show less' : `+${rest} more`}
                </button>
            )}
        </div>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} role="alert" className="mt-1 text-sm text-red-600">
            {message}
        </p>
    );
}

function RequiredMark() {
    return (
        <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
        </span>
    );
}

// Field order in the form, used to focus the first field with an error.
const FIELD_IDS = {
    name: 'form-name',
    email: 'form-email',
    password: 'form-password',
    password_confirmation: 'form-password-confirm',
};

function PasswordInput({ id, value, onChange, placeholder, required, autoComplete, error }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative mt-1">
            <Input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoComplete={autoComplete}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`pr-11 ${error ? 'border-red-500' : ''}`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

function PermissionPicker({ permissions, selected, onChange }) {
    const available = permissions.map((p) => p.name);
    const groups = PERMISSION_GROUPS.map((g) => ({
        title: g.title,
        names: Object.keys(g.items).filter((n) => available.includes(n)),
    }));
    const other = available.filter((n) => !KNOWN_LABELS[n]);
    if (other.length) groups.push({ title: 'Other', names: other });

    const toggle = (name) =>
        onChange(selected.includes(name) ? selected.filter((p) => p !== name) : [...selected, name]);

    const setGroup = (names, on) =>
        onChange(on ? [...new Set([...selected, ...names])] : selected.filter((p) => !names.includes(p)));

    return (
        <div className="space-y-4">
            {groups
                .filter((g) => g.names.length)
                .map((group) => {
                    const allOn = group.names.every((n) => selected.includes(n));
                    const count = group.names.filter((n) => selected.includes(n)).length;
                    return (
                        <fieldset key={group.title} className="rounded-lg border">
                            <div className="flex items-center justify-between gap-2 border-b bg-gray-50 px-3 py-2">
                                <legend className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                                    {group.title}
                                    <span className="ml-2 font-normal normal-case tracking-normal text-gray-500">
                                        {count}/{group.names.length}
                                    </span>
                                </legend>
                                <button
                                    type="button"
                                    onClick={() => setGroup(group.names, !allOn)}
                                    className="text-sm font-medium text-blue-700 hover:underline"
                                >
                                    {allOn ? 'Clear' : 'Select all'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                {group.names.map((name) => (
                                    <label
                                        key={name}
                                        htmlFor={`perm-${name}`}
                                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-base text-gray-800 hover:bg-gray-50"
                                    >
                                        <input
                                            id={`perm-${name}`}
                                            type="checkbox"
                                            checked={selected.includes(name)}
                                            onChange={() => toggle(name)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {permissionLabel(name)}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    );
                })}
        </div>
    );
}

export default function UserManagement({ users, roles, permissions }) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [tab, setTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [noAccessOnly, setNoAccessOnly] = useState(false);

    const [formMode, setFormMode] = useState(null); // 'create' | 'edit' | null
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tabCounts = useMemo(
        () => Object.fromEntries(TABS.map((t) => [t.key, users.filter(t.test).length])),
        [users]
    );

    const noAccessCount = useMemo(
        () => users.filter((u) => !isAdmin(u) && u.permissions.length === 0).length,
        [users]
    );

    const filteredUsers = useMemo(() => {
        const activeTab = TABS.find((t) => t.key === tab) || TABS[0];
        const q = searchQuery.trim().toLowerCase();

        let result = users.filter(activeTab.test);
        if (noAccessOnly) result = result.filter((u) => !isAdmin(u) && u.permissions.length === 0);
        if (q) {
            result = result.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.permissions.some((p) => permissionLabel(p).toLowerCase().includes(q))
            );
        }
        return result;
    }, [users, tab, searchQuery, noAccessOnly]);

    const { sorted: sortedUsers, sort, toggle: toggleSort } = useTableSort(filteredUsers, USER_SORT, {
        key: 'name',
        dir: 'asc',
    });

    const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * itemsPerPage;
    const pageUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage, tab, sort, noAccessOnly]);

    const clearFilters = () => {
        setSearchQuery('');
        setTab('all');
        setNoAccessOnly(false);
    };

    const chips = [
        tab !== 'all' && {
            key: 'type',
            label: `Type: ${TABS.find((t) => t.key === tab)?.label}`,
            onRemove: () => setTab('all'),
        },
        noAccessOnly && { key: 'access', label: 'Access: No forms assigned', onRemove: () => setNoAccessOnly(false) },
    ].filter(Boolean);

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const openCreate = () => {
        setSelectedUser(null);
        setFormData(EMPTY_FORM);
        setErrors({});
        setFormMode('create');
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.roles[0] || 'user',
            permissions: [...user.permissions],
        });
        setErrors({});
        setFormMode('edit');
    };

    const closeForm = () => {
        if (!isSubmitting) setFormMode(null);
    };

    const passwordMismatch =
        formData.password_confirmation !== '' && formData.password !== formData.password_confirmation;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            setErrors((prev) => ({ ...prev, password_confirmation: 'Passwords do not match.' }));
            document.getElementById(FIELD_IDS.password_confirmation)?.focus();
            return;
        }

        setIsSubmitting(true);
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(formMode === 'create' ? `${formData.name} was added` : `${formData.name} was updated`);
                setFormMode(null);
            },
            onError: (errs) => {
                setErrors(errs);
                toast.error('Please fix the highlighted fields');
                // Move focus to the first field that needs fixing.
                const first = Object.keys(FIELD_IDS).find((key) => errs[key]);
                if (first) requestAnimationFrame(() => document.getElementById(FIELD_IDS[first])?.focus());
            },
            onFinish: () => setIsSubmitting(false),
        };

        if (formMode === 'create') {
            router.post(route('admin.users.store'), formData, options);
        } else {
            router.patch(route('admin.users.update', selectedUser.id), formData, options);
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setIsSubmitting(true);
        router.delete(route('admin.users.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: (pageResponse) => {
                const flashError = pageResponse?.props?.flash?.error;
                if (flashError) toast.error(flashError);
                else toast.success(`${deleteTarget.name} was deleted`);
                setDeleteTarget(null);
            },
            onError: (errs) => Object.values(errs).forEach((msg) => toast.error(msg)),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const RowActions = ({ user }) => (
        <div className="flex items-center justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label={`Actions for ${user.name}`}>
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[13rem]">
                    <DropdownMenuItem onClick={() => openEdit(user)} className="text-base">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit details and access
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteTarget(user)}
                        className="text-base text-red-600 focus:text-red-700"
                        disabled={user.id === currentUserId}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {user.id === currentUserId ? "Can't delete yourself" : 'Delete user'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    const YouTag = ({ user }) =>
        user.id === currentUserId ? (
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-semibold uppercase text-white">You</span>
        ) : null;

    return (
        <AppLayout
            title="User Management"
            header={<PageTitle icon={Users}>User Management</PageTitle>}
        >
                <Toaster position="top-right" richColors />

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {[
                                { label: 'Total accounts', value: users.length, icon: Users, tone: 'text-blue-600 bg-blue-50' },
                                { label: 'Offices', value: tabCounts.offices, icon: Building2, tone: 'text-sky-700 bg-sky-50' },
                                { label: 'Barangays', value: tabCounts.barangays, icon: Home, tone: 'text-emerald-700 bg-emerald-50' },
                                { label: 'Admins', value: tabCounts.admins, icon: Shield, tone: 'text-violet-700 bg-violet-50' },
                            ].map(({ label, value, icon: Icon, tone }) => (
                                <div key={label} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-500">{label}</p>
                                        <p className="text-3xl font-bold tabular-nums text-gray-900">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {noAccessCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
                                <p className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {noAccessCount} account{noAccessCount === 1 ? ' has' : 's have'} no forms assigned and
                                    can't submit any reports yet.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                                    onClick={() => {
                                        setTab('all');
                                        setSearchQuery('');
                                        setNoAccessOnly(true);
                                    }}
                                >
                                    Show them
                                </Button>
                            </div>
                        )}

                        <DataPanel
                            icon={Users}
                            title="Accounts"
                            count={filteredUsers.length}
                            description="Create accounts for offices and barangays and choose which report forms each one can fill in."
                            actions={
                                <Button onClick={openCreate} className="h-11 gap-2 shadow-sm md:h-9">
                                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                                    Add user
                                </Button>
                            }
                        >
                            <DataToolbar
                                search={{
                                    id: 'user-search',
                                    value: searchQuery,
                                    onChange: setSearchQuery,
                                    placeholder: 'Search name, email or form',
                                }}
                                filters={
                                    <>
                                        <FilterSelect
                                            id="user-type"
                                            label="Type"
                                            value={tab}
                                            onChange={setTab}
                                            allLabel={`All (${tabCounts.all})`}
                                            options={TABS.filter((t) => t.key !== 'all').map((t) => ({
                                                value: t.key,
                                                label: `${t.label} (${tabCounts[t.key]})`,
                                            }))}
                                        />
                                        <FilterSelect
                                            id="user-access"
                                            label="Access"
                                            value={noAccessOnly ? 'none' : 'all'}
                                            onChange={(value) => setNoAccessOnly(value === 'none')}
                                            allLabel="Any"
                                            options={[{ value: 'none', label: 'No forms assigned' }]}
                                        />
                                    </>
                                }
                                chips={chips}
                                onClearAll={clearFilters}
                            />

                            {pageUsers.length > 0 ? (
                                <>
                                    <Table stacked>
                                        <TableHeader>
                                            <TableRow>
                                                <SortableHead sortKey="name" sort={sort} onSort={toggleSort}>User</SortableHead>
                                                <SortableHead sortKey="type" sort={sort} onSort={toggleSort}>Type</SortableHead>
                                                <TableHead>Form access</TableHead>
                                                <SortableHead sortKey="created" sort={sort} onSort={toggleSort}>Created</SortableHead>
                                                <TableHead className="text-right">
                                                    <span className="sr-only">Actions</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pageUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar user={user} />
                                                            <div className="min-w-0">
                                                                <p className="flex items-center gap-2 font-medium text-foreground">
                                                                    <span className="truncate">{user.name}</span>
                                                                    <YouTag user={user} />
                                                                </p>
                                                                <p className="truncate text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell label="Type">
                                                        <RoleBadge user={user} />
                                                    </TableCell>
                                                    <TableCell label="Form access" className="max-w-md">
                                                        <AccessSummary user={user} />
                                                    </TableCell>
                                                    <TableCell label="Created" className="whitespace-nowrap tabular-nums text-muted-foreground">
                                                        {user.created_at}
                                                    </TableCell>
                                                    <TableCell>
                                                        <RowActions user={user} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <TablePagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        totalItems={filteredUsers.length}
                                        perPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                        onPerPageChange={setItemsPerPage}
                                        itemLabel="accounts"
                                        className={PANEL_PAGINATION}
                                    />
                                </>
                            ) : (
                                <EmptyState
                                    title="No accounts match"
                                    description="Try another search or clear the filters."
                                    action={
                                        (searchQuery || tab !== 'all' || noAccessOnly) && (
                                            <Button variant="outline" onClick={clearFilters}>
                                                Clear filters
                                            </Button>
                                        )
                                    }
                                />
                            )}
                        </DataPanel>
                    </div>
                </div>

            {/* Create / edit */}
            <Dialog open={formMode !== null} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent className="flex max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:p-0">
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b py-4 pl-4 pr-14 sm:pl-6 sm:pr-12">
                            <DialogTitle>{formMode === 'create' ? 'Add user' : `Edit ${selectedUser?.name ?? 'user'}`}</DialogTitle>
                            <DialogDescription>
                                {formMode === 'create'
                                    ? 'Set up the account and choose which report forms it can fill in.'
                                    : 'Change account details, role or form access. Leave the password blank to keep the current one.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
                            {/* Account */}
                            <section className="space-y-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <h3 className="text-base font-semibold text-gray-900">Account</h3>
                                    <p className="text-sm text-gray-500">
                                        <span className="text-red-600" aria-hidden="true">*</span> Required
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-base" htmlFor="form-name">
                                            Name
                                            <RequiredMark />
                                        </Label>
                                        <Input
                                            id="form-name"
                                            value={formData.name}
                                            onChange={(e) => setField('name', e.target.value)}
                                            placeholder="e.g. CSWDO or Barangay Alibagu"
                                            required
                                            autoComplete="off"
                                            aria-invalid={errors.name ? true : undefined}
                                            aria-describedby={errors.name ? 'form-name-error' : undefined}
                                            className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                                        />
                                        <FieldError id="form-name-error" message={errors.name} />
                                    </div>
                                    <div>
                                        <Label className="text-base" htmlFor="form-email">
                                            Email
                                            <RequiredMark />
                                        </Label>
                                        <Input
                                            id="form-email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setField('email', e.target.value)}
                                            placeholder="name@barangay.local"
                                            required
                                            autoComplete="off"
                                            aria-invalid={errors.email ? true : undefined}
                                            aria-describedby={errors.email ? 'form-email-error' : undefined}
                                            className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                        <FieldError id="form-email-error" message={errors.email} />
                                    </div>
                                    <div>
                                        <Label className="text-base" htmlFor="form-password">
                                            {formMode === 'create' ? 'Password' : 'New password'}
                                            {formMode === 'create' && <RequiredMark />}
                                        </Label>
                                        <PasswordInput
                                            id="form-password"
                                            value={formData.password}
                                            onChange={(e) => setField('password', e.target.value)}
                                            placeholder={formMode === 'create' ? '' : 'Leave blank to keep'}
                                            required={formMode === 'create'}
                                            autoComplete="new-password"
                                            error={errors.password}
                                        />
                                        <FieldError id="form-password-error" message={errors.password} />
                                    </div>
                                    <div>
                                        <Label className="text-base" htmlFor="form-password-confirm">
                                            Confirm password
                                            {formMode === 'create' && <RequiredMark />}
                                        </Label>
                                        <PasswordInput
                                            id="form-password-confirm"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setField('password_confirmation', e.target.value)}
                                            placeholder={formMode === 'create' ? '' : 'Leave blank to keep'}
                                            required={formMode === 'create' || formData.password !== ''}
                                            autoComplete="new-password"
                                            error={errors.password_confirmation || (passwordMismatch ? 'mismatch' : null)}
                                        />
                                        <FieldError
                                            id="form-password-confirm-error"
                                            message={
                                                errors.password_confirmation ||
                                                (passwordMismatch ? 'Passwords do not match.' : null)
                                            }
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Role */}
                            <section className="space-y-3">
                                <h3 className="text-base font-semibold text-gray-900">Role</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Role">
                                    {roles.map((role) => {
                                        const active = formData.role === role.name;
                                        const admin = role.name === 'admin';
                                        return (
                                            <label
                                                key={role.id}
                                                className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                                                    active ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.name}
                                                    checked={active}
                                                    onChange={() => setField('role', role.name)}
                                                    className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>
                                                    <span className="flex items-center gap-1.5 text-base font-medium capitalize text-gray-900">
                                                        {admin ? <ShieldCheck className="h-4 w-4 text-violet-600" /> : <UserIcon className="h-4 w-4 text-gray-500" />}
                                                        {role.name}
                                                    </span>
                                                    <span className="mt-0.5 block text-sm text-gray-500">
                                                        {admin
                                                            ? 'Opens every form and manages disasters, users and logs.'
                                                            : 'Fills in only the forms checked below.'}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <FieldError message={errors.role} />
                            </section>

                            {/* Form access */}
                            <section className="space-y-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <h3 className="text-base font-semibold text-gray-900">Form access</h3>
                                    <span className="text-sm tabular-nums text-gray-500">
                                        {formData.permissions.length} of {permissions.length} selected
                                    </span>
                                </div>
                                {formData.role === 'admin' ? (
                                    <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-base text-violet-800">
                                        Admins can open every form, so no individual form access is needed.
                                    </p>
                                ) : (
                                    <PermissionPicker
                                        permissions={permissions}
                                        selected={formData.permissions}
                                        onChange={(next) => setField('permissions', next)}
                                    />
                                )}
                                <FieldError message={errors.permissions} />
                            </section>
                        </div>

                        <DialogFooter className="border-t bg-gray-50 px-4 py-3 sm:px-6">
                            <Button type="button" variant="outline" onClick={closeForm} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || passwordMismatch}>
                                {isSubmitting
                                    ? formMode === 'create'
                                        ? 'Adding…'
                                        : 'Saving…'
                                    : formMode === 'create'
                                      ? 'Add user'
                                      : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isSubmitting && setDeleteTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
                        <DialogDescription>{deleteTarget?.email} will no longer be able to sign in.</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-base text-red-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Every report this account submitted (weather, evacuation, incidents, casualties and the rest) is
                            deleted with it, including reports from past disasters. This can't be undone. To stop someone
                            signing in without losing their reports, change their password instead.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting…' : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
