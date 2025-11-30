import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useAppUrl from "@/hooks/useAppUrl";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/Components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, History, Clock, Cloud, Eye, Edit, ChevronDown, ChevronUp, Calendar, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ServiceHistoryPage({ 
    serviceType, // 'electricity' or 'water'
    title,
    icon: Icon,
    apiEndpoint,
    breadcrumbLabel,
    columns, // Array of column definitions
    renderCellContent, // Function to render cell content
    gradientColors // { from, via, to, iconFrom, iconTo }
}) {
    const APP_URL = useAppUrl();
    const [selectedReport, setSelectedReport] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [expandedTyphoons, setExpandedTyphoons] = useState({});

    const { data: historyData, isLoading } = useQuery({
        queryKey: [`${serviceType}-history`],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}${apiEndpoint}`);
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const toggleTyphoon = (typhoonId) => {
        setExpandedTyphoons(prev => ({
            ...prev,
            [typhoonId]: !prev[typhoonId]
        }));
    };

    const viewReport = (report) => {
        setSelectedReport(report);
        setIsViewModalOpen(true);
    };

    const editReport = () => {
        setIsViewModalOpen(false);
        router.visit('/situation-reports');
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Operational': return 'bg-green-100 text-green-700';
            case 'Partial': return 'bg-yellow-100 text-yellow-700';
            case 'Outage': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTyphoonStatusBadge = (status) => {
        switch(status) {
            case 'active': return <Badge className="bg-green-500">Active</Badge>;
            case 'paused': return <Badge className="bg-yellow-500">Paused</Badge>;
            case 'ended': return <Badge className="bg-gray-500">Ended</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head>
                <title>{title}</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumbs
                            crumbs={[
                                { label: breadcrumbLabel },
                                { label: "History" },
                            ]}
                        />
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Header */}
                        <div className={`bg-gradient-to-r ${gradientColors.from} ${gradientColors.via} ${gradientColors.to} border ${gradientColors.border} rounded-2xl p-6 shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <div className={`bg-gradient-to-br ${gradientColors.iconFrom} ${gradientColors.iconTo} p-3.5 rounded-xl shadow-md`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
                                    <p className="text-sm text-gray-600">
                                        Track and manage your {serviceType} service reports across all typhoon events
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* History Content */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : historyData && historyData.length > 0 ? (
                            <div className="space-y-4">
                                {historyData.map((typhoonGroup) => {
                                    const isExpanded = expandedTyphoons[typhoonGroup.typhoon.id];
                                    
                                    return (
                                        <Card key={typhoonGroup.typhoon.id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
                                            <CardHeader 
                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group"
                                                onClick={() => toggleTyphoon(typhoonGroup.typhoon.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-blue-100 p-2.5 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                            <Cloud className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                                                {typhoonGroup.typhoon.name}
                                                                {getTyphoonStatusBadge(typhoonGroup.typhoon.status)}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-600">
                                                                <span className="flex items-center gap-1">
                                                                    <History className="w-3.5 h-3.5" />
                                                                    {typhoonGroup.reports.length} report{typhoonGroup.reports.length !== 1 ? 's' : ''}
                                                                </span>
                                                                <span className="text-gray-400">•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {new Date(typhoonGroup.typhoon.started_at).toLocaleDateString('en-US', { 
                                                                        month: 'short', 
                                                                        day: 'numeric', 
                                                                        year: 'numeric' 
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            
                                            {isExpanded && (
                                                <CardContent className="pt-0 pb-4">
                                                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-100">
                                                                    {columns.map((col, idx) => (
                                                                        <TableHead 
                                                                            key={idx} 
                                                                            className={`font-semibold text-gray-700 ${col.className || ''}`}
                                                                        >
                                                                            {col.label}
                                                                        </TableHead>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {typhoonGroup.reports.map((report, index) => (
                                                                    <TableRow 
                                                                        key={report.id} 
                                                                        className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100 last:border-0"
                                                                    >
                                                                        {renderCellContent(report, index, typhoonGroup.reports.length, {
                                                                            Icon,
                                                                            getStatusColor,
                                                                            viewReport,
                                                                            editReport,
                                                                            typhoonStatus: typhoonGroup.typhoon.status,
                                                                            MoreVertical,
                                                                            DropdownMenu,
                                                                            DropdownMenuContent,
                                                                            DropdownMenuItem,
                                                                            DropdownMenuTrigger,
                                                                            Eye,
                                                                            Edit
                                                                        })}
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <History className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-700 mb-1">No Reports Yet</h3>
                                    <p className="text-sm text-gray-500">
                                        Your {serviceType} reports will appear here
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </SidebarInset>

            {/* View Report Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-blue-600" />
                            {title.replace('History', 'Details')}
                        </DialogTitle>
                        <DialogDescription>
                            View complete report information
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedReport && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                                <Badge className={getStatusColor(selectedReport.status)}>
                                    {selectedReport.status || 'N/A'}
                                </Badge>
                            </div>

                            {Object.entries(selectedReport).map(([key, value]) => {
                                if (['id', 'status', 'created_at', 'updated_at', 'user'].includes(key) || !value) return null;
                                
                                return (
                                    <div key={key}>
                                        <p className="text-sm font-medium text-gray-600 mb-2 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {value}
                                        </p>
                                    </div>
                                );
                            })}

                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                    Last updated: {new Date(selectedReport.updated_at).toLocaleString()}
                                </p>
                                {selectedReport.user && (
                                    <p className="text-xs text-gray-500">
                                        Updated by: {selectedReport.user.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
