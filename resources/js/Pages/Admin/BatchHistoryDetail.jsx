import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageTitle from '@/Components/PageTitle';
import { Separator } from '@/Components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Calendar, Download, Eye, ArrowLeft, FileText, Clock } from 'lucide-react';
import { m as motion } from 'framer-motion';

export default function BatchHistoryDetail({ yearRange, disasters }) {
    const handleDownload = (disasterId) => {
        window.open(`/disasters/${disasterId}/download`, '_blank');
    };

    const handleViewDetails = (disasterId) => {
        window.open(`/disasters/${disasterId}/view`, '_blank');
    };

    return (
        <AppLayout
            title={`${yearRange} Disaster History`}
            header={
                <>
                    <Button asChild variant="ghost" size="sm" className="shrink-0 gap-2">
                        <Link href="/admin/history">
                            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                            Back
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6 shrink-0" />
                    <PageTitle icon={Calendar}>{yearRange} Disaster Records</PageTitle>
                </>
            }
        >

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
        </AppLayout>
    );
}
