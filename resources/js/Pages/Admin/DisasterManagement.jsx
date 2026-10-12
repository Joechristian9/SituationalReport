import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageTitle from '@/Components/PageTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Clock, Download, FileCheck, FileClock, Plus, StopCircle, Trash2, Loader2, Cloud, Calendar, AlertTriangle, MoreVertical, Eye, Search, ChevronLeft, ChevronRight, Pause, Play, FileDown, Wind, Waves, CloudRain, Mountain, Flame, CloudLightning, CloudSnow, Droplets, Zap } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { differenceInCalendarDays, format, formatDuration, intervalToDuration } from 'date-fns';
import { Skeleton } from '@/Components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
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
import useMediaQuery from '@/hooks/useMediaQuery';
import DisasterLifecycleDialog from '@/Components/DisasterLifecycleDialog';

// Helper function to get icon and color for each disaster type
const getDisasterIcon = (disasterType) => {
    const type = disasterType?.toLowerCase() || '';
    
    if (type.includes('typhoon') || type.includes('cyclone') || type.includes('hurricane')) {
        return { icon: Wind, color: 'from-purple-600 to-indigo-600', textColor: 'text-purple-600' };
    }
    if (type.includes('flood') || type.includes('flash flood')) {
        return { icon: Waves, color: 'from-blue-600 to-cyan-600', textColor: 'text-blue-600' };
    }
    if (type.includes('landslide') || type.includes('mudslide')) {
        return { icon: Mountain, color: 'from-amber-700 to-orange-700', textColor: 'text-amber-700' };
    }
    if (type.includes('earthquake') || type.includes('tremor')) {
        return { icon: Zap, color: 'from-red-600 to-rose-600', textColor: 'text-red-600' };
    }
    if (type.includes('fire') || type.includes('wildfire')) {
        return { icon: Flame, color: 'from-orange-600 to-red-600', textColor: 'text-orange-600' };
    }
    if (type.includes('storm') && type.includes('surge')) {
        return { icon: Waves, color: 'from-teal-600 to-cyan-700', textColor: 'text-teal-600' };
    }
    if (type.includes('tropical') && (type.includes('storm') || type.includes('depression'))) {
        return { icon: CloudRain, color: 'from-sky-600 to-blue-700', textColor: 'text-sky-600' };
    }
    if (type.includes('heavy') && type.includes('rain')) {
        return { icon: CloudRain, color: 'from-indigo-600 to-blue-600', textColor: 'text-indigo-600' };
    }
    if (type.includes('thunderstorm')) {
        return { icon: CloudLightning, color: 'from-yellow-600 to-orange-600', textColor: 'text-yellow-600' };
    }
    if (type.includes('drought')) {
        return { icon: Droplets, color: 'from-yellow-700 to-orange-700', textColor: 'text-yellow-700' };
    }
    if (type.includes('snow') || type.includes('blizzard')) {
        return { icon: CloudSnow, color: 'from-cyan-400 to-blue-500', textColor: 'text-cyan-500' };
    }
    // Default for unspecified or other types
    return { icon: Cloud, color: 'from-slate-600 to-gray-700', textColor: 'text-slate-600' };
};

