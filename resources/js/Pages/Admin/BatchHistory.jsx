import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, AlertCircle, Download, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RowsPerPage from '@/Components/ui/RowsPerPage';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from 'sonner';

export default function BatchHistory({ batches, availableYears }) {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedDisasterType, setSelectedDisasterType] = useState('');
    const [formData, setFormData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [disasters, setDisasters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
    const [newYear, setNewYear] = useState('');
    const [years, setYears] = useState(availableYears || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Disaster types available
    const disasterTypes = [
        'Typhoon',
        'Tropical Storm',
        'Tropical Depression',
        'Flood',
        'Flash Flood',
        'Earthquake',
        'Landslide',
        'Storm Surge',
        'Drought',
        'Volcanic Eruption',
        'Fire',
        'Tornado',
        'Heavy Rainfall',
        'Other'
    ];

    // Handle add year
    const handleAddYear = async (e) => {
        e.preventDefault();
        
        const yearNumber = parseInt(newYear);
        if (isNaN(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
            toast.error('Please enter a valid year between 1900 and 2100');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('/admin/years', { year: yearNumber });
            toast.success(response.data.message);
            setYears([...years, response.data.year].sort((a, b) => b.year - a.year));
            setIsAddYearModalOpen(false);
            setNewYear('');
        } catch (error) {
            if (error.response?.status === 422) {
                toast.error('This year already exists');
            } else {
                toast.error(error.response?.data?.message || 'Failed to add year');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch disasters for selected year and disaster type
    useEffect(() => {
        if (selectedYear) {
            const batch = batches.find(b => b.year === parseInt(selectedYear));
            if (batch) {
                // Filter disasters by disaster type if selected
                if (selectedDisasterType) {
                    const filteredDisasters = batch.disasters.filter(
                        d => d.disaster_type === selectedDisasterType
                    );
                    setDisasters(filteredDisasters);
                } else {
                    setDisasters(batch.disasters);
                }
            }
        } else {
            setDisasters([]);
            setFormData([]);
        }
    }, [selectedYear, selectedDisasterType, batches]);

    // Fetch all data when year and disaster type are selected
    useEffect(() => {
        if (selectedYear && selectedDisasterType && disasters.length > 0) {
            fetchAllData();
        }
    }, [selectedYear, selectedDisasterType, disasters]);

    // Reset to page 1 when search or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    // Memoized filtered data based on search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return formData;
        
        const query = searchQuery.toLowerCase();
        return formData.filter(record => 
            record.typhoon?.name.toLowerCase().includes(query) ||
            record.user?.name.toLowerCase().includes(query) ||
            record.submitted_by?.toLowerCase().includes(query)
        );
    }, [formData, searchQuery]);

    // Memoized pagination calculations
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        return { totalPages, startIndex, endIndex, paginatedData };
    }, [filteredData, currentPage, itemsPerPage]);

    const fetchAllData = async () => {
        setLoading(true);
        
        try {
            const response = await axios.get('/api/history/all-data', {
                params: {
                    year: selectedYear,
                    disaster_type: selectedDisasterType
                }
            });
            
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching disaster data:', error);
            setFormData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Reports History" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            Reports History
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        
                        {/* Page Header with Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Title and Description */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Historical Disaster Form Submissions
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Select a year and disaster type to view all related reports.
                                    </p>
                                </div>
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                {/* Year Selection */}
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Year
                                    </label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => (
                                                <SelectItem key={year.id} value={year.year.toString()}>
                                                    {year.year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Disaster Type Selection */}
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Disaster Type
                                    </label>
                                    <Select 
                                        value={selectedDisasterType} 
                                        onValueChange={setSelectedDisasterType}
                                        disabled={!selectedYear}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select disaster type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {disasterTypes.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Add Year Button */}
                                <Button
                                    type="button"
                                    onClick={() => setIsAddYearModalOpen(true)}
                                    className="whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Year
                                </Button>
                            </div>

                            {/* Selected Year Info */}
                            {selectedYear && disasters.length > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-900 mb-2">
                                        Disasters in {selectedYear}:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {disasters.map(disaster => (
                                            <Badge key={disaster.id} variant="secondary">
                                                {disaster.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Form Data Display */}
                        {selectedYear && selectedDisasterType && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>
                                                {selectedDisasterType} Disaster Records
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {filteredData.length} {filteredData.length === 1 ? 'Record' : 'Records'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Search Bar */}
                                        <div className="mb-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search by disaster, submitter..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <p className="mt-2 text-sm text-gray-600">Loading records...</p>
                                            </div>
                                        ) : paginationData.paginatedData.length > 0 ? (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="border-b">
                                                            <tr className="text-left">
                                                                <th className="pb-3 font-medium text-gray-700">Disaster</th>
                                                                <th className="pb-3 font-medium text-gray-700">Report Type</th>
                                                                <th className="pb-3 font-medium text-gray-700">Submitted By</th>
                                                                <th className="pb-3 font-medium text-gray-700">Date</th>
                                                                <th className="pb-3 font-medium text-gray-700">Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {paginationData.paginatedData.map((record, index) => {
                                                                return (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="py-3">
                                                                            <span className="font-medium">{record.typhoon?.name || 'N/A'}</span>
                                                                        </td>
                                                                        <td className="py-3">
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {record.report_type || 'N/A'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="py-3 text-gray-600">
                                                                            {record.user?.name || record.submitted_by || 'N/A'}
                                                                        </td>
                                                                        <td className="py-3 text-gray-600">
                                                                            {formatDate(record.created_at || record.submission_date)}
                                                                        </td>
                                                                        <td className="py-3">
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                View Details
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination Controls */}
                                                {filteredData.length > 0 && (
                                                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                                        {/* Left: Showing X to Y of Z results */}
                                                        <div className="text-sm text-gray-600">
                                                            Showing {paginationData.startIndex + 1} to {Math.min(paginationData.endIndex, filteredData.length)} of {filteredData.length} results
                                                        </div>

                                                        {/* Center: Page Numbers */}
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

                                                            {/* Page Numbers */}
                                                            <div className="flex items-center gap-1">
                                                                {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                                                                    .filter(page => {
                                                                        // Show first page, last page, current page, and pages around current
                                                                        return (
                                                                            page === 1 ||
                                                                            page === paginationData.totalPages ||
                                                                            Math.abs(page - currentPage) <= 1
                                                                        );
                                                                    })
                                                                    .map((page, index, array) => {
                                                                        // Add ellipsis if there's a gap
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

                                                        {/* Right: Rows per page */}
                                                        <RowsPerPage 
                                                            rowsPerPage={itemsPerPage}
                                                            setRowsPerPage={setItemsPerPage}
                                                            totalRows={filteredData.length}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : searchQuery.trim() ? (
                                            <div className="text-center py-12">
                                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-600">
                                                    No records found matching "{searchQuery}"
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSearchQuery('')}
                                                    className="mt-3"
                                                >
                                                    Clear search
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-600">
                                                    No records found for {formTypes.find(f => f.value === selectedForm)?.label} in {selectedYear}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Empty State - No Year Selected */}
                        {!selectedYear && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="py-16 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50"
                            >
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Select a Year
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Choose a year from the dropdown above to view historical form submissions.
                                </p>
                            </motion.div>
                        )}

                    </div>
                </div>
            </SidebarInset>

            {/* Add Year Modal */}
            <Dialog open={isAddYearModalOpen} onOpenChange={setIsAddYearModalOpen}>
                <DialogContent>
                    <form onSubmit={handleAddYear}>
                        <DialogHeader>
                            <DialogTitle>Add New Year</DialogTitle>
                            <DialogDescription>
                                Enter a calendar year to add to the system. This year will be available for disaster management.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    placeholder="e.g., 2025, 2010, 2028"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                    min="1900"
                                    max="2100"
                                    required
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500">
                                    Enter a year between 1900 and 2100
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddYearModalOpen(false);
                                    setNewYear('');
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Year'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Toaster position="top-right" richColors />
        </SidebarProvider>
    );
}
