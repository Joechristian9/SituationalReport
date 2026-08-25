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
import { Loader2, History, Clock, Cloud, Eye, Edit, ChevronDown, ChevronUp, Calendar, MoreVertical, FileText, Download } from "lucide-react";
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
    gradientColors, // { from, via, to, iconFrom, iconTo }
    hideLayout = false // If true, don't render sidebar/header (for use in tabs)
}) {
    const APP_URL = useAppUrl();
    const [selectedReport, setSelectedReport] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const { data: historyData, isLoading } = useQuery({
        queryKey: [`${serviceType}-history`],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}${apiEndpoint}`);
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const viewPDF = (typhoonId) => {
        window.open(`${APP_URL}/api/${serviceType}-history/${typhoonId}/pdf`, '_blank');
    };

    const downloadPDF = (typhoonId) => {
        window.location.href = `${APP_URL}/api/${serviceType}-history/${typhoonId}/pdf?download=1`;
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

    const content = (
        <div className="w-full h-full bg-gray-50">
            <div className={hideLayout ? "" : "p-6"}>
                <main className={hideLayout ? "w-full" : "w-full"}>
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
                            <Card className="overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-100">
                                                <TableHead className="font-semibold text-gray-700 w-[50px]">#</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Disaster Name</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Reports</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyData.map((typhoonGroup, index) => (
                                                <TableRow 
                                                    key={typhoonGroup.typhoon.id}
                                                    className="hover:bg-blue-50/50 transition-colors duration-150"
                                                >
                                                    <TableCell className="font-medium text-gray-500">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                                <Cloud className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900">
                                                                    {typhoonGroup.typhoon.name}
                                                                </div>
                                                                {typhoonGroup.typhoon.disaster_type && (
                                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                                        {typhoonGroup.typhoon.disaster_type}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getTyphoonStatusBadge(typhoonGroup.typhoon.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                            <History className="w-3.5 h-3.5 text-gray-400" />
                                                            {typhoonGroup.reports.length} report{typhoonGroup.reports.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                {new Date(typhoonGroup.typhoon.started_at).toLocaleDateString('en-US', { 
                                                                    month: 'short', 
                                                                    day: 'numeric', 
                                                                    year: 'numeric' 
                                                                })}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem
                                                                    onClick={() => viewPDF(typhoonGroup.typhoon.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    View PDF
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => downloadPDF(typhoonGroup.typhoon.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download PDF
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
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
            </div>
        </div>
    );

    if (hideLayout) {
        return (
            <>
                {content}
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
            </>
        );
    }

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
                {content}
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
