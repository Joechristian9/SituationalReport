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
import { Zap, Loader2, History, Clock, Cloud, Eye, Edit, ChevronDown, ChevronUp } from "lucide-react";

export default function ElectricityHistoryIndex() {
    const APP_URL = useAppUrl();
    const [selectedReport, setSelectedReport] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [expandedTyphoons, setExpandedTyphoons] = useState({});

    // Fetch history data grouped by typhoon
    const { data: historyData, isLoading } = useQuery({
        queryKey: ["electricity-history"],
        queryFn: async () => {
            const { data } = await axios.get(`${APP_URL}/api/electricity-history`);
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
                <title>Electricity Report History</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumbs
                            crumbs={[
                                { label: "Electricity Reports" },
                                { label: "History" },
                            ]}
                        />
                    </div>
                </header>

                <main className="w-full p-6 h-full bg-gray-50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Header */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <History className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h1 className="font-semibold text-slate-800 text-xl">Electricity Report History</h1>
                                        <p className="text-sm text-slate-600">
                                            View all your electricity reports organized by typhoon
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                        <Card key={typhoonGroup.typhoon.id} className="overflow-hidden">
                                            <CardHeader 
                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleTyphoon(typhoonGroup.typhoon.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Cloud className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <CardTitle className="text-lg flex items-center gap-2">
                                                                {typhoonGroup.typhoon.name}
                                                                {getTyphoonStatusBadge(typhoonGroup.typhoon.status)}
                                                            </CardTitle>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {typhoonGroup.reports.length} report{typhoonGroup.reports.length !== 1 ? 's' : ''}
                                                                {' • '}
                                                                Started: {new Date(typhoonGroup.typhoon.started_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </CardHeader>
                                            
                                            {isExpanded && (
                                                <CardContent className="pt-0">
                                                    <div className="space-y-3">
                                                        {typhoonGroup.reports.map((report, index) => (
                                                            <div
                                                                key={report.id}
                                                                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                                            >
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-blue-50 p-2 rounded">
                                                                            <Zap className="w-4 h-4 text-blue-600" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-medium text-gray-800">
                                                                                Report #{typhoonGroup.reports.length - index}
                                                                            </h4>
                                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                                <Clock size={12} />
                                                                                {new Date(report.updated_at).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => viewReport(report)}
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-1" />
                                                                            View
                                                                        </Button>
                                                                        {typhoonGroup.typhoon.status === 'active' && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={editReport}
                                                                            >
                                                                                <Edit className="w-4 h-4 mr-1" />
                                                                                Update
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    <div>
                                                                        <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                                                                        <Badge className={getStatusColor(report.status)}>
                                                                            {report.status || 'N/A'}
                                                                        </Badge>
                                                                    </div>
                                                                    {report.barangays_affected && (
                                                                        <div className="md:col-span-2">
                                                                            <p className="text-xs font-medium text-gray-600 mb-1">Affected Barangays</p>
                                                                            <p className="text-sm text-gray-700">{report.barangays_affected}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
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
                                        Your electricity reports will appear here
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
                            <Zap className="w-5 h-5 text-blue-600" />
                            Electricity Report Details
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

                            {selectedReport.barangays_affected && (
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Affected Barangays</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {selectedReport.barangays_affected}
                                    </p>
                                </div>
                            )}

                            {selectedReport.remarks && (
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Remarks</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {selectedReport.remarks}
                                    </p>
                                </div>
                            )}

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
