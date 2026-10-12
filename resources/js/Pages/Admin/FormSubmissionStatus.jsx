import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from "@/Layouts/AppLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Eye, FileText } from "lucide-react";
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
} from "@/components/ui/popover";
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
} from "@/components/ui/sheet";
import axios from 'axios';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import LiveIndicator from '@/Components/LiveIndicator';

const SUBMISSION_SORT = {
    name: (u) => u.name.toLowerCase(),
    email: (u) => u.email.toLowerCase(),
    status: (u) => (u.has_submitted ? 0 : 1),
    last: (u) => (u.last_submission ? new Date(u.last_submission).getTime() : null),
};

export default function FormSubmissionStatus({ users, activeTyphoon }) {
    // Slower than the other pages: this page runs about 20 grouped queries per refresh.
    const live = useLiveRefresh({ only: ['users', 'activeTyphoon'], interval: 30000, enabled: Boolean(activeTyphoon) });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFormData, setSelectedFormData] = useState(null);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setSelectedFormData(null);
    };

    const handleViewFormData = async (userId, table, formName) => {
        // Toggle: if clicking the same form, hide it
        if (selectedFormData?.form_name === formName) {
            setSelectedFormData(null);
            return;
        }

        setLoadingFormData(true);
        try {
            const response = await axios.get(`/admin/user-form-data/${userId}`, {
                params: { table, form_name: formName }
            });
            setSelectedFormData(response.data);
        } catch (error) {
            console.error('Error fetching form data:', error);
        } finally {
            setLoadingFormData(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setSelectedFormData(null);
    };

    const renderFormData = (data) => {
        if (!data || data.length === 0) {
            return (
                <EmptyState icon={AlertCircle} title="No data available" />
            );
        }

        // Get all unique keys from the data
        const keys = Object.keys(data[0]).filter(key => 
            !['id', 'typhoon_id', 'user_id', 'created_at', 'updated_at', 'updated_by'].includes(key)
        );

        return (
            <div className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">#</TableHead>
                            {keys.map(key => (
                                <TableHead key={key}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {idx + 1}
                                </TableCell>
                                {keys.map(key => (
                                    <TableCell key={key} className="text-foreground">
                                        {row[key] !== null && row[key] !== undefined ? (
                                            <span className="inline-block max-w-xs truncate" title={String(row[key])}>
                                                {String(row[key])}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">-</span>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    const getStatusBadge = (hasSubmitted) => {
        return (
            <span
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    hasSubmitted
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full ${hasSubmitted ? 'bg-success' : 'bg-destructive'}`}
                    aria-hidden="true"
                />
                {hasSubmitted ? 'Submitted' : 'Not submitted'}
            </span>
        );
    };

    const formatPermissions = (permissions) => {
        return permissions
            .map(p => p.replace('access-', '').replace('-form', '').replace(/-/g, ' '))
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join(', ');
    };

    // Map permission to table name for checking submission status
    const permissionToTable = {
        'access-weather-form': 'weather_reports',
        'access-electricity-form': 'electricity_services',
        'access-water-service-form': 'water_services',
        'access-communication-form': 'communications',
        'access-pre-emptive-form': 'pre_emptive_reports',
        'access-incident-form': 'incident_monitored',
        'access-agriculture-form': 'agriculture_reports',
        'access-water-level-form': 'water_levels',
        'access-road-form': 'roads',
        'access-bridge-form': 'bridges',
        'access-pre-positioning-form': 'pre_positionings',
        'access-declaration-form': 'usc_declarations',
        'access-response-operations': 'response_operations',
        'access-assistance-extended': 'assistance_extendeds',
        'access-casualty-form': 'casualties',
        'access-injured-form': 'injureds',
        'access-missing-form': 'missing',
        'access-damaged-houses-form': 'damaged_house_reports',
        'access-affected-tourists-form': 'affected_tourists',
        'access-assistance-provided-lgus-form': 'assistance_provided_lgus',
        'access-suspension-classes-form': 'suspension_of_classes',
        'access-suspension-work-form': 'suspension_of_works',
    };

    const renderAssignedForms = (user) => {
        if (!user.permissions || user.permissions.length === 0) {
            return <span className="text-sm text-gray-400 italic">No forms assigned</span>;
        }

        const submittedTables = user.submitted_form_types || [];
        const totalForms = user.permissions.length;
        
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                    >
                        <FileText className="w-4 h-4" />
                        View Forms ({totalForms})
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(420px,calc(100vw-2rem))]" align="start">
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900">Assigned Forms</h4>
                            <p className="text-xs text-gray-500 mt-1">Forms assigned to this organization</p>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                                {user.permissions.map((permission, idx) => {
                                    const formName = permission
                                        .replace('access-', '')
                                        .replace('-form', '')
                                        .replace(/-/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                    
                                    const tableName = permissionToTable[permission];
                                    const isSubmitted = tableName && submittedTables.includes(tableName);
                                    
                                    return (
                                        <span
                                            key={idx}
                                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                                isSubmitted
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}
                                        >
                                            {isSubmitted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {formName}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    // Sort users: most recent submissions first, then by submission status
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            // First, sort by whether they have submitted (submitted first)
            if (a.has_submitted && !b.has_submitted) return -1;
            if (!a.has_submitted && b.has_submitted) return 1;
            
            // If both submitted or both not submitted, sort by last_submission date (most recent first)
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
            (statusFilter === 'all' || user.has_submitted === (statusFilter === 'submitted')) &&
            (!query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                formatPermissions(user.permissions).toLowerCase().includes(query))
        );
    }, [sortedUsers, searchQuery, statusFilter]);

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
                      label: `Status: ${statusFilter === 'submitted' ? 'Submitted' : 'Not yet submitted'}`,
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

                <main className="w-full p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <DataPanel
                            icon={FileText}
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
                                    <DataToolbar
                                        search={{
                                            id: 'submission-search',
                                            value: searchQuery,
                                            onChange: setSearchQuery,
                                            placeholder: 'Search name, email or assigned form',
                                        }}
                                        filters={
                                            <FilterSelect
                                                id="submission-status"
                                                label="Status"
                                                value={statusFilter}
                                                onChange={setStatusFilter}
                                                options={[
                                                    { value: 'submitted', label: 'Submitted' },
                                                    { value: 'pending', label: 'Not yet submitted' },
                                                ]}
                                            />
                                        }
                                        chips={chips}
                                        onClearAll={clearFilters}
                                    />

                                    {paginationData.paginatedUsers.length > 0 ? (
                                        <>
                                            <Table stacked>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12 text-right">
                                                            <span aria-hidden="true">#</span>
                                                            <span className="sr-only">Row</span>
                                                        </TableHead>
                                                        <SortableHead sortKey="name" sort={sort} onSort={toggleSort}>Name</SortableHead>
                                                        <SortableHead sortKey="email" sort={sort} onSort={toggleSort}>Email</SortableHead>
                                                        <SortableHead sortKey="status" sort={sort} onSort={toggleSort}>Status</SortableHead>
                                                        <TableHead>Assigned forms</TableHead>
                                                        <SortableHead sortKey="last" sort={sort} onSort={toggleSort}>Last submission</SortableHead>
                                                        <TableHead className="text-right">
                                                            <span className="sr-only">Actions</span>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginationData.paginatedUsers.map((user, index) => (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="text-right tabular-nums text-muted-foreground max-md:!hidden">
                                                                {paginationData.startIndex + index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-foreground">
                                                                {user.name}
                                                            </TableCell>
                                                            <TableCell label="Email" className="text-muted-foreground">
                                                                {user.email}
                                                            </TableCell>
                                                            <TableCell label="Status">
                                                                {getStatusBadge(user.has_submitted)}
                                                            </TableCell>
                                                            <TableCell label="Assigned forms">
                                                                {renderAssignedForms(user)}
                                                            </TableCell>
                                                            <TableCell label="Last submission" className="whitespace-nowrap tabular-nums">
                                                                {user.last_submission ? (
                                                                    <span className="text-muted-foreground">
                                                                        {new Date(user.last_submission).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="italic text-muted-foreground">No submissions yet</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {user.has_submitted ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleViewDetails(user)}
                                                                        className="h-11 gap-1 font-medium text-primary hover:bg-accent hover:text-primary md:h-8"
                                                                        aria-label={`View submissions from ${user.name}`}
                                                                    >
                                                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                                                        View
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-muted-foreground" aria-label="Nothing to view">-</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

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

            {/* User Details Sheet */}
            <Sheet open={isModalOpen} onOpenChange={closeModal}>
                <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-4xl p-0 flex flex-col bg-white border-l border-gray-200 shadow-2xl"
                >
                    <SheetHeader className="pl-4 pr-14 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                        <div className="flex items-start justify-between">
                            <div>
                                <SheetTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{selectedUser?.name}</SheetTitle>
                                <SheetDescription className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {activeTyphoon?.name}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span>{selectedUser?.submitted_forms?.length || 0} forms submitted</span>
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-gray-50 to-white">
                        {selectedUser?.submitted_forms && selectedUser.submitted_forms.length > 0 ? (
                            <div className="space-y-4">
                                {selectedUser.submitted_forms.map((form, idx) => (
                                    <div key={idx} className="group">
                                        <button
                                            onClick={() => handleViewFormData(selectedUser.id, form.table, form.name)}
                                            className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 flex items-center justify-between border-2 ${
                                                selectedFormData?.form_name === form.name 
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg scale-[1.02]' 
                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={`p-3.5 rounded-2xl transition-all duration-300 ${
                                                    selectedFormData?.form_name === form.name 
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg' 
                                                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100'
                                                }`}>
                                                    <FileText className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${
                                                        selectedFormData?.form_name === form.name 
                                                            ? 'text-white' 
                                                            : 'text-gray-600 group-hover:text-blue-600'
                                                    }`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-lg truncate text-gray-900 mb-1">{form.name}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                                                            {form.count} {form.count === 1 ? 'entry' : 'entries'}
                                                        </span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(form.last_updated).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${
                                                selectedFormData?.form_name === form.name 
                                                    ? 'rotate-90 text-blue-600' 
                                                    : 'text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1'
                                            }`} />
                                        </button>

                                        {/* Show data below when selected */}
                                        {selectedFormData?.form_name === form.name && (
                                            <div className="mt-4 rounded-2xl overflow-hidden bg-white border-2 border-blue-300 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-white flex items-center gap-2.5">
                                                            <div className="p-1.5 bg-white/20 rounded-lg">
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="text-lg">Form Data</span>
                                                        </h4>
                                                        <span className="text-xs text-white/80 bg-white/20 px-3 py-1.5 rounded-full font-medium">
                                                            {selectedFormData.data?.length || 0} {selectedFormData.data?.length === 1 ? 'record' : 'records'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {loadingFormData ? (
                                                    <SkeletonTable columns={4} label="Loading form data…" className="p-4" />
                                                ) : (
                                                    <div className="bg-gradient-to-b from-gray-50 to-white">
                                                        {renderFormData(selectedFormData.data)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center p-12 rounded-2xl bg-white border-2 border-dashed border-gray-300 max-w-md">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-base text-gray-900 font-semibold mb-2">No forms submitted</p>
                                    <p className="text-sm text-gray-500">This user hasn't submitted any data for the current typhoon yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
