import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";
import NoActiveTyphoonNotification from "@/Components/NoActiveTyphoonNotification";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { AlertCircle, Zap, Droplets, AlertTriangle, CheckCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useEffect, useRef } from "react";

export default function Dashboard() {
    const { typhoon, auth, electricityReport, waterReport, flash } = usePage().props;
    const previousTyphoonRef = useRef(null);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.info) {
            toast(flash.info);
        }
    }, [flash]);

    // Monitor typhoon status changes
    useEffect(() => {
        const currentTyphoon = typhoon?.active;
        const previousTyphoon = previousTyphoonRef.current;

        if (currentTyphoon && previousTyphoon) {
            // Check if typhoon was paused
            if (previousTyphoon.status === 'active' && currentTyphoon.status === 'paused') {
                toast.warning(`Typhoon ${currentTyphoon.name} has been paused. Forms are now disabled.`, {
                    duration: 5000,
                    icon: '⏸️',
                });
            }
            // Check if typhoon was resumed
            else if (previousTyphoon.status === 'paused' && currentTyphoon.status === 'active') {
                toast.success(`Typhoon ${currentTyphoon.name} has been resumed. Forms are now enabled.`, {
                    duration: 5000,
                    icon: '▶️',
                });
            }
        }
        // Check if new typhoon was created
        else if (currentTyphoon && !previousTyphoon) {
            toast.success(`New typhoon report created: ${currentTyphoon.name}`, {
                duration: 5000,
                icon: '🌀',
            });
        }
        // Check if typhoon was ended
        else if (!currentTyphoon && previousTyphoon && previousTyphoon.status === 'active') {
            toast.info(`Typhoon ${previousTyphoon.name} has been ended.`, {
                duration: 5000,
                icon: '✅',
            });
        }

        previousTyphoonRef.current = currentTyphoon;
    }, [typhoon]);

    // Dashboard polling disabled - causes conflicts with SituationReports polling
    // Users can click "Situation Overview" link when a typhoon is created
    
    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Dashboard"></Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <h1 className="text-xl font-semibold">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <NoActiveTyphoonNotification 
                            typhoon={typhoon?.active}
                            hasActive={typhoon?.hasActive}
                        />
                        {typhoon?.hasActive && typhoon?.active?.status === 'active' && (
                            <ActiveTyphoonHeader 
                                typhoon={typhoon?.active}
                                hasActive={typhoon?.hasActive}
                            />
                        )}
                    </div>
                </header>
                <main className="w-full p-6 space-y-6">
                    {(!typhoon?.hasActive || typhoon?.active?.status !== 'active') ? (
                        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-500 rounded-full">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-amber-900">No Active Typhoon Report</h3>
                                        <p className="text-sm text-amber-700 mt-1">
                                            There is currently no active typhoon report. Forms are disabled until an administrator creates a new typhoon report.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Service Status Cards - ISELCO & IWD */}
                            {(electricityReport || waterReport) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ISELCO Electricity Status */}
                                {auth?.user?.permissions?.some(p => p.name === 'access-electricity-form') && electricityReport && (
                                    <Card className="shadow-lg border-l-4 border-l-yellow-500">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Zap className="w-5 h-5 text-yellow-600" />
                                                <span>ISELCO - Electricity Service</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Status:</span>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                                                        electricityReport.status === 'Operational' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : electricityReport.status === 'Partial'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {electricityReport.status === 'Operational' ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <AlertTriangle className="w-4 h-4" />
                                                        )}
                                                        {electricityReport.status || 'N/A'}
                                                    </span>
                                                </div>
                                                {electricityReport.barangays_affected && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500 mb-1">Affected Barangays:</p>
                                                        <p className="text-sm text-gray-700">{electricityReport.barangays_affected}</p>
                                                    </div>
                                                )}
                                                {electricityReport.remarks && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                                                        <p className="text-sm text-gray-700">{electricityReport.remarks}</p>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-gray-400">
                                                        Last updated: {new Date(electricityReport.updated_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* IWD Water Service Status */}
                                {auth?.user?.permissions?.some(p => p.name === 'access-water-service-form') && waterReport && (
                                    <Card className="shadow-lg border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Droplets className="w-5 h-5 text-blue-600" />
                                                <span>IWD - Water Service</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Status:</span>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                                                        waterReport.status === 'Operational' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : waterReport.status === 'Partial'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {waterReport.status === 'Operational' ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <AlertTriangle className="w-4 h-4" />
                                                        )}
                                                        {waterReport.status || 'N/A'}
                                                    </span>
                                                </div>
                                                {waterReport.source_of_water && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500 mb-1">Source of Water:</p>
                                                        <p className="text-sm text-gray-700">{waterReport.source_of_water}</p>
                                                    </div>
                                                )}
                                                {waterReport.barangays_served && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500 mb-1">Barangays Served:</p>
                                                        <p className="text-sm text-gray-700">{waterReport.barangays_served}</p>
                                                    </div>
                                                )}
                                                {waterReport.remarks && (
                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                                                        <p className="text-sm text-gray-700">{waterReport.remarks}</p>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-gray-400">
                                                        Last updated: {new Date(waterReport.updated_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