// Status chip per the design system: tinted token colour + dot + text. Active pulses.
const STATUS_CHIPS = {
    active: { label: 'Active', className: 'border-success/30 bg-success/10 text-success', dot: 'bg-success' },
    paused: { label: 'Paused', className: 'border-warning/30 bg-warning/10 text-warning', dot: 'bg-warning' },
    ended: { label: 'Ended', className: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground/60' },
};

const STATUS_ORDER = { active: 0, paused: 1, ended: 2 };

const DISASTER_SORT = {
    name: (t) => t.name.toLowerCase(),
    type: (t) => (t.disaster_type || '').toLowerCase(),
    status: (t) => STATUS_ORDER[t.status] ?? 3,
    started: (t) => new Date(t.started_at).getTime(),
    ended: (t) => (t.ended_at ? new Date(t.ended_at).getTime() : null),
};

function StatusChip({ status }) {
    const chip = STATUS_CHIPS[status] ?? STATUS_CHIPS.ended;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${chip.className}`}>
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                {status === 'active' && (
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${chip.dot}`} />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${chip.dot}`} />
            </span>
            {chip.label}
        </span>
    );
}

/** "9 days 2 hours" from start to end (or now while it is still running). */
const durationLabel = (startedAt, endedAt) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const parts = intervalToDuration({ start, end });
    const label = formatDuration(parts, { format: ['years', 'months', 'days', 'hours'], delimiter: ' ' });
    return label || formatDuration(parts, { format: ['minutes'] }) || 'Less than a minute';
};

// Impact series colors match the dashboard charts; each tile is also labelled in text.
const SUMMARY_IMPACT = [
    { key: 'dead', label: 'Dead', color: 'var(--viz-dead)' },
    { key: 'injured', label: 'Injured', color: 'var(--viz-injured)' },
    { key: 'missing', label: 'Missing', color: 'var(--viz-missing)' },
];

function SummaryTile({ label, value, sub, color }) {
    return (
        <div className="min-w-0 rounded-lg border border-border bg-card px-2.5 py-2">
            <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />}
                {label}
            </p>
            <p className="text-lg font-semibold leading-tight tabular-nums text-foreground">{value.toLocaleString()}</p>
            {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

/** Totals for one disaster, loaded by the View details dialog (see DisasterSummary on the server). */
function DisasterTotals({ state, onRetry }) {
    if (state?.error) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground" role="alert">
                Couldn't load the totals.
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }
    if (!state?.data) {
        return (
            <div className="grid grid-cols-3 gap-2" aria-busy="true">
                {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-[60px] rounded-lg" />
                ))}
                <span className="sr-only">Loading totals…</span>
            </div>
        );
    }

    const { impact, evacuation, reports } = state.data;
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2" aria-label="Human impact">
                {SUMMARY_IMPACT.map((s) => (
                    <SummaryTile key={s.key} label={s.label} value={impact[s.key]} color={s.color} />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <SummaryTile label="Evacuated" value={evacuation.persons} sub={`${evacuation.families.toLocaleString()} families`} />
                <SummaryTile label="Houses damaged" value={impact.housesDamaged} />
                <SummaryTile
                    label="Reports filed"
                    value={reports.total}
                    sub={`from ${reports.accounts} ${reports.accounts === 1 ? 'account' : 'accounts'}`}
                />
            </div>
        </div>
    );
}

const TILE_LIMIT = 4;

/**
 * Phones and tablets: disaster types as a compact 2-column grid (top four, then "Show all")
 * instead of the one-card carousel. `featureFirst` makes the most recorded type a wide tile.
 */
function TypeTiles({ stats, total, featureFirst = false }) {
    const [showAll, setShowAll] = useState(false);
    const limit = TILE_LIMIT + (featureFirst ? 1 : 0);
    const shown = showAll ? stats : stats.slice(0, limit);

    return (
        <div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {shown.map((stat, index) => {
                    const { icon: Icon } = getDisasterIcon(stat.disaster_type);
                    const pct = total ? (stat.count / total) * 100 : 0;
                    const wide = featureFirst && index === 0;
                    return (
                        <div
                            key={stat.disaster_type}
                            className={`rounded-xl border border-border bg-card p-3 shadow-sm ${wide ? 'col-span-2' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    {wide && (
                                        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Most recorded
                                        </span>
                                    )}
                                    <span className="block truncate text-sm font-medium text-foreground">{stat.disaster_type}</span>
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between gap-2">
                                <span className="text-2xl font-semibold tabular-nums text-foreground">{stat.count}</span>
                                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                    {pct.toFixed(0)}%<span className="sr-only"> of all disasters</span>
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            {stats.length > limit && (
                <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    aria-expanded={showAll}
                    className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-border bg-card text-sm font-medium text-primary shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {showAll ? 'Show fewer' : `Show all ${stats.length} types`}
                </button>
            )}
        </div>
    );
}

