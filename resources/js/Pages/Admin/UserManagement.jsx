import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageTitle from '@/Components/PageTitle';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/InputError';
import { buildSuggestions } from '@/lib/searchSuggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
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
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    AlertTriangle,
    Building2,
    Check,
    Eye,
    EyeOff,
    Home,
    MoreVertical,
    Pencil,
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

// Field order in the form, used to focus the first field with an error.
const FIELD_IDS = {
    name: 'form-name',
    email: 'form-email',
    password: 'form-password',
    password_confirmation: 'form-password-confirm',
};

function Avatar({ user }) {
    const tone = isAdmin(user)
        ? 'bg-primary text-primary-foreground'
        : isBarangay(user)
          ? 'bg-success/15 text-success'
          : 'bg-accent text-accent-foreground';
    return (
        <span
            className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold', tone)}
            aria-hidden="true"
        >
            {initials(user.name)}
        </span>
    );
}

// Icon + text, never color alone.
function RoleBadge({ user }) {
    const admin = isAdmin(user);
    const barangay = isBarangay(user);
    const Icon = admin ? ShieldCheck : barangay ? Home : Building2;
    const tone = admin
        ? 'border-primary/30 bg-primary/10 text-primary'
        : barangay
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border bg-muted text-foreground';
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-medium', tone)}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {admin ? 'Admin' : barangay ? 'Barangay' : 'Office'}
        </span>
    );
}

function AccessSummary({ user, total }) {
    if (isAdmin(user)) {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                All forms
            </span>
        );
    }
    if (user.permissions.length === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                No forms assigned
            </span>
        );
    }
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium tabular-nums text-muted-foreground">
                {user.permissions.length} of {total} forms
            </p>
            <AccessChips permissions={user.permissions} max={3} />
        </div>
    );
}

// Shows the first few forms; "+N more" expands the rest (works with keyboard, not only hover).
function AccessChips({ permissions, max }) {
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? permissions : permissions.slice(0, max);
    const rest = permissions.length - max;
    return (
        <div className="flex flex-wrap gap-1.5">
            {shown.map((p) => (
                <span key={p} className="rounded-md bg-accent px-2 py-0.5 text-sm text-accent-foreground">
                    {permissionLabel(p)}
                </span>
            ))}
            {rest > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="inline-flex min-h-8 items-center rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0"
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
        <p id={id} role="alert" className="mt-1 flex items-start gap-1 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {message}
        </p>
    );
}

function RequiredMark() {
    return (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
        </span>
    );
}

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
                // Edge adds its own reveal eye to password fields; hide it so only this toggle shows.
                className={cn('pr-12 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden', error && 'border-destructive')}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:w-8"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
        </div>
    );
}

