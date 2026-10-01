import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import {
    AlertTriangle,
    Building2,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    EyeOff,
    Home,
    MoreVertical,
    Search,
    SearchX,
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
    const [sortBy, setSortBy] = useState('name-asc');
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

        // Server sends newest first, so "newest" keeps that order.
        if (sortBy === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === 'name-desc') result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        return result;
    }, [users, tab, searchQuery, sortBy, noAccessOnly]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage, tab, sortBy, noAccessOnly]);

    const pageNumbers = useMemo(() => {
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
            (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
        );
        return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ['gap-' + p, p] : [p]));
    }, [totalPages, page]);

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
        <SidebarProvider>
            <AppSidebar />
            <Head title="User Management" />
            <SidebarInset>
                <Toaster position="top-right" richColors />

                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 px-4 backdrop-blur-sm sm:px-6">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="mx-2 h-6" />
                    <Users className="h-5 w-5 text-blue-600" />
                    <h1 className="text-lg font-semibold text-blue-700 sm:text-xl">User Management</h1>
                </header>

                <div className="flex-1 overflow-auto bg-gray-50/60 p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-5">
                        {/* Title */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Accounts</h2>
                                <p className="mt-1 text-base text-gray-600">
                                    Create accounts for offices and barangays and choose which report forms each one can fill in.
                                </p>
                            </div>
                            <Button onClick={openCreate} className="self-start sm:self-auto">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add user
                            </Button>
                        </div>

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

                        {noAccessOnly && (
                            <div className="flex items-center gap-2 text-base text-gray-600">
                                Showing only accounts with no forms assigned.
                                <button
                                    type="button"
                                    onClick={() => setNoAccessOnly(false)}
                                    className="font-medium text-blue-700 hover:underline"
                                >
                                    Show everyone
                                </button>
                            </div>
                        )}

                        {/* List */}
                        <section className="overflow-hidden rounded-lg border bg-white">
                            {/* Toolbar */}
                            <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
                                <nav className="flex overflow-x-auto rounded-lg bg-gray-100 p-1" aria-label="Account type">
                                    {TABS.map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => setTab(t.key)}
                                            aria-pressed={tab === t.key}
                                            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-base font-medium transition-colors ${
                                                tab === t.key
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {t.label}
                                            <span
                                                className={`rounded-full px-1.5 text-sm tabular-nums ${
                                                    tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {tabCounts[t.key]}
                                            </span>
                                        </button>
                                    ))}
                                </nav>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="relative sm:w-72">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="user-search"
                                            type="search"
                                            placeholder="Search name, email or form"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger id="user-sort" className="sm:w-40" aria-label="Sort users">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name-asc">Name A–Z</SelectItem>
                                            <SelectItem value="name-desc">Name Z–A</SelectItem>
                                            <SelectItem value="newest">Newest first</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {pageUsers.length > 0 ? (
                                <>
                                    {/* Table: md and up */}
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-base">
                                            <thead className="bg-gray-50 text-left text-sm uppercase tracking-wide text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2.5 font-medium">User</th>
                                                    <th className="px-4 py-2.5 font-medium">Type</th>
                                                    <th className="px-4 py-2.5 font-medium">Form access</th>
                                                    <th className="px-4 py-2.5 font-medium">Created</th>
                                                    <th className="px-4 py-2.5 text-right font-medium">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {pageUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar user={user} />
                                                                <div className="min-w-0">
                                                                    <p className="flex items-center gap-2 font-medium text-gray-900">
                                                                        <span className="truncate">{user.name}</span>
                                                                        <YouTag user={user} />
                                                                    </p>
                                                                    <p className="truncate text-sm text-gray-500">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <RoleBadge user={user} />
                                                        </td>
                                                        <td className="max-w-md px-4 py-3">
                                                            <AccessSummary user={user} />
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-600">
                                                            {user.created_at}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <RowActions user={user} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Cards: below md */}
                                    <ul className="divide-y md:hidden">
                                        {pageUsers.map((user) => (
                                            <li key={user.id} className="flex gap-3 px-4 py-3">
                                                <Avatar user={user} />
                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="flex items-center gap-2 font-medium text-gray-900">
                                                                <span className="truncate">{user.name}</span>
                                                                <YouTag user={user} />
                                                            </p>
                                                            <p className="truncate text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                        <RowActions user={user} />
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <RoleBadge user={user} />
                                                        <span className="text-sm text-gray-500">Created {user.created_at}</span>
                                                    </div>
                                                    <AccessSummary user={user} max={2} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Footer */}
                                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-base tabular-nums text-gray-600">
                                            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{' '}
                                            {filteredUsers.length}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <RowsPerPage
                                                rowsPerPage={itemsPerPage}
                                                setRowsPerPage={setItemsPerPage}
                                                totalRows={filteredUsers.length}
                                            />
                                            {totalPages > 1 && (
                                                <nav className="flex items-center gap-1" aria-label="Pagination">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => setCurrentPage(page - 1)}
                                                        disabled={page === 1}
                                                        aria-label="Previous page"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    {pageNumbers.map((p) =>
                                                        typeof p === 'string' ? (
                                                            <span key={p} aria-hidden="true" className="px-1.5 text-base text-gray-500">
                                                                …
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                key={p}
                                                                variant={p === page ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="h-8 min-w-8 px-2 tabular-nums"
                                                                onClick={() => setCurrentPage(p)}
                                                                aria-current={p === page ? 'page' : undefined}
                                                            >
                                                                {p}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => setCurrentPage(page + 1)}
                                                        disabled={page === totalPages}
                                                        aria-label="Next page"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </nav>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center px-4 py-14 text-center">
                                    <SearchX className="mb-3 h-10 w-10 text-gray-300" />
                                    <p className="font-medium text-gray-900">No accounts match</p>
                                    <p className="mt-1 text-base text-gray-500">Try another search or switch to the All tab.</p>
                                    {(searchQuery || tab !== 'all' || noAccessOnly) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setTab('all');
                                                setNoAccessOnly(false);
                                            }}
                                        >
                                            Show all accounts
                                        </Button>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </SidebarInset>

            {/* Create / edit */}
            <Dialog open={formMode !== null} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b px-6 py-4 text-left">
                            <DialogTitle>{formMode === 'create' ? 'Add user' : `Edit ${selectedUser?.name ?? 'user'}`}</DialogTitle>
                            <DialogDescription>
                                {formMode === 'create'
                                    ? 'Set up the account and choose which report forms it can fill in.'
                                    : 'Change account details, role or form access. Leave the password blank to keep the current one.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
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

                        <DialogFooter className="gap-2 border-t bg-gray-50 px-6 py-3 sm:gap-0">
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
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting…' : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
