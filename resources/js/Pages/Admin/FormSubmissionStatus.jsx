import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, ChevronLeft, ChevronRight, Eye, FileText, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import axios from 'axios';

export default function FormSubmissionStatus({ users, activeTyphoon }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFormData, setSelectedFormData] = useState(null);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const itemsPerPage = 10;

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
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 text-sm font-medium">No data available</p>
                </div>
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
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <TableHead className="text-xs font-bold text-gray-700 py-4 px-6">#</TableHead>
                            {keys.map(key => (
                                <TableHead key={key} className="text-xs font-bold text-gray-700 py-4 px-6 whitespace-nowrap">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow 
                                key={idx} 
                                className={`transition-colors hover:bg-blue-50 ${
                                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                            >
                                <TableCell className="text-xs py-4 px-6 font-semibold text-gray-500">
                                    {idx + 1}
                                </TableCell>
                                {keys.map(key => (
                                    <TableCell key={key} className="text-sm py-4 px-6 text-gray-700">
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
        if (hasSubmitted) {
            return (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-4 h-4" />
                    Submitted
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1 w-fit">
                <XCircle className="w-4 h-4" />
                Not Submitted
            </Badge>
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
        
        return (
            <div className="flex flex-wrap gap-1.5">
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

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return sortedUsers;
        
        const query = searchQuery.toLowerCase();
        return sortedUsers.filter(user => 
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            formatPermissions(user.permissions).toLowerCase().includes(query)
        );
    }, [sortedUsers, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head>
                <title>Form Submission Status</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumbs
                            crumbs={[
                                { label: "Admin" },
                                { label: "Form Submission Status" },
                            ]}
                        />
                    </div>
                </header>

                <main className="w-full p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Submission Status</h1>
                                    {activeTyphoon ? (
                                        <p className="text-gray-600">
                                            Monitoring form submissions for <span className="font-semibold text-blue-600">{activeTyphoon.name}</span>
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg inline-flex">
                                            <AlertCircle className="w-5 h-5" />
                                            <span>No active typhoon - showing all users</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {users.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name, email, or assigned forms..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                {searchQuery && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchQuery('')}
                                        className="whitespace-nowrap"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Users Table */}
                        {users.length > 0 ? (
                            <>
                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="w-12 font-semibold">#</TableHead>
                                                    <TableHead className="font-semibold">Name</TableHead>
                                                    <TableHead className="font-semibold">Email</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Assigned Forms</TableHead>
                                                    <TableHead className="font-semibold">Last Submission</TableHead>
                                                    <TableHead className="font-semibold text-center">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedUsers.length > 0 ? (
                                                    paginatedUsers.map((user, index) => (
                                                        <TableRow key={user.id} className="hover:bg-gray-50">
                                                            <TableCell className="font-medium text-gray-500">
                                                                {startIndex + index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {user.name}
                                                            </TableCell>
                                                            <TableCell className="text-gray-600">
                                                                {user.email}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(user.has_submitted)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {renderAssignedForms(user)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {user.last_submission ? (
                                                                    <span className="text-sm text-gray-600">
                                                                        {new Date(user.last_submission).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400 italic">No submissions yet</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {user.has_submitted ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleViewDetails(user)}
                                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-1" />
                                                                        View
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">-</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                            No users found matching "{searchQuery}"
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Pagination */}
                                {filteredUsers.length > itemsPerPage && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(page)}
                                                        className="w-10"
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-700 mb-1">No Users Found</h3>
                                    <p className="text-sm text-gray-500">
                                        There are no users with form access permissions
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </SidebarInset>

            {/* User Details Sheet */}
            <Sheet open={isModalOpen} onOpenChange={closeModal}>
                <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-4xl p-0 flex flex-col bg-white border-l border-gray-200 shadow-2xl"
                >
                    <SheetHeader className="px-8 pt-8 pb-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                        <div className="flex items-start justify-between">
                            <div>
                                <SheetTitle className="text-2xl font-bold text-gray-900 mb-2">{selectedUser?.name}</SheetTitle>
                                <SheetDescription className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {activeTyphoon?.name}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span>{selectedUser?.submitted_forms?.length || 0} forms submitted</span>
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-gray-50 to-white">
                        {selectedUser?.submitted_forms && selectedUser.submitted_forms.length > 0 ? (
                            <div className="space-y-4">
                                {selectedUser.submitted_forms.map((form, idx) => (
                                    <div key={idx} className="group">
                                        <button
                                            onClick={() => handleViewFormData(selectedUser.id, form.table, form.name)}
                                            className={`w-full text-left p-5 rounded-2xl transition-all duration-300 flex items-center justify-between border-2 ${
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
                                                    <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-gray-50 to-white">
                                                        <div className="relative">
                                                            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                                                            <Loader2 className="w-16 h-16 animate-spin text-blue-600 absolute top-0 left-0" />
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-4 font-medium">Loading data...</p>
                                                        <p className="text-xs text-gray-400 mt-1">Please wait</p>
                                                    </div>
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
        </SidebarProvider>
    );
}