const linkButton =
    'inline-flex min-h-9 items-center rounded-md px-2 text-sm font-medium text-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                    {selected.length} of {available.length} forms selected
                </p>
                <div className="-mr-2 flex">
                    <button type="button" className={linkButton} onClick={() => onChange([...available])}>
                        Select all
                    </button>
                    <button type="button" className={linkButton} onClick={() => onChange([])}>
                        Clear
                    </button>
                </div>
            </div>
            {groups
                .filter((g) => g.names.length)
                .map((group) => {
                    const allOn = group.names.every((n) => selected.includes(n));
                    const count = group.names.filter((n) => selected.includes(n)).length;
                    return (
                        <fieldset key={group.title} className="overflow-hidden rounded-lg border border-border">
                            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 py-1 pl-3 pr-1">
                                <legend className="float-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.title}
                                    <span className="ml-2 font-medium normal-case tracking-normal tabular-nums">
                                        {count}/{group.names.length}
                                    </span>
                                </legend>
                                <button type="button" onClick={() => setGroup(group.names, !allOn)} className={linkButton}>
                                    {allOn ? 'Clear group' : 'Select group'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2">
                                {group.names.map((name) => (
                                    <label
                                        key={name}
                                        htmlFor={`perm-${name}`}
                                        className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-base text-foreground hover:bg-accent/40 has-[:checked]:bg-accent/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ring md:min-h-10 md:text-sm"
                                    >
                                        <input
                                            id={`perm-${name}`}
                                            type="checkbox"
                                            checked={selected.includes(name)}
                                            onChange={() => toggle(name)}
                                            className="h-5 w-5 rounded border-input text-primary focus:ring-0 focus:ring-offset-0 md:h-4 md:w-4"
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

function RowActions({ user, isSelf, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-11 w-11 p-0 md:h-9 md:w-9" aria-label={`More actions for ${user.name}`}>
                        <MoreVertical className="h-5 w-5" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[13rem]">
                    <DropdownMenuItem onClick={() => onEdit(user)} className="min-h-11 text-base md:min-h-9">
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit details and access
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="min-h-11 text-base text-destructive focus:text-destructive md:min-h-9"
                        disabled={isSelf}
                    >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        {isSelf ? "Can't delete yourself" : 'Delete user'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
    const [formTab, setFormTab] = useState('account');
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialForm = useRef(EMPTY_FORM);

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

    const suggestSearch = useCallback(
        (text) => buildSuggestions(users, [{ get: (u) => u.name, label: 'user' }, 'email'], text),
        [users]
    );

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

    const stats = [
        { key: 'all', label: 'Total', value: users.length, icon: Users, tone: 'bg-accent text-accent-foreground' },
        { key: 'offices', label: 'Offices', value: tabCounts.offices, icon: Building2, tone: 'bg-muted text-foreground' },
        { key: 'barangays', label: 'Barangays', value: tabCounts.barangays, icon: Home, tone: 'bg-success/10 text-success' },
        { key: 'admins', label: 'Admins', value: tabCounts.admins, icon: Shield, tone: 'bg-primary/10 text-primary' },
    ];

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const openForm = (mode, user, data) => {
        setSelectedUser(user);
        setFormData(data);
        initialForm.current = data;
        setErrors({});
        setFormTab('account');
        setFormMode(mode);
    };

    const openCreate = () => openForm('create', null, EMPTY_FORM);

    const openEdit = (user) =>
        openForm('edit', user, {
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.roles[0] || 'user',
            permissions: [...user.permissions],
        });

    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm.current);

    // Closing with typed-in changes asks first, so a stray tap outside the form can't lose them.
    const requestClose = () => {
        if (isSubmitting) return;
        if (isDirty) setConfirmDiscard(true);
        else setFormMode(null);
    };

    const discardChanges = () => {
        setConfirmDiscard(false);
        setFormMode(null);
    };

    const passwordMismatch =
        formData.password_confirmation !== '' && formData.password !== formData.password_confirmation;

    // Shows the tab that holds the first problem, then focuses the field.
    const revealErrors = (errs) => {
        const firstAccount = Object.keys(FIELD_IDS).find((key) => errs[key]);
        if (firstAccount || errs.role) {
            setFormTab('account');
            if (firstAccount) setTimeout(() => document.getElementById(FIELD_IDS[firstAccount])?.focus(), 60);
        } else if (Object.keys(errs).some((key) => key.startsWith('permissions'))) {
            setFormTab('access');
        }
    };

    const clientErrors = () => {
        const found = {};
        if (!formData.name.trim()) found.name = 'Enter a name for this account.';
        if (!formData.email.trim()) found.email = 'Enter an email address.';
        if (formMode === 'create' && !formData.password) found.password = 'Set a password for this account.';
        if (formData.password !== formData.password_confirmation) {
            found.password_confirmation = 'Passwords do not match.';
        }
        return found;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const found = clientErrors();
        if (Object.keys(found).length > 0) {
            setErrors(found);
            revealErrors(found);
            return;
        }

        setIsSubmitting(true);
        const options = {
            // Roles and the permission list don't change when saving a user.
            only: ['users', 'flash'],
            preserveScroll: true,
            onSuccess: () => {
                toast.success(formMode === 'create' ? `${formData.name} was added` : `${formData.name} was updated`);
                setFormMode(null);
            },
            onError: (errs) => {
                setErrors(errs);
                toast.error('Please fix the highlighted fields');
                revealErrors(errs);
            },
            onFinish: () => setIsSubmitting(false),
        };

        if (formMode === 'create') {
            router.post(route('admin.users.store'), formData, options);
        } else {
            router.patch(route('admin.users.update', selectedUser.id), formData, options);
        }
    };

    // Start each delete with an empty password field.
    useEffect(() => {
        setDeletePassword('');
        setDeleteError('');
    }, [deleteTarget]);

    const handleDelete = (e) => {
        e.preventDefault();
        if (!deleteTarget) return;
        setIsSubmitting(true);
        router.delete(route('admin.users.destroy', deleteTarget.id), {
            data: { password: deletePassword },
            // Own error bag, so a wrong password never shows up in the account form.
            errorBag: 'deleteUser',
            only: ['users', 'flash'],
            preserveScroll: true,
            onSuccess: (pageResponse) => {
                const flashError = pageResponse?.props?.flash?.error;
                if (flashError) toast.error(flashError);
                else toast.success(`${deleteTarget.name} was deleted`);
                setDeleteTarget(null);
            },
            onError: (errs) => {
                if (errs.password) setDeleteError(errs.password);
                else Object.values(errs).forEach((msg) => toast.error(msg));
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const accountHasErrors = Object.keys(FIELD_IDS).some((key) => errors[key]) || Boolean(errors.role);
    const accessHasErrors = Object.keys(errors).some((key) => key.startsWith('permissions') && errors[key]);

    return (
        <AppLayout
            title="User Management"
            header={<PageTitle icon={Users}>User Management</PageTitle>}
        >
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mx-auto max-w-7xl space-y-5">
                    {/* Summary: each tile also filters the list below. */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {stats.map(({ key, label, value, icon: Icon, tone }) => {
                            const active = tab === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setTab(active && key !== 'all' ? 'all' : key)}
                                    className={cn(
                                        'flex min-h-[4.5rem] items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4',
                                        active ? 'border-primary ring-1 ring-primary' : 'border-border'
                                    )}
                                >
                                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tone)}>
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-muted-foreground">{label}</span>
                                        <span className="block text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{value}</span>
                                    </span>
                                    {active && <Check className="h-4 w-4 shrink-0 self-start text-primary" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>

                    {noAccessCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-base text-foreground">
                            <p className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                                {noAccessCount} account{noAccessCount === 1 ? ' has' : 's have'} no forms assigned and
                                can't submit any reports yet.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-11 bg-card md:h-9"
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
                                suggest: suggestSearch,
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
                                            <SortableHead sortKey="created" sort={sort} onSort={toggleSort}>Added</SortableHead>
                                            <TableHead className="text-right">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageUsers.map((user) => (
                                            // Phones: a compact card (name + ⋮, type + date, then forms) instead of one labeled row per column.
                                            <TableRow
                                                key={user.id}
                                                className="max-md:!grid max-md:grid-cols-[auto_1fr_auto] max-md:items-center max-md:gap-x-2 max-md:px-3"
                                            >
                                                <TableCell className="max-md:order-1 max-md:col-span-2 max-md:px-0">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar user={user} />
                                                        <div className="min-w-0">
                                                            <p className="flex flex-wrap items-center gap-x-2 font-medium text-foreground">
                                                                <span className="[overflow-wrap:anywhere]">{user.name}</span>
                                                                {user.id === currentUserId && (
                                                                    <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-semibold uppercase text-primary-foreground">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-muted-foreground [overflow-wrap:anywhere]">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-md:order-3 max-md:px-0">
                                                    <RoleBadge user={user} />
                                                </TableCell>
                                                <TableCell className="max-w-md max-md:order-5 max-md:col-span-3 max-md:px-0">
                                                    <AccessSummary user={user} total={permissions.length} />
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground max-md:order-4 max-md:col-span-2 max-md:px-0 max-md:text-sm">
                                                    <span className="md:hidden">Added </span>
                                                    {user.created_at}
                                                </TableCell>
                                                <TableCell className="max-md:order-2 max-md:px-0">
                                                    <RowActions
                                                        user={user}
                                                        isSelf={user.id === currentUserId}
                                                        onEdit={openEdit}
                                                        onDelete={setDeleteTarget}
                                                    />
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

            {/* Create / edit: a narrow centred card (512px max, 16px side margins on phones). */}
            <Dialog open={formMode !== null} onOpenChange={(open) => !open && requestClose()}>
                <DialogContent
                    // Fixed height so the card doesn't change size when switching tabs; the body scrolls inside.
                    className="flex flex-col gap-0 overflow-hidden p-0 sm:p-0"
                >
                    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b border-border py-4 pl-4 pr-14 sm:pl-6 sm:pr-12">
                            <DialogTitle className="text-foreground [overflow-wrap:anywhere] leading-snug">
                                {formMode === 'create' ? 'Add user' : `Edit ${selectedUser?.name ?? 'user'}`}
                            </DialogTitle>
                            {/* Phones: the hint is screen-reader only to leave room for the form. */}
                            <DialogDescription className="text-muted-foreground max-sm:sr-only">
                                {formMode === 'create'
                                    ? 'Set up the account and choose which report forms it can fill in.'
                                    : 'Change account details, role or form access. Leave the password blank to keep the current one.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={formTab} onValueChange={setFormTab} className="flex min-h-0 flex-1 flex-col">
                            <div className="border-b border-border bg-muted/30 px-4 py-2 sm:px-6">
                                <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg bg-muted p-1 shadow-none">
                                    <TabsTrigger
                                        value="account"
                                        className="min-h-10 gap-1.5 rounded-md text-muted-foreground ring-offset-background hover:bg-accent hover:text-foreground focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                    >
                                        Account
                                        {accountHasErrors && (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                                                <span className="sr-only">has errors</span>
                                            </>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="access"
                                        className="min-h-10 gap-1.5 rounded-md text-muted-foreground ring-offset-background hover:bg-accent hover:text-foreground focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                    >
                                        Form access
                                        <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
                                            {formData.role === 'admin' ? 'All' : formData.permissions.length}
                                        </span>
                                        {accessHasErrors && (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                                                <span className="sr-only">has errors</span>
                                            </>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                                <TabsContent
                                    value="account"
                                    className="mt-0 space-y-6 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-ring"
                                >
                                    <section className="space-y-3">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className="text-base font-semibold text-foreground">Account details</h3>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-destructive" aria-hidden="true">*</span> Required
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
                                                    className={cn('mt-1', errors.name && 'border-destructive')}
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
                                                    inputMode="email"
                                                    value={formData.email}
                                                    onChange={(e) => setField('email', e.target.value)}
                                                    placeholder="name@barangay.local"
                                                    required
                                                    autoComplete="off"
                                                    aria-invalid={errors.email ? true : undefined}
                                                    aria-describedby={errors.email ? 'form-email-error' : undefined}
                                                    className={cn('mt-1', errors.email && 'border-destructive')}
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

                                    <section className="space-y-3">
                                        <h3 className="text-base font-semibold text-foreground">Role</h3>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Role">
                                            {roles.map((role) => {
                                                const active = formData.role === role.name;
                                                const admin = role.name === 'admin';
                                                return (
                                                    <label
                                                        key={role.id}
                                                        className={cn(
                                                            'flex min-h-11 cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                                                            active ? 'border-primary bg-accent/50 ring-1 ring-primary' : 'border-border hover:bg-muted'
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value={role.name}
                                                            checked={active}
                                                            onChange={() => setField('role', role.name)}
                                                            className="mt-0.5 h-5 w-5 shrink-0 border-input text-primary focus:ring-0 focus:ring-offset-0"
                                                        />
                                                        <span>
                                                            <span className="flex items-center gap-1.5 text-base font-medium capitalize text-foreground">
                                                                {admin ? (
                                                                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                                                                ) : (
                                                                    <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                                                )}
                                                                {role.name}
                                                            </span>
                                                            <span className="mt-0.5 block text-sm text-muted-foreground">
                                                                {admin
                                                                    ? 'Opens every form and manages disasters, users and logs.'
                                                                    : 'Fills in only the forms checked on the next tab.'}
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <FieldError message={errors.role} />
                                    </section>
                                </TabsContent>

                                <TabsContent
                                    value="access"
                                    className="mt-0 space-y-3 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-ring"
                                >
                                    {formData.role === 'admin' ? (
                                        <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-base text-foreground">
                                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
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
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* The offline status card sits above dialogs: keep the buttons clear of it on phones. */}
                        <DialogFooter className="border-t border-border bg-muted/30 px-4 py-3 max-sm:flex-row max-sm:pb-[calc(0.75rem+var(--offline-status-h,0px))] max-sm:[&>button]:flex-1 sm:px-6">
                            <Button type="button" variant="outline" onClick={requestClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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

            {/* Unsaved changes */}
            <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
                <DialogContent centered className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Discard your changes?</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            What you changed in this form hasn't been saved yet.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
                            Keep editing
                        </Button>
                        <Button variant="destructive" onClick={discardChanges}>
                            Discard changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isSubmitting && setDeleteTarget(null)}>
                <DialogContent centered className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground [overflow-wrap:anywhere]">Delete {deleteTarget?.name}?</DialogTitle>
                        <DialogDescription className="text-muted-foreground [overflow-wrap:anywhere]">
                            {deleteTarget?.email} will no longer be able to sign in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-base text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        <p>
                            Every report this account submitted (weather, evacuation, incidents, casualties and the rest) is
                            deleted with it, including reports from past disasters. This can't be undone. To stop someone
                            signing in without losing their reports, change their password instead.
                        </p>
                    </div>
                    <form onSubmit={handleDelete} className="grid gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="delete-user-password">Enter your password to confirm</Label>
                            <Input
                                id="delete-user-password"
                                type="password"
                                autoComplete="current-password"
                                value={deletePassword}
                                onChange={(e) => {
                                    setDeletePassword(e.target.value);
                                    setDeleteError('');
                                }}
                                aria-invalid={Boolean(deleteError)}
                                aria-describedby={deleteError ? 'delete-user-password-error' : undefined}
                                className="h-11 md:h-9"
                            />
                            <InputError id="delete-user-password-error" message={deleteError} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" disabled={isSubmitting || !deletePassword}>
                                {isSubmitting ? 'Deleting…' : 'Delete user'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
