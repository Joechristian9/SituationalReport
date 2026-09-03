import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Eye, ArrowLeft, FileText, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BatchHistoryDetail({ yearRange, disasters }) {
    const handleDownload = (disasterId) => {
        window.open(`/disasters/${disasterId}/download`, '_blank');
    };

    const handleViewDetails = (disasterId) => {
        window.open(`/disasters/${disasterId}/view`, '_blank');
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title={`${yearRange} Disaster History`} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center gap-2 flex-1">
                        <Link href="/admin/history">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            {yearRange} Disaster Records
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-6xl space-y-6">
                        
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                                Year {yearRange}
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                Complete disaster reports for all events in {yearRange}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="text-lg px-4 py-2">
                                            {disasters.length} {disasters.length === 1 ? 'Disaster' : 'Disasters'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        </motion.div>

                        {/* Disaster Cards */}
                        <div className="space-y-4">
                            {disasters.map((disaster, index) => (
                                <motion.div
                                    key={disaster.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <CardTitle className="text-xl text-gray-900">
                                                            {disaster.name}
                                                        </CardTitle>
                                                        <Badge variant="outline" className="capitalize">
                                                            {disaster.type}
                                                        </Badge>
                                                    </div>
                                                    {disaster.description && (
                                                        <CardDescription className="text-sm">
                                                            {disaster.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Started: {disaster.started_at}</span>
                                                    </div>
                                                    <Separator orientation="vertical" className="h-4" />
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Ended: {disaster.ended_at}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(disaster.id)}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </Button>
                                                    {disaster.pdf_path && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handleDownload(disaster.id)}
                                                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download PDF
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
