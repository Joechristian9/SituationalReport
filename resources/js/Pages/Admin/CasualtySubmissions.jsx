import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Calendar, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function CasualtySubmissions({ casualties, users, filters, auth }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(route('admin.casualties.submissions'), {
            search: searchQuery,
            user_id: selectedUser,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        setSelectedUser('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.casualties.submissions'));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
        } catch {
            return dateString;
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Casualty Submissions" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-red-700">
                            Casualty Submissions
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        
                        {/* Back Button and Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <Link href={route('admin.dashboard')}>
                                    <Button variant="ghost" size="sm" className="mb-2">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                </Link>
                                <h2 className="text-2xl font-bold text-gray-900">Casualty Submissions</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    View who submitted casualty records and when
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Filters</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label htmlFor="search">Search</Label>
                                        <div className="relative mt-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="search"
                                                type="text"
                                                placeholder="Name, address, cause..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="user">Submitted By</Label>
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="All users" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All users</SelectItem>
                                                {users.map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} {user.office && `(${user.office})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="date_from">Date From</Label>
                                        <Input
                                            id="date_from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="date_to">Date To</Label>
                                        <Input
                                            id="date_to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleFilter}>
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={handleReset}>
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Casualties ({casualties.total} records)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {casualties.data.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="border-b">
                                                    <tr className="text-left">
                                                        <th className="pb-3 font-medium text-gray-700">Name</th>
                                                        <th className="pb-3 font-medium text-gray-700">Age</th>
                                                        <th className="pb-3 font-medium text-gray-700">Sex</th>
                                                        <th className="pb-3 font-medium text-gray-700">Address</th>
                                                        <th className="pb-3 font-medium text-gray-700">Cause of Death</th>
                                                        <th className="pb-3 font-medium text-gray-700">Submitted By</th>
                                                        <th className="pb-3 font-medium text-gray-700">Date Submitted</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {casualties.data.map((casualty) => (
                                                        <motion.tr
                                                            key={casualty.id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="py-3">
                                                                <span className="font-medium">{casualty.name || 'N/A'}</span>
                                                            </td>
                                                            <td className="py-3 text-gray-600">{casualty.age || 'N/A'}</td>
                                                            <td className="py-3 text-gray-600">{casualty.sex || 'N/A'}</td>
                                                            <td className="py-3 text-gray-600 max-w-xs truncate">
                                                                {casualty.address || 'N/A'}
                                                            </td>
                                                            <td className="py-3 text-gray-600 max-w-xs truncate">
                                                                {casualty.cause_of_death || 'N/A'}
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4 text-gray-400" />
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">
                                                                            {casualty.user?.name || 'Unknown'}
                                                                        </div>
                                                                        {casualty.user?.office && (
                                                                            <div className="text-xs text-gray-500">
                                                                                {casualty.user.office}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2 text-gray-600">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    {formatDate(casualty.created_at)}
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {casualties.last_page > 1 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                                <div className="text-sm text-gray-600">
                                                    Showing {casualties.from} to {casualties.to} of {casualties.total} records
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Link href={casualties.prev_page_url} preserveState>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!casualties.prev_page_url}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                    </Link>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: casualties.last_page }, (_, i) => i + 1)
                                                            .filter(page => {
                                                                return (
                                                                    page === 1 ||
                                                                    page === casualties.last_page ||
                                                                    Math.abs(page - casualties.current_page) <= 1
                                                                );
                                                            })
                                                            .map((page, index, array) => {
                                                                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                                                
                                                                return (
                                                                    <React.Fragment key={page}>
                                                                        {showEllipsisBefore && (
                                                                            <span className="px-2 text-gray-400">...</span>
                                                                        )}
                                                                        <Link 
                                                                            href={casualties.links[page]?.url} 
                                                                            preserveState
                                                                        >
                                                                            <Button
                                                                                variant={casualties.current_page === page ? "default" : "outline"}
                                                                                size="sm"
                                                                                className={`h-8 w-8 p-0 ${
                                                                                    casualties.current_page === page 
                                                                                        ? 'bg-blue-600 text-white' 
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                {page}
                                                                            </Button>
                                                                        </Link>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                    </div>

                                                    <Link href={casualties.next_page_url} preserveState>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!casualties.next_page_url}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">No casualty records found</p>
                                        {(filters.search || filters.user_id || filters.date_from || filters.date_to) && (
                                            <Button variant="link" onClick={handleReset} className="mt-2">
                                                Clear filters
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
