import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, AlertCircle, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RowsPerPage from '@/Components/ui/RowsPerPage';

export default function BatchHistory({ batches }) {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedForm, setSelectedForm] = useState('weather');
    const [formData, setFormData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [disasters, setDisasters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Extract available years from batches
    const availableYears = batches.map(batch => batch.year_range);

    // Form types available
    const formTypes = [
        { value: 'weather', label: 'Weather Reports', api: 'weather-history' },
        { value: 'electricity', label: 'Electricity Service', api: 'electricity-history' },
        { value: 'water-service', label: 'Water Service', api: 'water-service-history' },
        { value: 'communication', label: 'Communication', api: 'communication-history' },
        { value: 'pre-emptive', label: 'Pre-Emptive Reports', api: 'pre-emptive-history' },
        { value: 'agriculture', label: 'Agriculture', api: 'agriculture-history' },
        { value: 'incident', label: 'Incidents Monitored', api: 'incident-history' },
        { value: 'road', label: 'Road Status', api: 'road-history' },
        { value: 'bridge', label: 'Bridge Status', api: 'bridge-history' },
    ];

    // Fetch disasters for selected year
    useEffect(() => {
        if (selectedYear) {
            const batch = batches.find(b => b.year_range === selectedYear);
            if (batch) {
                setDisasters(batch.disasters);
            }
        } else {
            setDisasters([]);
            setFormData([]);
        }
    }, [selectedYear, batches]);

    // Fetch form data when year and form are selected
    useEffect(() => {
        if (selectedYear && selectedForm && disasters.length > 0) {
            fetchFormData();
        }
    }, [selectedYear, selectedForm, disasters]);

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

    const fetchFormData = async () => {
        setLoading(true);
        
        try {
            const response = await axios.get('/api/history/form-data', {
                params: {
                    year: selectedYear,
                    form_type: selectedForm
                }
            });
            
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching form data:', error);
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
                        
                        {/* Header Description */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Historical Disaster Form Submissions
                                    </CardTitle>
                                    <CardDescription>
                                        Select a year range and form type to view historical submission records.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>

                        {/* Year and Form Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Filter Options</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Year Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Year Range</label>
                                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select year range" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableYears.map(year => (
                                                        <SelectItem key={year} value={year}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Form Type Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Form Type</label>
                                            <Select 
                                                value={selectedForm} 
                                                onValueChange={setSelectedForm}
                                                disabled={!selectedYear}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select form type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formTypes.map(form => (
                                                        <SelectItem key={form.value} value={form.value}>
                                                            {form.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Selected Year Info */}
                                    {selectedYear && disasters.length > 0 && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Form Data Display */}
                        {selectedYear && selectedForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>
                                                {formTypes.find(f => f.value === selectedForm)?.label} Records
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
                            >
                                <Card className="border-gray-200">
                                    <CardContent className="py-16 text-center">
                                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            Select a Year Range
                                        </h3>
                                        <p className="text-gray-500 text-sm">
                                            Choose a year range from the dropdown above to view historical form submissions.
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
