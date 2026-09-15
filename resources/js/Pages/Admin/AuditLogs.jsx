import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Filter, Download, Eye, Calendar, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import { toast, Toaster } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function AuditLogs({ logs, filters, filterOptions }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || 'all');
    const [selectedAction, setSelectedAction] = useState(filters.action || 'all');
    const [selectedModule, setSelectedModule] = useState(filters.module || 'all');
    const [selectedDisaster, setSelectedDisaster] = useState(filters.disaster_id || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [itemsPerPage, setItemsPerPage] = useState(filters.per_page || 25);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [logDetails, setLogDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Handle filter change and reload data
    const handleFilterChange = () => {
        router.get('/admin/audit-logs', {
            search: searchQuery,
            user_id: selectedUser === 'all' ? '' : selectedUser,
            action: selectedAction === 'all' ? '' : selectedAction,
            module: selectedModule === 'all' ? '' : selectedModule,
            disaster_id: selectedDisaster === 'all' ? '' : selectedDisaster,
            start_date: startDate,
            end_date: endDate,
            per_page: itemsPerPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedUser('all');
        setSelectedAction('all');
        setSelectedModule('all');
        setSelectedDisaster('all');
        setStartDate('');
        setEndDate('');
        router.get('/admin/audit-logs', { per_page: itemsPerPage });
    };

    // View details
    const handleViewDetails = async (log) => {
        setSelectedLog(log);
        setDetailModalOpen(true);
        setLoadingDetails(true);

        try {
            const response = await axios.get(`/admin/audit-logs/${log.id}`);
            setLogDetails(response.data);
        } catch (error) {
            toast.error('Failed to load audit log details');
            console.error(error);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Export to Excel
    const handleExport = async () => {
        try {
            toast.info('Preparing export...');
            const response = await axios.post('/admin/audit-logs/export', {
                search: searchQuery,
                user_id: selectedUser === 'all' ? '' : selectedUser,
                action: selectedAction === 'all' ? '' : selectedAction,
                module: selectedModule === 'all' ? '' : selectedModule,
                disaster_id: selectedDisaster === 'all' ? '' : selectedDisaster,
                start_date: startDate,
                end_date: endDate,
            }, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Export completed successfully');
        } catch (error) {
            toast.error('Export failed');
            console.error(error);
        }
    };

    // Get action badge color
    const getActionBadgeColor = (action) => {
        const colors = {
            created: 'bg-green-100 text-green-800',
            updated: 'bg-blue-100 text-blue-800',
            deleted: 'bg-red-100 text-red-800',
            login: 'bg-purple-100 text-purple-800',
            logout: 'bg-gray-100 text-gray-800',
            failed_login: 'bg-orange-100 text-orange-800',
            exported: 'bg-indigo-100 text-indigo-800',
            password_changed: 'bg-yellow-100 text-yellow-800',
            permission_changed: 'bg-pink-100 text-pink-800',
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Audit Logs" />
            <SidebarInset>
                <Toaster position="top-right" />
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            Audit Logs
                        </h1>
                    </div>
                </header>

                <div className="flex flex-col gap-4 p-4">
                    {/* Filters Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Search</label>
                                    <Input
                                        placeholder="Search logs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                                    />
                                </div>

                                {/* User Filter */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">User</label>
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {filterOptions.users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Action Filter */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Action</label>
                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            {filterOptions.actions.map((action) => (
                                                <SelectItem key={action.value} value={action.value}>
                                                    {action.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Module Filter */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Module</label>
                                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Modules" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Modules</SelectItem>
                                            {filterOptions.modules.map((module) => (
                                                <SelectItem key={module.value} value={module.value}>
                                                    {module.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Disaster Filter */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Disaster</label>
                                    <Select value={selectedDisaster} onValueChange={setSelectedDisaster}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Disasters" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Disasters</SelectItem>
                                            {filterOptions.disasters.map((disaster) => (
                                                <SelectItem key={disaster.id} value={disaster.id.toString()}>
                                                    {disaster.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Start Date */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                {/* End Date */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                {/* Items Per Page */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Per Page</label>
                                    <RowsPerPage
                                        value={itemsPerPage}
                                        onChange={setItemsPerPage}
                                        options={[10, 25, 50, 100]}
                                    />
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleFilterChange} className="flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Apply Filters
                                </Button>
                                <Button onClick={handleResetFilters} variant="outline" className="flex items-center gap-2">
                                    Clear Filters
                                </Button>
                                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 ml-auto">
                                    <Download className="w-4 h-4" />
                                    Export
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audit Logs Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Audit Logs
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({logs.total} records)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Module</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Disaster</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                                    No audit logs found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.data.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{log.created_at}</span>
                                                            <span className="text-xs text-gray-500">{log.created_at_human}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{log.user.name}</span>
                                                            <span className="text-xs text-gray-500">{log.user.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getActionBadgeColor(log.action)}>
                                                            {log.action_name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{log.module}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.auditable_id && (
                                                            <span className="text-sm text-gray-600">
                                                                #{log.auditable_id}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.disaster?.name && (
                                                            <span className="text-sm">{log.disaster.name}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-gray-600">{log.ip_address}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(log)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {logs.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {logs.from} to {logs.to} of {logs.total} records
                                    </div>
                                    <div className="flex gap-2">
                                        {logs.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url)}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Modal - Enhanced with field highlighting */}
                <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                Audit Log Details
                            </DialogTitle>
                            <DialogDescription>
                                Complete audit trail with before/after changes
                            </DialogDescription>
                        </DialogHeader>
                        
                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <p className="text-sm text-gray-500">Loading details...</p>
                                </div>
                            </div>
                        ) : logDetails ? (
                            <div className="space-y-6">
                                {/* Log Summary Card */}
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Action</p>
                                                <Badge className={getActionBadgeColor(logDetails.log.action)}>
                                                    {logDetails.log.action_name}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Module</p>
                                                <p className="text-sm font-medium">{logDetails.log.module}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">User</p>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium">{logDetails.log.user.name}</p>
                                                        <p className="text-xs text-gray-600">{logDetails.log.user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Timestamp</p>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium">{logDetails.log.created_at}</p>
                                                        <p className="text-xs text-gray-600">{logDetails.log.created_at_human}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {logDetails.log.disaster && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Disaster</p>
                                                    <p className="text-sm font-medium">{logDetails.log.disaster.name}</p>
                                                </div>
                                            )}
                                            {logDetails.log.auditable_id && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Target ID</p>
                                                    <p className="text-sm font-medium">#{logDetails.log.auditable_id}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">IP Address</p>
                                                <p className="text-sm font-medium font-mono">{logDetails.log.ip_address}</p>
                                            </div>
                                            {logDetails.log.user_agent && (
                                                <div className="col-span-2">
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">User Agent</p>
                                                    <p className="text-xs text-gray-600 font-mono break-all">{logDetails.log.user_agent}</p>
                                                </div>
                                            )}
                                            {logDetails.log.description && (
                                                <div className="col-span-2">
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                                                    <p className="text-sm text-gray-700">{logDetails.log.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Changes Section */}
                                {logDetails.changes && logDetails.changes.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Activity className="w-5 h-5 text-blue-600" />
                                            <h4 className="font-semibold text-lg">
                                                {logDetails.log.action === 'updated' ? 'Field Changes' : 
                                                 logDetails.log.action === 'created' ? 'Created Values' : 
                                                 'Deleted Values'}
                                            </h4>
                                            <Badge variant="outline" className="ml-auto">
                                                {logDetails.changes.length} {logDetails.changes.length === 1 ? 'field' : 'fields'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            {logDetails.changes.map((change, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <Card className="border-l-4 border-l-blue-500">
                                                        <CardContent className="pt-4">
                                                            <p className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                {change.field}
                                                            </p>
                                                            
                                                            {change.old_value !== undefined ? (
                                                                /* Updated field - show before/after */
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                                                        <p className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                                            Before
                                                                        </p>
                                                                        <p className="text-sm text-red-900 font-mono break-words">
                                                                            {change.old_value || <span className="text-gray-400 italic">(empty)</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                                                        <p className="text-xs font-semibold text-green-700 uppercase mb-2 flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                            After
                                                                        </p>
                                                                        <p className="text-sm text-green-900 font-mono break-words">
                                                                            {change.new_value || <span className="text-gray-400 italic">(empty)</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Created or deleted field - show single value */
                                                                <div className={`${logDetails.log.action === 'created' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-md p-3`}>
                                                                    <p className={`text-xs font-semibold uppercase mb-2 flex items-center gap-1 ${logDetails.log.action === 'created' ? 'text-green-700' : 'text-red-700'}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${logDetails.log.action === 'created' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                        {logDetails.log.action === 'created' ? 'Created Value' : 'Deleted Value'}
                                                                    </p>
                                                                    <p className={`text-sm font-mono break-words ${logDetails.log.action === 'created' ? 'text-green-900' : 'text-red-900'}`}>
                                                                        {change.value || <span className="text-gray-400 italic">(empty)</span>}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No changes message */}
                                {(!logDetails.changes || logDetails.changes.length === 0) && (
                                    <Card className="bg-gray-50 border-gray-200">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                                <Activity className="w-12 h-12 mb-3 opacity-30" />
                                                <p className="text-sm">No field changes recorded for this action</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
