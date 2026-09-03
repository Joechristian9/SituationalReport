import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BatchHistory({ batches }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Batch History" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg sm:text-xl font-semibold text-blue-700">
                            Disaster History by Batch
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
                                        Historical Disaster Records
                                    </CardTitle>
                                    <CardDescription>
                                        View all ended disasters grouped by year. Each batch contains complete disaster reports with all form submissions.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>

                        {/* Batch Cards */}
                        {batches && batches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {batches.map((batch, index) => (
                                    <motion.div
                                        key={batch.year_range}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Link href={`/admin/history/${batch.year_range}`}>
                                            <Card className="hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer group h-full">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-2xl font-bold text-blue-700 group-hover:text-blue-800">
                                                            {batch.year_range}
                                                        </CardTitle>
                                                        <Badge variant="secondary" className="text-sm">
                                                            {batch.count} {batch.count === 1 ? 'Disaster' : 'Disasters'}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {batch.disasters.slice(0, 3).map((disaster) => (
                                                            <div key={disaster.id} className="flex items-start gap-2 text-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-800">
                                                                        {disaster.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {disaster.type} • {disaster.started_at} - {disaster.ended_at}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {batch.count > 3 && (
                                                            <p className="text-xs text-gray-500 italic pl-3.5">
                                                                +{batch.count - 3} more...
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-blue-600 group-hover:text-blue-700 font-medium flex items-center gap-1">
                                                            View all disaster records
                                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border-gray-200">
                                    <CardContent className="py-16 text-center">
                                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            No Historical Records Found
                                        </h3>
                                        <p className="text-gray-500 text-sm">
                                            There are no ended disasters in the system yet. Historical records will appear here once disasters are marked as ended.
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
