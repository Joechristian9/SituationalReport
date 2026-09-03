import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BatchHistory({ batches }) {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedForm, setSelectedForm] = useState('weather');
    const [formData, setFormData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [disasters, setDisasters] = useState([]);

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

    const fetchFormData = async () => {
        setLoading(true);
        const formType = formTypes.find(f => f.value === selectedForm);
        
        try {
            const response = await axios.get(`/api/${formType.api}`);
            
            // Filter data by disasters in selected year range
            const disasterIds = disasters.map(d => d.id);
            const filteredData = response.data.filter(item => 
                disasterIds.includes(item.typhoon_id)
            );
            
            setFormData(filteredData);
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
                                                {formData.length} {formData.length === 1 ? 'Record' : 'Records'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <p className="mt-2 text-sm text-gray-600">Loading records...</p>
                                            </div>
                                        ) : formData.length > 0 ? (
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
                                                        {formData.map((record, index) => {
                                                            const disaster = disasters.find(d => d.id === record.typhoon_id);
                                                            return (
                                                                <tr key={index} className="hover:bg-gray-50">
                                                                    <td className="py-3">
                                                                        <span className="font-medium">{disaster?.name || 'N/A'}</span>
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
