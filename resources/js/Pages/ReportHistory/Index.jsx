import React, { useState } from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { Cloud, Radio } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Head, usePage } from "@inertiajs/react";

export default function ReportHistoryIndex() {
    const [activeTab, setActiveTab] = useState('weather');

    // Weather columns and render function
    const weatherColumns = [
        { label: '#', className: 'w-12' },
        { label: 'Municipality', className: 'min-w-[150px]' },
        { label: 'Sky Condition', className: 'min-w-[120px]' },
        { label: 'Wind', className: 'min-w-[120px]' },
        { label: 'Precipitation', className: 'min-w-[120px]' },
        { label: 'Sea Condition', className: 'min-w-[120px]' },
        { label: 'Last Updated', className: 'min-w-[150px]' },
        { label: 'Updated By', className: 'min-w-[120px]' },
    ];

    const renderWeatherCell = (report, index, totalReports, helpers) => {
        const { Icon } = helpers;
        
        return (
            <>
                <TableCell className="text-center font-medium text-gray-700">
                    {totalReports - index}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.municipality || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">{report.sky_condition || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.wind || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.precipitation || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.sea_condition || 'N/A'}</TableCell>
                <TableCell className="text-sm text-gray-600">
                    {new Date(report.updated_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {report.user?.name || 'Unknown'}
                </TableCell>
            </>
        );
    };

    // Communication columns and render function
    const communicationColumns = [
        { label: '#', className: 'w-12' },
        { label: 'Globe', className: 'min-w-[100px]' },
        { label: 'Smart', className: 'min-w-[100px]' },
        { label: 'PLDT Landline', className: 'min-w-[120px]' },
        { label: 'PLDT Internet', className: 'min-w-[120px]' },
        { label: 'VHF', className: 'min-w-[100px]' },
        { label: 'Remarks', className: 'min-w-[150px]' },
        { label: 'Last Updated', className: 'min-w-[150px]' },
        { label: 'Updated By', className: 'min-w-[120px]' },
    ];

    const renderCommunicationCell = (report, index, totalReports, helpers) => {
        const { Icon } = helpers;
        
        return (
            <>
                <TableCell className="text-center font-medium text-gray-700">
                    {totalReports - index}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.globe || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">{report.smart || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.pldt_landline || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.pldt_internet || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.vhf || 'N/A'}</TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                    {report.remarks || 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {new Date(report.updated_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {report.user?.name || 'Unknown'}
                </TableCell>
            </>
        );
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <Head>
                <title>Report History</title>
                <link rel="icon" type="image/jpeg" href="/images/ilagan.jpeg" />
            </Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumbs crumbs={[
                            { label: "Report History" }
                        ]} />
                    </div>
                </header>

                <main className="w-full p-6 bg-gray-50 min-h-screen">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                            <TabsTrigger value="weather" className="flex items-center gap-2">
                                <Cloud className="w-4 h-4" />
                                Weather
                            </TabsTrigger>
                            <TabsTrigger value="communication" className="flex items-center gap-2">
                                <Radio className="w-4 h-4" />
                                Communication
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="weather">
                            <ServiceHistoryPage
                                serviceType="weather"
                                title="Weather Reports History"
                                icon={Cloud}
                                apiEndpoint="/api/weather-history"
                                breadcrumbLabel="Weather"
                                columns={weatherColumns}
                                renderCellContent={renderWeatherCell}
                                gradientColors={{
                                    from: 'from-blue-50',
                                    via: 'via-sky-50',
                                    to: 'to-blue-100',
                                    border: 'border-blue-200',
                                    iconFrom: 'from-blue-500',
                                    iconTo: 'to-sky-600'
                                }}
                                hideLayout={true}
                            />
                        </TabsContent>

                        <TabsContent value="communication">
                            <ServiceHistoryPage
                                serviceType="communication"
                                title="Communication Reports History"
                                icon={Radio}
                                apiEndpoint="/api/communication-history"
                                breadcrumbLabel="Communication"
                                columns={communicationColumns}
                                renderCellContent={renderCommunicationCell}
                                gradientColors={{
                                    from: 'from-purple-50',
                                    via: 'via-violet-50',
                                    to: 'to-purple-100',
                                    border: 'border-purple-200',
                                    iconFrom: 'from-purple-500',
                                    iconTo: 'to-violet-600'
                                }}
                                hideLayout={true}
                            />
                        </TabsContent>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
