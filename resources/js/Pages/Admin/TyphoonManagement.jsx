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
import { AlertCircle, CheckCircle, Download, FileText, Plus, StopCircle, Trash2, Loader2, Cloud, Calendar, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function TyphoonManagement({ typhoons, activeTyphoon }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
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

    const handleDeleteTyphoon = async (typhoon) => {
        if (!confirm('Are you sure you want to delete this typhoon report? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await axios.delete(`/typhoons/${typhoon.id}`);
            toast.success(response.data.message);
            router.reload();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete typhoon report');
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
                                            <Badge className="bg-blue-600 hover:bg-blue-700 animate-pulse">
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
                            <CardContent>
                                <div className="space-y-4">
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
                                    typhoons.map((typhoon) => (
                                        <Card key={typhoon.id} className={typhoon.status === 'active' ? 'border-blue-300' : ''}>
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-lg font-semibold">{typhoon.name}</h3>
                                                            <Badge variant={typhoon.status === 'active' ? 'default' : 'secondary'}>
                                                                {typhoon.status === 'active' ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    'Ended'
                                                                )}
                                                            </Badge>
                                                        </div>
                                                        {typhoon.description && (
                                                            <p className="text-sm text-gray-600 mb-2">{typhoon.description}</p>
                                                        )}
                                                        <div className="text-xs text-gray-500 space-y-1">
                                                            <p>Started: {format(new Date(typhoon.started_at), 'PPP p')}</p>
                                                            {typhoon.ended_at && (
                                                                <p>Ended: {format(new Date(typhoon.ended_at), 'PPP p')}</p>
                                                            )}
                                                            <p>Created by: {typhoon.creator?.name}</p>
                                                            {typhoon.ender && (
                                                                <p>Ended by: {typhoon.ender?.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {typhoon.status === 'ended' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDownloadPdf(typhoon)}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                {typhoon.pdf_path ? 'Download PDF' : 'Generate & Download'}
                                                            </Button>
                                                        )}
                                                        {typhoon.status === 'ended' && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDeleteTyphoon(typhoon)}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
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
            </SidebarInset>
        </SidebarProvider>
    );
}
