import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { AlertCircle, CheckCircle, Download, FileText, Plus, StopCircle, Trash2, Loader2, Cloud, Calendar, User, AlertTriangle, MoreVertical, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function TyphoonManagement({ typhoons, activeTyphoon }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTyphoon, setSelectedTyphoon] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const handleCreateTyphoon = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/typhoons', formData);
            toast.success(response.data.message);
            router.reload();
            setIsCreateModalOpen(false);
            setFormData({ name: '', description: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create typhoon report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEndTyphoon = async () => {
        if (!selectedTyphoon) return;
        setIsSubmitting(true);

        try {
            const response = await axios.post(`/typhoons/${selectedTyphoon.id}/end`);
            toast.success(response.data.message);
            router.reload();
            setIsEndModalOpen(false);
            setSelectedTyphoon(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to end typhoon report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (typhoon) => {
        setSelectedTyphoon(typhoon);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteTyphoon = async () => {
        if (!selectedTyphoon) return;
        setIsSubmitting(true);

        try {
            const response = await axios.delete(`/typhoons/${selectedTyphoon.id}`);
            toast.success(response.data.message);
            router.reload();
            setIsDeleteModalOpen(false);
            setSelectedTyphoon(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete typhoon report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPdf = async (typhoon) => {
        // If PDF doesn't exist, generate it first
        if (!typhoon.pdf_path) {
            setIsSubmitting(true);
            toast.loading('Generating PDF report...');
            try {
                const response = await axios.post(`/typhoons/${typhoon.id}/regenerate-pdf`);
                toast.dismiss();
                toast.success('PDF generated successfully!');
                router.reload();
                // After reload, the download button will be available
                return;
            } catch (error) {
                toast.dismiss();
                toast.error(error.response?.data?.message || 'Failed to generate PDF');
                setIsSubmitting(false);
                return;
            }
        }

        // PDF exists, download it
        try {
            window.open(`/typhoons/${typhoon.id}/download`, '_blank');
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Typhoon Management" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            Typhoon Management
                        </h1>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!!activeTyphoon}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                        title={activeTyphoon ? "End the active typhoon before creating a new one" : "Create a new typhoon report"}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create New Typhoon Report</span>
                        <span className="sm:hidden">New Report</span>
                    </Button>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                    
                    {/* Active Typhoon Alert */}
                    <AnimatePresence>
                        {activeTyphoon && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-600 rounded-full">
                                                    <Cloud className="w-5 h-5 text-white" />
                                                </div>
                                                <CardTitle className="text-blue-900">Active Typhoon Report</CardTitle>
                                            </div>
                                            <Badge className="bg-green-600 hover:bg-green-700 text-white animate-pulse">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Active
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-blue-900 mb-2">{activeTyphoon.name}</h3>
                                                {activeTyphoon.description && (
                                                    <p className="text-sm text-blue-700 bg-white/50 p-3 rounded-md">{activeTyphoon.description}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2 text-blue-700 bg-white/50 p-2 rounded">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-xs">
                                                        Started: {format(new Date(activeTyphoon.started_at), 'PPP p')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-blue-700 bg-white/50 p-2 rounded">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-xs">
                                                        Created by: {activeTyphoon.creator?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelectedTyphoon(activeTyphoon);
                                                    setIsEndModalOpen(true);
                                                }}
                                                variant="destructive"
                                                className="w-full sm:w-auto mt-2 flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                            >
                                                <StopCircle className="w-4 h-4" />
                                                End This Typhoon Report
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Typhoon History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="border-slate-200">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                    <CardTitle>Typhoon Reports History</CardTitle>
                                </div>
                                <CardDescription>
                                    View all typhoon reports and their status
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {typhoons.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                            <Cloud className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Typhoon Reports Yet</h3>
                                        <p className="text-sm text-slate-500 mb-4">Create your first typhoon report to get started with data collection</p>
                                        <Button 
                                            onClick={() => setIsCreateModalOpen(true)}
                                            variant="outline"
                                            className="flex items-center gap-2 mx-auto"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create First Report
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Typhoon Name</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Started</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ended</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created by</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ended by</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {typhoons.map((typhoon, index) => (
                                                    <motion.tr
                                                        key={typhoon.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                                        className={`hover:bg-slate-50 transition-colors ${
                                                            typhoon.status === 'active' ? 'bg-blue-50/30' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-900">{typhoon.name}</div>
                                                            {typhoon.description && (
                                                                <div className="text-xs text-slate-500 mt-1">{typhoon.description}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge 
                                                                className={
                                                                    typhoon.status === 'active' 
                                                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                                                                }
                                                            >
                                                                {typhoon.status === 'active' ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    'Ended'
                                                                )}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {format(new Date(typhoon.started_at), 'MMM d, yyyy')}<br />
                                                            <span className="text-xs text-slate-500">{format(new Date(typhoon.started_at), 'h:mm a')}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {typhoon.ended_at ? (
                                                                <>
                                                                    {format(new Date(typhoon.ended_at), 'MMM d, yyyy')}<br />
                                                                    <span className="text-xs text-slate-500">{format(new Date(typhoon.ended_at), 'h:mm a')}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {typhoon.creator?.name || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">
                                                            {typhoon.ender?.name || '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 hover:bg-slate-100"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setSelectedTyphoon(typhoon);
                                                                                setIsViewModalOpen(true);
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        {typhoon.status === 'ended' && (
                                                                            <>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleDownloadPdf(typhoon)}
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    <Download className="w-4 h-4 mr-2" />
                                                                                    Download PDF
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => openDeleteModal(typhoon)}
                                                                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                                    Delete Report
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                    </Card>
                    </motion.div>
                    </div>
                </div>

            {/* Create Typhoon Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Cloud className="w-5 h-5 text-blue-600" />
                            </div>
                            <DialogTitle className="text-xl">Create New Typhoon Report</DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            Enter the typhoon details. Once created, all forms will be enabled for users to input data.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTyphoon}>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">
                                    Typhoon Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Kristine, Leon, Marce"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-11"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold">
                                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Additional details about the typhoon (e.g., expected landfall, severity level...)"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    disabled={isSubmitting}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setFormData({ name: '', description: '' });
                                }}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Typhoon Report
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* End Typhoon Modal */}
            <Dialog open={isEndModalOpen} onOpenChange={setIsEndModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <DialogTitle className="text-xl text-red-900">End Typhoon Report</DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            Are you sure you want to end <strong className="text-slate-900">{selectedTyphoon?.name}</strong>? This action will:
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-3 py-2">
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <StopCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-red-900">Disable all forms</p>
                                <p className="text-xs text-red-700">Users will no longer be able to input data</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-blue-900">Generate PDF report</p>
                                <p className="text-xs text-blue-700">Automatically creates a downloadable PDF with all data</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <CheckCircle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-slate-900">Mark as ended</p>
                                <p className="text-xs text-slate-700">Typhoon status will change from Active to Ended</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-semibold mb-1">Important</p>
                                <p className="text-xs text-amber-800">This action cannot be undone. Make sure all data has been collected before proceeding.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsEndModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleEndTyphoon}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Ending & Generating PDF...
                                </>
                            ) : (
                                <>
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    End Typhoon Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Typhoon Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Delete Typhoon Report</DialogTitle>
                                <DialogDescription className="mt-1">
                                    This action cannot be undone
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-900 font-medium mb-2">
                                Are you sure you want to delete the typhoon report "{selectedTyphoon?.name}"?
                            </p>
                            <p className="text-sm text-red-700">
                                All associated data including weather reports, evacuation records, casualties, and other related information will be permanently removed.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTyphoon}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Typhoon Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Cloud className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Typhoon Report Details</DialogTitle>
                                <DialogDescription className="mt-1">
                                    Complete information about this typhoon report
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    {selectedTyphoon && (
                        <div className="py-4 space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">{selectedTyphoon.name}</h3>
                                    <Badge 
                                        className={
                                            selectedTyphoon.status === 'active' 
                                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                : 'bg-slate-600 hover:bg-slate-700 text-white'
                                        }
                                    >
                                        {selectedTyphoon.status === 'active' ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </span>
                                        ) : (
                                            'Ended'
                                        )}
                                    </Badge>
                                </div>
                                
                                {selectedTyphoon.description && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 mb-1">Description:</p>
                                        <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                                            {selectedTyphoon.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        <p className="text-xs font-semibold text-slate-600">Started</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {format(new Date(selectedTyphoon.started_at), 'PPP')}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {format(new Date(selectedTyphoon.started_at), 'p')}
                                    </p>
                                </div>

                                {selectedTyphoon.ended_at && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <p className="text-xs font-semibold text-slate-600">Ended</p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {format(new Date(selectedTyphoon.ended_at), 'PPP')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {format(new Date(selectedTyphoon.ended_at), 'p')}
                                        </p>
                                    </div>
                                )}

                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <p className="text-xs font-semibold text-slate-600">Created By</p>
                                    </div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {selectedTyphoon.creator?.name || 'Unknown'}
                                    </p>
                                </div>

                                {selectedTyphoon.ender && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-slate-500" />
                                            <p className="text-xs font-semibold text-slate-600">Ended By</p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {selectedTyphoon.ender.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsViewModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                        {selectedTyphoon?.status === 'ended' && (
                            <Button
                                onClick={() => {
                                    handleDownloadPdf(selectedTyphoon);
                                    setIsViewModalOpen(false);
                                }}
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
