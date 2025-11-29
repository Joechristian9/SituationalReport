import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, Download, FileText, Plus, StopCircle, Trash2, Loader2, Cloud, Calendar, User, AlertTriangle, MoreVertical, Eye, Search, ChevronLeft, ChevronRight, Pause, Play, FileDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import RowsPerPage from '@/Components/ui/RowsPerPage';

export default function TyphoonManagement({ typhoons, activeTyphoon }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTyphoon, setSelectedTyphoon] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedYear, setSelectedYear] = useState('all');
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    // Get unique years from typhoons
    const availableYears = useMemo(() => {
        const years = new Set();
        typhoons.forEach(typhoon => {
            const year = new Date(typhoon.started_at).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a); // Sort descending
    }, [typhoons]);

    // Memoized search suggestions for performance
    const suggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const query = searchQuery.toLowerCase();
        const suggestionSet = new Set();
        
        typhoons.forEach(typhoon => {
            if (typhoon.name.toLowerCase().includes(query)) {
                suggestionSet.add(typhoon.name);
            }
            if (typhoon.creator?.name.toLowerCase().includes(query)) {
                suggestionSet.add(typhoon.creator.name);
            }
            if (typhoon.ender?.name?.toLowerCase().includes(query)) {
                suggestionSet.add(typhoon.ender.name);
            }
        });
        
        return Array.from(suggestionSet).slice(0, 5);
    }, [searchQuery, typhoons]);

    // Memoized filtered typhoons
    const filteredTyphoons = useMemo(() => {
        let filtered = typhoons;

        // Filter by year
        if (selectedYear !== 'all') {
            filtered = filtered.filter(typhoon => {
                const year = new Date(typhoon.started_at).getFullYear();
                return year === parseInt(selectedYear);
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(typhoon => 
                typhoon.name.toLowerCase().includes(query) ||
                typhoon.description?.toLowerCase().includes(query) ||
                typhoon.creator?.name.toLowerCase().includes(query) ||
                typhoon.ender?.name?.toLowerCase().includes(query) ||
                typhoon.status.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [searchQuery, selectedYear, typhoons]);

    // Memoized pagination calculations
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredTyphoons.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTyphoons = filteredTyphoons.slice(startIndex, endIndex);
        
        return { totalPages, startIndex, endIndex, paginatedTyphoons };
    }, [filteredTyphoons, currentPage, itemsPerPage]);

    // Reset to page 1 when search, year filter, or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, itemsPerPage]);

    // Keyboard shortcuts for better UX
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('input[type="text"][placeholder*="Search"]')?.focus();
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                if (showSuggestions) setShowSuggestions(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showSuggestions]);

    // Optimized handlers with useCallback
    const handleCreateTyphoon = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Typhoon name is required');
            return;
        }
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating typhoon report...');

        try {
            const response = await axios.post('/typhoons', formData);
            toast.success(response.data.message, { id: loadingToast });
            setIsCreateModalOpen(false);
            setFormData({ name: '', description: '' });
            router.reload({ only: ['typhoons', 'activeTyphoon'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create typhoon report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData]);

    const handleEndTyphoon = useCallback(async () => {
        if (!selectedTyphoon) return;
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Ending typhoon report and generating PDF...');

        try {
            const response = await axios.post(`/typhoons/${selectedTyphoon.id}/end`);
            toast.success(response.data.message, { id: loadingToast });
            setIsEndModalOpen(false);
            setSelectedTyphoon(null);
            router.reload({ only: ['typhoons', 'activeTyphoon'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to end typhoon report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTyphoon]);

    const handlePauseTyphoon = useCallback(async () => {
        if (!selectedTyphoon) return;
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Pausing typhoon report...');

        try {
            const response = await axios.post(`/typhoons/${selectedTyphoon.id}/pause`);
            setIsPauseModalOpen(false);
            setSelectedTyphoon(null);
            router.reload({ 
                only: ['typhoons', 'activeTyphoon'],
                onSuccess: () => {
                    toast.success(response.data.message, { id: loadingToast });
                }
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to pause typhoon report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTyphoon]);

    const handleResumeTyphoon = useCallback(async () => {
        if (!selectedTyphoon) return;
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Resuming typhoon report...');

        try {
            const response = await axios.post(`/typhoons/${selectedTyphoon.id}/resume`);
            setIsResumeModalOpen(false);
            setSelectedTyphoon(null);
            router.reload({ 
                only: ['typhoons', 'activeTyphoon'],
                onSuccess: () => {
                    toast.success(response.data.message, { id: loadingToast });
                }
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resume typhoon report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTyphoon]);

    const handleDownloadSnapshot = async (typhoon) => {
        window.open(`/typhoons/${typhoon.id}/snapshot`, '_blank');
    };

    const openDeleteModal = useCallback((typhoon) => {
        setSelectedTyphoon(typhoon);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDeleteTyphoon = useCallback(async () => {
        if (!selectedTyphoon) return;
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Deleting typhoon report...');

        try {
            const response = await axios.delete(`/typhoons/${selectedTyphoon.id}`);
            toast.success(response.data.message, { id: loadingToast });
            setIsDeleteModalOpen(false);
            setSelectedTyphoon(null);
            router.reload({ only: ['typhoons'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete typhoon report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTyphoon]);

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
            <Toaster position="top-right" richColors />
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
                                            {activeTyphoon.status === 'paused' ? (
                                                <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
                                                    <Pause className="w-3 h-3 mr-1" />
                                                    Paused
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-green-600 hover:bg-green-700 text-white animate-pulse">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            )}
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
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {activeTyphoon.status === 'active' && (
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedTyphoon(activeTyphoon);
                                                            setIsPauseModalOpen(true);
                                                        }}
                                                        variant="outline"
                                                        className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                        Pause Report
                                                    </Button>
                                                )}
                                                {activeTyphoon.status === 'paused' && (
                                                    <>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedTyphoon(activeTyphoon);
                                                                setIsResumeModalOpen(true);
                                                            }}
                                                            variant="outline"
                                                            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                            Resume Report
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDownloadSnapshot(activeTyphoon)}
                                                            variant="outline"
                                                            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <FileDown className="w-4 h-4" />
                                                            Download Snapshot
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    onClick={() => {
                                                        setSelectedTyphoon(activeTyphoon);
                                                        setIsEndModalOpen(true);
                                                    }}
                                                    variant="destructive"
                                                    className="flex items-center gap-2"
                                                >
                                                    <StopCircle className="w-4 h-4" />
                                                    End Report
                                                </Button>
                                            </div>
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
                        <Card className="border-0 shadow-none">
                            <CardHeader className="px-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            <CardTitle className="text-blue-700">Typhoon Reports History</CardTitle>
                                        </div>
                                        <CardDescription className="mt-1">
                                            View all typhoon reports and their status
                                        </CardDescription>
                                    </div>
                                    {typhoons.length > 0 && (
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            {/* Year Filter */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                                                    onBlur={() => setTimeout(() => setShowYearDropdown(false), 200)}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-blue-200 bg-white rounded-md hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors min-w-[140px]"
                                                >
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                    <span className="text-slate-700 flex-1 text-left">
                                                        {selectedYear === 'all' ? 'All Years' : selectedYear}
                                                    </span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className={`h-4 w-4 text-slate-500 transition-transform ${
                                                            showYearDropdown ? 'rotate-180' : ''
                                                        }`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </button>

                                                {showYearDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="absolute left-0 mt-2 w-48 bg-white border border-blue-200 rounded-lg shadow-lg z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setSelectedYear('all');
                                                                setShowYearDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                                                selectedYear === 'all'
                                                                    ? 'text-blue-600 font-semibold bg-blue-50'
                                                                    : 'text-slate-700'
                                                            }`}
                                                        >
                                                            <span>All Years</span>
                                                            {selectedYear === 'all' && (
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4 text-blue-600"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        {availableYears.map(year => {
                                                            const count = typhoons.filter(t => new Date(t.started_at).getFullYear() === year).length;
                                                            return (
                                                                <button
                                                                    key={year}
                                                                    onClick={() => {
                                                                        setSelectedYear(year.toString());
                                                                        setShowYearDropdown(false);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                                                        selectedYear === year.toString()
                                                                            ? 'text-blue-600 font-semibold bg-blue-50'
                                                                            : 'text-slate-700'
                                                                    }`}
                                                                >
                                                                    <span>{year}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-500">({count})</span>
                                                                        {selectedYear === year.toString() && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-4 w-4 text-blue-600"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M5 13l4 4L19 7"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Search Box */}
                                            <div className="relative w-full sm:w-64">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search typhoons..."
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(e.target.value);
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    className="pl-10 pr-4 py-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && suggestions.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                                                >
                                                    {suggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => {
                                                                setSearchQuery(suggestion);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Search className="w-3 h-3 text-slate-400" />
                                                                <span>{suggestion}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                    <div className="overflow-x-auto border border-blue-200 rounded-lg shadow-sm">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-700">
                                                <tr className="divide-x divide-blue-500">
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Name</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Status</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide hidden sm:table-cell">Started</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide hidden md:table-cell">Ended</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide hidden lg:table-cell">Created by</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide hidden xl:table-cell">Ended by</th>
                                                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-blue-100 bg-white">
                                                {filteredTyphoons.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Search className="w-8 h-8 text-slate-400" />
                                                                <p>No typhoons found matching "{searchQuery}"</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginationData.paginatedTyphoons.map((typhoon, index) => (
                                                    <motion.tr
                                                        key={typhoon.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                                        className={`hover:bg-blue-50 transition-colors divide-x divide-blue-100 ${
                                                            typhoon.status === 'active' ? 'bg-blue-50/50' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-900">{typhoon.name}</div>
                                                            {typhoon.description && (
                                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{typhoon.description}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <Badge 
                                                                className={
                                                                    typhoon.status === 'active' 
                                                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                                        : typhoon.status === 'paused'
                                                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                                                                }
                                                            >
                                                                {typhoon.status === 'active' ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        Active
                                                                    </span>
                                                                ) : typhoon.status === 'paused' ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <Pause className="w-3 h-3" />
                                                                        Paused
                                                                    </span>
                                                                ) : (
                                                                    'Ended'
                                                                )}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell whitespace-nowrap">
                                                            <div>{format(new Date(typhoon.started_at), 'MMM d, yyyy')}</div>
                                                            <div className="text-xs text-slate-500">{format(new Date(typhoon.started_at), 'h:mm a')}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell whitespace-nowrap">
                                                            {typhoon.ended_at ? (
                                                                <>
                                                                    <div>{format(new Date(typhoon.ended_at), 'MMM d, yyyy')}</div>
                                                                    <div className="text-xs text-slate-500">{format(new Date(typhoon.ended_at), 'h:mm a')}</div>
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                                                            {typhoon.creator?.name || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 hidden xl:table-cell">
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
                                                ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredTyphoons.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
                                        <div className="text-sm text-slate-600">
                                            Showing {paginationData.startIndex + 1} to {Math.min(paginationData.endIndex, filteredTyphoons.length)} of {filteredTyphoons.length} results
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <RowsPerPage
                                                rowsPerPage={itemsPerPage}
                                                setRowsPerPage={(value) => {
                                                    setItemsPerPage(value);
                                                    setCurrentPage(1);
                                                }}
                                                totalRows={filteredTyphoons.length}
                                            />

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                                                        .filter(page => {
                                                            // Show first page, last page, current page, and pages around current
                                                            return page === 1 || 
                                                                   page === paginationData.totalPages || 
                                                                   Math.abs(page - currentPage) <= 1;
                                                        })
                                                        .map((page, index, array) => (
                                                            <React.Fragment key={page}>
                                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                                    <span className="px-2 text-slate-400">...</span>
                                                                )}
                                                                <Button
                                                                    variant={currentPage === page ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`h-8 w-8 p-0 ${
                                                                        currentPage === page 
                                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </React.Fragment>
                                                        ))
                                                    }
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                                                    disabled={currentPage === paginationData.totalPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
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

            {/* Pause Typhoon Modal */}
            <Dialog open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <Pause className="w-5 h-5 text-amber-600" />
                            </div>
                            <DialogTitle className="text-xl text-amber-900">Pause Typhoon Report</DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            Temporarily pause <strong className="text-slate-900">{selectedTyphoon?.name}</strong>. This will:
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-3 py-2">
                        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <StopCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-amber-900">Temporarily disable forms</p>
                                <p className="text-xs text-amber-700">Users cannot input data while paused</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <FileDown className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-blue-900">Download current snapshot</p>
                                <p className="text-xs text-blue-700">You can download a PDF of current data</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <Play className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-green-900">Can be resumed later</p>
                                <p className="text-xs text-green-700">Resume anytime to continue data collection</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsPauseModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePauseTyphoon}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Pausing...
                                </>
                            ) : (
                                <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resume Typhoon Modal */}
            <Dialog open={isResumeModalOpen} onOpenChange={setIsResumeModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-green-100 rounded-full">
                                <Play className="w-5 h-5 text-green-600" />
                            </div>
                            <DialogTitle className="text-xl text-green-900">Resume Typhoon Report</DialogTitle>
                        </div>
                        <DialogDescription className="text-base">
                            Resume <strong className="text-slate-900">{selectedTyphoon?.name}</strong>. This will:
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-3 py-2">
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-green-900">Re-enable all forms</p>
                                <p className="text-xs text-green-700">Users can continue inputting data</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-blue-900">Continue same report</p>
                                <p className="text-xs text-blue-700">All existing data will be preserved</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsResumeModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResumeTyphoon}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resuming...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume Report
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
                                                : selectedTyphoon.status === 'paused'
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : 'bg-slate-600 hover:bg-slate-700 text-white'
                                        }
                                    >
                                        {selectedTyphoon.status === 'active' ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </span>
                                        ) : selectedTyphoon.status === 'paused' ? (
                                            <span className="flex items-center gap-1">
                                                <Pause className="w-3 h-3" />
                                                Paused
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