export default function DisasterManagement({ typhoons, activeTyphoon, disasterStats, statusCounts }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [lifecycleAction, setLifecycleAction] = useState(null); // 'pause' | 'resume' | 'end'
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTyphoon, setSelectedTyphoon] = useState(null);
    // View details totals, per disaster id: { data } once loaded, { error: true } on failure.
    const [summaries, setSummaries] = useState({});
    const loadSummary = useCallback((id) => {
        setSummaries((prev) => ({ ...prev, [id]: undefined }));
        axios
            .get(route('disasters.summary', id))
            .then(({ data }) => setSummaries((prev) => ({ ...prev, [id]: { data } })))
            .catch(() => setSummaries((prev) => ({ ...prev, [id]: { error: true } })));
    }, []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showAllTypes, setShowAllTypes] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);
    // Disaster-type carousel: one card per slide on phones and tablets, a 2x2 grid on desktop.
    const perSlide = useMediaQuery('(min-width: 1024px)') ? 4 : 1;
    const slideCount = Math.max(1, Math.ceil((disasterStats?.length || 0) / perSlide));
    const slide = Math.min(carouselIndex, slideCount - 1); // stays valid when perSlide changes
    const slideStats = (disasterStats || []).slice(slide * perSlide, slide * perSlide + perSlide);
    const goToSlide = (index) => setCarouselIndex(Math.min(Math.max(0, index), slideCount - 1));
    const [formData, setFormData] = useState({
        name: '',
        disaster_type: '',
        description: '',
    });

    // Reports per start year, newest year first.
    const yearCounts = useMemo(() => {
        const counts = {};
        typhoons.forEach((typhoon) => {
            const year = new Date(typhoon.started_at).getFullYear();
            counts[year] = (counts[year] || 0) + 1;
        });
        return counts;
    }, [typhoons]);
    const availableYears = Object.keys(yearCounts).map(Number).sort((a, b) => b - a);

    const filteredTyphoons = useMemo(() => {
        let filtered = typhoons;

        if (selectedYear !== 'all') {
            filtered = filtered.filter(
                (typhoon) => new Date(typhoon.started_at).getFullYear() === parseInt(selectedYear)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((typhoon) => typhoon.status === statusFilter);
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
    }, [searchQuery, selectedYear, statusFilter, typhoons]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedYear('all');
        setStatusFilter('all');
    };

    const { sorted: sortedTyphoons, sort, toggle: toggleSort } = useTableSort(filteredTyphoons, DISASTER_SORT);

    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(sortedTyphoons.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTyphoons = sortedTyphoons.slice(startIndex, endIndex);

        return { totalPages, startIndex, endIndex, paginatedTyphoons };
    }, [sortedTyphoons, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, statusFilter, itemsPerPage, sort]);

    const chips = [
        selectedYear !== 'all' && { key: 'year', label: `Year: ${selectedYear}`, onRemove: () => setSelectedYear('all') },
        statusFilter !== 'all' && {
            key: 'status',
            label: `Status: ${STATUS_CHIPS[statusFilter]?.label ?? statusFilter}`,
            onRemove: () => setStatusFilter('all'),
        },
    ].filter(Boolean);

    // Ctrl/Cmd + K focuses the search box.
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('disaster-search')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Optimized handlers with useCallback
    const handleCreateTyphoon = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Typhoon name is required');
            return;
        }
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating disaster report...');

        try {
            const response = await axios.post('/admin/disasters', formData);
            toast.success(response.data.message, { id: loadingToast });
            setIsCreateModalOpen(false);
            setFormData({ name: '', disaster_type: '', description: '' });
            router.reload({ only: ['typhoons', 'activeTyphoon'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create disaster report', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData]);

    const handleDownloadSnapshot = async (typhoon) => {
        window.open(`/admin/disasters/${typhoon.id}/snapshot`, '_blank');
    };

    const openDeleteModal = useCallback((typhoon) => {
        setSelectedTyphoon(typhoon);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDeleteTyphoon = useCallback(async () => {
        if (!selectedTyphoon) return;
        
        setIsSubmitting(true);
        const loadingToast = toast.loading('Deleting disaster report...');

        try {
            const response = await axios.delete(`/admin/disasters/${selectedTyphoon.id}`);
            toast.success(response.data.message, { id: loadingToast });
            setIsDeleteModalOpen(false);
            setSelectedTyphoon(null);
            router.reload({ only: ['typhoons'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete disaster report', { id: loadingToast });
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
                const response = await axios.post(`/admin/disasters/${typhoon.id}/regenerate-pdf`);
                toast.dismiss();
                toast.success('PDF generated successfully! Downloading...');
                
                // Automatically download the generated PDF
                setTimeout(() => {
                    window.open(`/admin/disasters/${typhoon.id}/download`, '_blank');
                    router.reload();
                }, 500);
                
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
            window.open(`/admin/disasters/${typhoon.id}/download`, '_blank');
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    const openView = (typhoon) => {
        setSelectedTyphoon(typhoon);
        setIsViewModalOpen(true);
        // Ended disasters no longer change, so their totals are fetched once.
        if (typhoon.status !== 'ended' || !summaries[typhoon.id]?.data) loadSummary(typhoon.id);
    };

    // One actions menu for the phone cards and the table rows.
    const renderRowMenu = (typhoon) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 p-0 md:h-8 md:w-8"
                    aria-label={`Actions for ${typhoon.name}`}
                >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openView(typhoon)} className="cursor-pointer max-md:min-h-11">
                    <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                    View Details
                </DropdownMenuItem>
                {typhoon.status === 'ended' && (
                    <>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(typhoon)} className="cursor-pointer max-md:min-h-11">
                            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                            Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => openDeleteModal(typhoon)}
                            className="cursor-pointer text-destructive focus:text-destructive max-md:min-h-11"
                        >
                            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            Delete Report
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <AppLayout
            title="Disaster Management"
            header={<PageTitle icon={Cloud}>Disaster Management</PageTitle>}
            actions={
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={!!activeTyphoon}
                    className="gap-2 shadow-sm"
                    title={activeTyphoon ? "End the active disaster before creating a new one" : "Create a new disaster report"}
                >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Create New Disaster Report</span>
                    <span className="sm:hidden">New Report</span>
                </Button>
            }
        >
            <Toaster position="top-right" richColors />

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                    
                    {/* Disaster Overview - Featured + Grid Layout */}
                    {(activeTyphoon || (disasterStats && disasterStats.length > 0)) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                                <div className="min-w-0">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
                                        <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
                                        Disaster Overview
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground sm:mt-1">
                                        {activeTyphoon
                                            ? 'Active disaster report and statistics by type'
                                            : showAllTypes
                                                ? `Showing all ${disasterStats.length} disaster types`
                                                : `Showing top ${Math.min(4, disasterStats.length)} disaster types`}
                                    </p>
                                </div>
                                {/* Phones and tablets expand the type tiles instead (see TypeTiles). */}
                                {!activeTyphoon && disasterStats.length > 4 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAllTypes(!showAllTypes)}
                                        className="hidden items-center gap-2 lg:flex"
                                    >
                                        {showAllTypes ? (
                                            <>
                                                <ChevronLeft className="w-4 h-4" />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                View All ({disasterStats.length})
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            
                            {/* Featured + Grid Layout: Active Disaster + Carousel */}
                            {!showAllTypes && activeTyphoon && disasterStats.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                    {/* Compact Featured Card - Active Disaster */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="lg:col-span-1"
                                    >
                                        {/* Theme card; the left bar and chip carry the status (green active, amber paused). */}
                                        <Card className="relative h-full overflow-hidden border-border shadow-sm">
                                            <span
                                                aria-hidden="true"
                                                className={`absolute inset-y-0 left-0 w-1 ${activeTyphoon.status === 'paused' ? 'bg-warning' : 'bg-success'}`}
                                            />
                                            <CardContent className="flex h-full flex-col gap-3 p-4 pl-5 sm:p-5 sm:pl-6">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Active disaster report
                                                    </p>
                                                    <StatusChip status={activeTyphoon.status} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">
                                                        {activeTyphoon.name}
                                                    </h3>
                                                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                                                        {activeTyphoon.disaster_type && (
                                                            <span className="font-medium text-foreground">{activeTyphoon.disaster_type}</span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                                            Day {differenceInCalendarDays(new Date(), new Date(activeTyphoon.started_at)) + 1}
                                                            {' · '}
                                                            Started {format(new Date(activeTyphoon.started_at), 'MMM d, yyyy')}
                                                        </span>
                                                    </p>
                                                </div>

                                                {activeTyphoon.description && (
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">{activeTyphoon.description}</p>
                                                )}

                                                {/* Lifecycle actions: pause or resume, end, and a snapshot while paused */}
                                                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                                                    {activeTyphoon.status === 'paused' ? (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setLifecycleAction('resume')}
                                                            className="min-h-11 gap-2 border-success/40 text-sm font-semibold text-success hover:bg-success/10 hover:text-success"
                                                        >
                                                            <Play className="h-4 w-4" aria-hidden="true" />
                                                            Resume
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setLifecycleAction('pause')}
                                                            className="min-h-11 gap-2 border-warning/40 text-sm font-semibold text-warning hover:bg-warning/10 hover:text-warning"
                                                        >
                                                            <Pause className="h-4 w-4" aria-hidden="true" />
                                                            Pause
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setLifecycleAction('end')}
                                                        className="min-h-11 gap-2 text-sm font-semibold"
                                                    >
                                                        <StopCircle className="h-4 w-4" aria-hidden="true" />
                                                        End disaster
                                                    </Button>
                                                    {activeTyphoon.status === 'paused' && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDownloadSnapshot(activeTyphoon)}
                                                            className="col-span-2 min-h-11 gap-2 text-sm font-semibold"
                                                        >
                                                            <FileDown className="h-4 w-4" aria-hidden="true" />
                                                            Download snapshot PDF
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Desktop: carousel of disaster types, a 2x2 grid of four per slide.
                                        Phones and tablets get the TypeTiles grid below instead. */}
                                    <div className="relative hidden lg:col-span-2 lg:block">
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => goToSlide(slide - 1)}
                                                disabled={slide === 0}
                                                aria-label="Previous disaster types"
                                                className="shrink-0 h-11 w-11 rounded-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>

                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                {/* One animated child per slide, as AnimatePresence "wait" requires. */}
                                                <AnimatePresence mode="wait" initial={false}>
                                                    <motion.div
                                                        key={`${perSlide}-${slide}`}
                                                        className={`grid select-none gap-4 ${perSlide > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                                                        initial={{ opacity: 0, x: 40 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -40 }}
                                                        transition={{ duration: 0.25 }}
                                                        drag={slideCount > 1 ? 'x' : false}
                                                        dragDirectionLock
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(event, info) => {
                                                            if (info.offset.x < -60) goToSlide(slide + 1);
                                                            else if (info.offset.x > 60) goToSlide(slide - 1);
                                                        }}
                                                    >
                                                        {slideStats.map((stat) => {
                                                            const { icon: Icon, color } = getDisasterIcon(stat.disaster_type);
                                                            return (
                                                                <Card key={stat.disaster_type} className="border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 hover:shadow-lg transition-shadow duration-300 h-full">
                                                                    <CardContent className="p-5">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <div className={`p-2.5 bg-gradient-to-br ${color} rounded-lg shadow-md`}>
                                                                                <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                                                                            </div>
                                                                            <div className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm tabular-nums">
                                                                                {((stat.count / statusCounts.total) * 100).toFixed(1)}%
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-blue-600 mb-1 line-clamp-1">
                                                                                {stat.disaster_type}
                                                                            </p>
                                                                            <p className="text-3xl font-bold text-blue-900 tabular-nums">{stat.count}</p>
                                                                            <p className="text-xs text-slate-500 mt-1">
                                                                                {stat.count === 1 ? 'disaster' : 'disasters'} recorded
                                                                            </p>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            );
                                                        })}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => goToSlide(slide + 1)}
                                                disabled={slide >= slideCount - 1}
                                                aria-label="Next disaster types"
                                                className="shrink-0 h-11 w-11 rounded-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        {slideCount > 1 && (
                                            <div className="mt-3 flex flex-col items-center gap-1">
                                                <div className="flex flex-wrap items-center justify-center">
                                                    {Array.from({ length: slideCount }).map((_, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => goToSlide(index)}
                                                            aria-label={`Go to slide ${index + 1} of ${slideCount}`}
                                                            aria-current={index === slide ? 'true' : undefined}
                                                            className="flex h-8 min-w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                        >
                                                            <span
                                                                className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                                                                    index === slide ? 'w-8 bg-blue-600' : 'w-2 bg-blue-300 hover:bg-blue-400'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                                                    {slide + 1} / {slideCount}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* When NO Active Disaster: Show Featured + Grid Layout for Stats */}
                            {!showAllTypes && !activeTyphoon && disasterStats.length > 0 && (
                                <div className="mb-4 hidden grid-cols-3 gap-4 lg:grid">
                                    {/* Large Featured Card - Top Disaster Type */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="lg:col-span-1 lg:row-span-2"
                                    >
                                        <Card className="h-full border-blue-300 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                                            <CardContent className="p-8 h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                                                            <Cloud className="w-8 h-8 text-white" />
                                                        </div>
                                                        <div className="px-4 py-2 bg-white text-blue-700 text-sm font-bold rounded-full shadow-md">
                                                            {((disasterStats[0].count / statusCounts.total) * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-100 mb-2 uppercase tracking-wide">
                                                            Top Disaster Type
                                                        </p>
                                                        <h3 className="text-2xl font-bold text-white mb-1">
                                                            {disasterStats[0].disaster_type}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <div className="mt-6">
                                                    <p className="text-5xl font-black text-white mb-2">{disasterStats[0].count}</p>
                                                    <p className="text-sm text-blue-100">
                                                        {disasterStats[0].count === 1 ? 'disaster' : 'disasters'} recorded
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* 2x2 Grid of Smaller Cards */}
                                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {disasterStats.slice(1, 5).map((stat, index) => (
                                            <motion.div
                                                key={stat.disaster_type}
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: (index + 1) * 0.1 }}
                                            >
                                                <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full">
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            {(() => {
                                                                const { icon: Icon, color } = getDisasterIcon(stat.disaster_type);
                                                                return (
                                                                    <div className={`p-2.5 bg-gradient-to-br ${color} rounded-lg shadow-md`}>
                                                                        <Icon className="w-5 h-5 text-white" />
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                                                                {((stat.count / statusCounts.total) * 100).toFixed(1)}%
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-blue-600 mb-1 line-clamp-1">
                                                                {stat.disaster_type}
                                                            </p>
                                                            <p className="text-3xl font-bold text-blue-900">{stat.count}</p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {stat.count === 1 ? 'disaster' : 'disasters'} recorded
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Phones and tablets: every type at a glance instead of the carousel / featured grid. */}
                            {disasterStats.length > 0 && (
                                <div className="lg:hidden">
                                    {activeTyphoon && (
                                        <h3 className="mb-2 text-sm font-semibold text-foreground">By disaster type</h3>
                                    )}
                                    <TypeTiles stats={disasterStats} total={statusCounts.total} featureFirst={!activeTyphoon} />
                                </div>
                            )}

                            {/* Show All View - Regular Grid */}
                            {showAllTypes && (
                                <div className="hidden grid-cols-3 gap-4 lg:grid">
                                    {disasterStats.map((stat, index) => (
                                        <motion.div
                                            key={stat.disaster_type}
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                                                <CardContent className="p-5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        {(() => {
                                                            const { icon: Icon, color } = getDisasterIcon(stat.disaster_type);
                                                            return (
                                                                <div className={`p-2.5 bg-gradient-to-br ${color} rounded-lg shadow-md`}>
                                                                    <Icon className="w-5 h-5 text-white" />
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                                                            {((stat.count / statusCounts.total) * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-600 mb-1 line-clamp-1">
                                                            {stat.disaster_type}
                                                        </p>
                                                        <p className="text-3xl font-bold text-blue-900">{stat.count}</p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {stat.count === 1 ? 'disaster' : 'disasters'} recorded
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Disaster history */}
                    <DataPanel
                        icon={FileClock}
                        title="Disaster reports history"
                        count={typhoons.length > 0 ? filteredTyphoons.length : undefined}
                        description="View all disaster reports and their status"
                    >
                        {typhoons.length === 0 ? (
                            <EmptyState
                                icon={Cloud}
                                title="No disaster reports yet"
                                description="Create your first disaster report to get started with data collection."
                                action={
                                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                        Create first report
                                    </Button>
                                }
                            />
                        ) : (
                            <>
                                <DataToolbar
                                    search={{
                                        id: 'disaster-search',
                                        value: searchQuery,
                                        onChange: setSearchQuery,
                                        placeholder: 'Search name, description or person',
                                    }}
                                    filters={
                                        <>
                                            <FilterSelect
                                                id="disaster-year"
                                                label="Year"
                                                value={selectedYear}
                                                onChange={setSelectedYear}
                                                allLabel="All years"
                                                options={availableYears.map((year) => ({
                                                    value: year,
                                                    label: `${year} (${yearCounts[year]})`,
                                                }))}
                                            />
                                            <FilterSelect
                                                id="disaster-status"
                                                label="Status"
                                                value={statusFilter}
                                                onChange={setStatusFilter}
                                                options={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'paused', label: 'Paused' },
                                                    { value: 'ended', label: 'Ended' },
                                                ]}
                                            />
                                        </>
                                    }
                                    chips={chips}
                                    onClearAll={clearFilters}
                                />

                                {paginationData.paginatedTyphoons.length === 0 ? (
                                    <EmptyState
                                        title="No reports match"
                                        description="Try another search or clear the filters."
                                        action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
                                    />
                                ) : (
                                    <>
                                    {/* Phones: compact cards; the card opens the details, ⋯ holds the other actions. */}
                                    <ul className="divide-y divide-border md:hidden">
                                        {paginationData.paginatedTyphoons.map((typhoon) => {
                                            const { icon: TypeIcon } = getDisasterIcon(typhoon.disaster_type);
                                            return (
                                                <li key={typhoon.id} className="flex items-start">
                                                    <button
                                                        type="button"
                                                        onClick={() => openView(typhoon)}
                                                        className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-4 pr-1 text-left transition-colors active:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                                    >
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <TypeIcon className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <span className="min-w-0 truncate text-base font-semibold text-foreground">{typhoon.name}</span>
                                                                <StatusChip status={typhoon.status} />
                                                            </span>
                                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                                {typhoon.disaster_type || 'Not specified'}
                                                                {' · '}
                                                                <span className="tabular-nums">
                                                                    {format(new Date(typhoon.started_at), 'MMM d')}
                                                                    {' – '}
                                                                    {typhoon.ended_at ? format(new Date(typhoon.ended_at), 'MMM d, yyyy') : 'ongoing'}
                                                                </span>
                                                            </span>
                                                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                                                Created by {typhoon.creator?.name || 'Unknown'}
                                                                {typhoon.ender?.name ? ` · Ended by ${typhoon.ender.name}` : ''}
                                                            </span>
                                                        </span>
                                                    </button>
                                                    <div className="py-2.5 pr-2">{renderRowMenu(typhoon)}</div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <SortableHead sortKey="name" sort={sort} onSort={toggleSort}>Name</SortableHead>
                                                <SortableHead sortKey="type" sort={sort} onSort={toggleSort}>Type</SortableHead>
                                                <SortableHead sortKey="status" sort={sort} onSort={toggleSort}>Status</SortableHead>
                                                <SortableHead sortKey="started" sort={sort} onSort={toggleSort}>Started</SortableHead>
                                                <SortableHead sortKey="ended" sort={sort} onSort={toggleSort}>Ended</SortableHead>
                                                <TableHead className="hidden lg:table-cell">Created by</TableHead>
                                                <TableHead className="hidden xl:table-cell">Ended by</TableHead>
                                                <TableHead className="text-right">
                                                    <span className="sr-only">Actions</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginationData.paginatedTyphoons.map((typhoon) => (
                                                <TableRow key={typhoon.id}>
                                                    <TableCell>
                                                        <div className="font-semibold text-foreground">{typhoon.name}</div>
                                                        {typhoon.description && (
                                                            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{typhoon.description}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium">
                                                            {typhoon.disaster_type || 'Not specified'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <StatusChip status={typhoon.status} />
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                                                        <div className="text-foreground">{format(new Date(typhoon.started_at), 'MMM d, yyyy')}</div>
                                                        <div className="text-xs">{format(new Date(typhoon.started_at), 'h:mm a')}</div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                                                        {typhoon.ended_at ? (
                                                            <>
                                                                <div className="text-foreground">{format(new Date(typhoon.ended_at), 'MMM d, yyyy')}</div>
                                                                <div className="text-xs">{format(new Date(typhoon.ended_at), 'h:mm a')}</div>
                                                            </>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                                                        {typhoon.creator?.name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell className="hidden text-muted-foreground xl:table-cell">
                                                        {typhoon.ender?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end">{renderRowMenu(typhoon)}</div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </div>
                                    </>
                                )}

                                <TablePagination
                                    currentPage={currentPage}
                                    totalPages={paginationData.totalPages}
                                    totalItems={filteredTyphoons.length}
                                    perPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                    itemLabel="reports"
                                    className={PANEL_PAGINATION}
                                />
                            </>
                        )}
                    </DataPanel>
                    </div>
                </div>

            {/* Create Typhoon Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="mb-1 flex items-center gap-3 pr-8">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Cloud className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <DialogTitle className="text-lg sm:text-xl">Create New Disaster Report</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm sm:text-base">
                            Enter the disaster details. Once created, all forms will be enabled for users to input data.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTyphoon}>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">
                                    Disaster Name <span className="text-destructive" aria-hidden="true">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Typhoon Kristine, Earthquake, Flooding"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-11"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="disaster_type" className="text-sm font-semibold">
                                    Disaster Type <span className="text-destructive" aria-hidden="true">*</span>
                                </Label>
                                <Select
                                    value={formData.disaster_type}
                                    onValueChange={(value) => setFormData({ ...formData, disaster_type: value })}
                                    disabled={isSubmitting}
                                    required
                                >
                                    <SelectTrigger id="disaster_type" className="h-11">
                                        <SelectValue placeholder="Select disaster type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Typhoon">Typhoon</SelectItem>
                                        <SelectItem value="Tropical Storm">Tropical Storm</SelectItem>
                                        <SelectItem value="Tropical Depression">Tropical Depression</SelectItem>
                                        <SelectItem value="Flood">Flood</SelectItem>
                                        <SelectItem value="Flash Flood">Flash Flood</SelectItem>
                                        <SelectItem value="Earthquake">Earthquake</SelectItem>
                                        <SelectItem value="Landslide">Landslide</SelectItem>
                                        <SelectItem value="Storm Surge">Storm Surge</SelectItem>
                                        <SelectItem value="Drought">Drought</SelectItem>
                                        <SelectItem value="Volcanic Eruption">Volcanic Eruption</SelectItem>
                                        <SelectItem value="Fire">Fire</SelectItem>
                                        <SelectItem value="Tornado">Tornado</SelectItem>
                                        <SelectItem value="Heavy Rainfall">Heavy Rainfall</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold">
                                    Description <span className="font-normal text-muted-foreground">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Additional details about the disaster (e.g., expected impact, severity level...)"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    disabled={isSubmitting}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setFormData({ name: '', disaster_type: '', description: '' });
                                }}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Disaster Report
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DisasterLifecycleDialog
                action={lifecycleAction}
                disaster={activeTyphoon}
                onActionChange={setLifecycleAction}
            />

            {/* Delete Typhoon Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3 pr-8">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl">Delete Disaster Report</DialogTitle>
                                <DialogDescription className="mt-1">
                                    This action cannot be undone
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="py-2 sm:py-4">
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                            <p className="mb-2 text-sm font-medium text-foreground">
                                Are you sure you want to delete the disaster report "{selectedTyphoon?.name}"?
                            </p>
                            <p className="text-sm text-muted-foreground">
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
                            className="w-full sm:w-auto"
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
                <DialogContent className="max-h-[90dvh] gap-3 overflow-y-auto p-4 sm:max-w-[560px] sm:gap-4 sm:p-6">
                    <DialogHeader className="pr-8 text-left">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Cloud className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                            <DialogTitle className="text-base font-semibold sm:text-lg">Disaster details</DialogTitle>
                        </div>
                        <DialogDescription className="sr-only sm:not-sr-only sm:pt-1">
                            Complete information about this disaster report
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTyphoon && (
                        <div className="space-y-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <h3 className="min-w-0 break-words text-base font-semibold text-foreground sm:text-lg">{selectedTyphoon.name}</h3>
                                    <StatusChip status={selectedTyphoon.status} />
                                </div>
                                {/* Duration, and for ended disasters whether the final PDF exists yet. */}
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" aria-hidden="true" />
                                        {selectedTyphoon.ended_at ? 'Lasted' : 'Running for'}{' '}
                                        <span className="font-medium text-foreground">
                                            {durationLabel(selectedTyphoon.started_at, selectedTyphoon.ended_at)}
                                        </span>
                                    </span>
                                    {selectedTyphoon.status === 'ended' && (
                                        <span
                                            className={`inline-flex items-center gap-1.5 font-medium ${
                                                selectedTyphoon.pdf_path ? 'text-success' : 'text-warning'
                                            }`}
                                        >
                                            {selectedTyphoon.pdf_path ? (
                                                <FileCheck className="h-4 w-4" aria-hidden="true" />
                                            ) : (
                                                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                            )}
                                            {selectedTyphoon.pdf_path ? 'PDF ready' : 'PDF being prepared'}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <DisasterTotals
                                state={summaries[selectedTyphoon.id]}
                                onRetry={() => loadSummary(selectedTyphoon.id)}
                            />

                            {/* Two columns even on a phone; short dates keep each value to one or two lines. */}
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                                <div className="min-w-0">
                                    <dt className="text-xs font-medium text-muted-foreground">Type</dt>
                                    <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{selectedTyphoon.disaster_type || 'Not specified'}</dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs font-medium text-muted-foreground">Created by</dt>
                                    <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{selectedTyphoon.creator?.name || 'Unknown'}</dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs font-medium text-muted-foreground">Started</dt>
                                    <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                                        {format(new Date(selectedTyphoon.started_at), 'MMM d, yyyy')}
                                        <span className="block text-xs font-normal text-muted-foreground">{format(new Date(selectedTyphoon.started_at), 'h:mm a')}</span>
                                    </dd>
                                </div>
                                <div className="min-w-0">
                                    <dt className="text-xs font-medium text-muted-foreground">Ended</dt>
                                    <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                                        {selectedTyphoon.ended_at ? (
                                            <>
                                                {format(new Date(selectedTyphoon.ended_at), 'MMM d, yyyy')}
                                                <span className="block truncate text-xs font-normal text-muted-foreground">
                                                    {format(new Date(selectedTyphoon.ended_at), 'h:mm a')}
                                                    {selectedTyphoon.ender?.name ? ` · ${selectedTyphoon.ender.name}` : ''}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="font-normal text-muted-foreground">Ongoing</span>
                                        )}
                                    </dd>
                                </div>
                                {selectedTyphoon.description && (
                                    <div className="col-span-2 border-t border-border pt-3">
                                        <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                                        <dd className="mt-0.5 line-clamp-6 whitespace-pre-line break-words text-sm text-foreground">
                                            {selectedTyphoon.description}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Phones: one row; Download only for ended disasters. */}
                    <DialogFooter
                        className={`grid gap-2 pt-1 sm:flex sm:flex-row ${selectedTyphoon?.status === 'ended' ? 'grid-cols-2' : 'grid-cols-1'}`}
                    >
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsViewModalOpen(false);
                                setSelectedTyphoon(null);
                            }}
                            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                        >
                            Close
                        </Button>
                        {selectedTyphoon?.status === 'ended' && (
                            <Button
                                onClick={() => {
                                    handleDownloadPdf(selectedTyphoon);
                                    setIsViewModalOpen(false);
                                }}
                                className="min-h-11 w-full px-3 sm:min-h-9 sm:w-auto sm:px-4"
                            >
                                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                                Download PDF
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
