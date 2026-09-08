import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { AlertCircle, Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, UserPlus, Users, Shield, Key } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu';
import { toast, Toaster } from 'sonner';
import { Checkbox } from '@/Components/ui/checkbox';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagement({ users, roles, permissions, auth }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        permissions: [],
    });

    // Filter users based on search
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        
        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.roles.some(role => role.toLowerCase().includes(query))
        );
    }, [users, searchQuery]);

    // Pagination
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        return { totalPages, startIndex, endIndex, paginatedUsers };
    }, [filteredUsers, currentPage, itemsPerPage]);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    const handleOpenCreateModal = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'user',
            permissions: [],
        });
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.roles[0] || 'user',
            permissions: user.permissions || [],
        });
        setIsEditModalOpen(true);
    };

    const handleOpenDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSubmitCreate = (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.password_confirmation) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        
        router.post(route('admin.users.store'), formData, {
            onSuccess: () => {
                toast.success('User created successfully');
                setIsCreateModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
                setIsSubmitting(false);
            },
        });
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.password_confirmation) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        
        router.patch(route('admin.users.update', selectedUser.id), formData, {
            onSuccess: () => {
                toast.success('User updated successfully');
                setIsEditModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        setIsSubmitting(true);
        
        router.delete(route('admin.users.destroy', selectedUser.id), {
            onSuccess: () => {
                toast.success('User deleted successfully');
                setIsDeleteModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
                setIsSubmitting(false);
            },
        });
    };

    const handlePermissionToggle = (permissionName) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionName)
                ? prev.permissions.filter(p => p !== permissionName)
                : [...prev.permissions, permissionName]
        }));
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="User Management" />
            <SidebarInset>
                <Toaster position="top-right" />
                
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            User Management
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        
                        {/* Header with Stats and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage system users and their permissions
                                </p>
                            </div>
                            <Button onClick={handleOpenCreateModal}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Admins</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {users.filter(u => u.roles.includes('admin')).length}
                                            </p>
                                        </div>
                                        <Shield className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Regular Users</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {users.filter(u => u.roles.includes('user')).length}
                                            </p>
                                        </div>
                                        <Users className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Users Table */}
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle>User List</CardTitle>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {paginationData.paginatedUsers.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="border-b">
                                                    <tr className="text-left">
                                                        <th className="pb-3 font-medium text-gray-700">Name</th>
                                                        <th className="pb-3 font-medium text-gray-700">Email</th>
                                                        <th className="pb-3 font-medium text-gray-700">Role</th>
                                                        <th className="pb-3 font-medium text-gray-700">Permissions</th>
                                                        <th className="pb-3 font-medium text-gray-700">Created</th>
                                                        <th className="pb-3 font-medium text-gray-700 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {paginationData.paginatedUsers.map((user) => (
                                                        <tr key={user.id} className="hover:bg-gray-50">
                                                            <td className="py-3">
                                                                <span className="font-medium">{user.name}</span>
                                                            </td>
                                                            <td className="py-3 text-gray-600">{user.email}</td>
                                                            <td className="py-3">
                                                                {user.roles.map(role => (
                                                                    <Badge
                                                                        key={role}
                                                                        variant={role === 'admin' ? 'default' : 'secondary'}
                                                                        className="text-xs"
                                                                    >
                                                                        {role}
                                                                    </Badge>
                                                                ))}
                                                            </td>
                                                            <td className="py-3">
                                                                <span className="text-xs text-gray-600">
                                                                    {user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-gray-600">{user.created_at}</td>
                                                            <td className="py-3 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm">
                                                                            Actions
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleOpenEditModal(user)}>
                                                                            <Edit className="w-4 h-4 mr-2" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleOpenDeleteModal(user)}
                                                                            className="text-red-600"
                                                                            disabled={user.id === auth.user.id}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {filteredUsers.length > 0 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                                <div className="text-sm text-gray-600">
                                                    Showing {paginationData.startIndex + 1} to {Math.min(paginationData.endIndex, filteredUsers.length)} of {filteredUsers.length} users
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </Button>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                                                            .filter(page => {
                                                                return (
                                                                    page === 1 ||
                                                                    page === paginationData.totalPages ||
                                                                    Math.abs(page - currentPage) <= 1
                                                                );
                                                            })
                                                            .map((page, index, array) => {
                                                                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                                                
                                                                return (
                                                                    <React.Fragment key={page}>
                                                                        {showEllipsisBefore && (
                                                                            <span className="px-2 text-gray-400">...</span>
                                                                        )}
                                                                        <Button
                                                                            variant={currentPage === page ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => setCurrentPage(page)}
                                                                            className={`h-8 w-8 p-0 ${
                                                                                currentPage === page 
                                                                                    ? 'bg-blue-600 text-white' 
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            {page}
                                                                        </Button>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                                                        disabled={currentPage === paginationData.totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <RowsPerPage 
                                                    value={itemsPerPage}
                                                    onChange={setItemsPerPage}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">No users found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>

            {/* Create User Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmitCreate}>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system. Fill in their details and assign roles and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label>Permissions</Label>
                                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                    {permissions.map(permission => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`permission-${permission.id}`}
                                                checked={formData.permissions.includes(permission.name)}
                                                onCheckedChange={() => handlePermissionToggle(permission.name)}
                                            />
                                            <label
                                                htmlFor={`permission-${permission.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {permission.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update user details. Leave password fields empty to keep the current password.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-password">New Password (optional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Leave empty to keep current password"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="edit-password_confirmation"
                                    type="password"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                    placeholder="Leave empty to keep current password"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label>Permissions</Label>
                                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                    {permissions.map(permission => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-permission-${permission.id}`}
                                                checked={formData.permissions.includes(permission.name)}
                                                onCheckedChange={() => handlePermissionToggle(permission.name)}
                                            />
                                            <label
                                                htmlFor={`edit-permission-${permission.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {permission.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete User Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
