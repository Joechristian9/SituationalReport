import React from "react";
import ServiceHistoryPage from "@/Components/ServiceHistoryPage";
import { Droplets, Calendar, Clock } from "lucide-react";
import { TableCell } from "@/components/ui/table";

export default function WaterServiceHistoryIndex() {
    const columns = [
        { label: "#", className: "w-[80px]" },
        { label: "Status" },
        { label: "Source of Water" },
        { label: "Barangays Served" },
        { label: "Remarks" },
        { label: "Last Updated" },
        { label: "Actions", className: "text-right" },
    ];

    const renderCellContent = (report, index, totalReports, { 
        Icon, getStatusColor, viewReport, editReport, typhoonStatus,
        MoreVertical, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Eye, Edit
    }) => {
        const getStatusStyle = (status) => {
            switch(status) {
                case 'Operational': return 'text-green-700 font-medium';
                case 'Partial': return 'text-yellow-700 font-medium';
                case 'Outage': return 'text-red-700 font-medium';
                default: return 'text-gray-500';
            }
        };

        return (
            <>
                <TableCell className="font-medium text-gray-700">
                    {totalReports - index}
                </TableCell>
                <TableCell>
                    <span className={getStatusStyle(report.status)}>
                        {report.status || 'N/A'}
                    </span>
                </TableCell>
                <TableCell className="max-w-xs">
                    <div className="truncate text-gray-700" title={report.source_of_water}>
                        {report.source_of_water || <span className="text-gray-400">-</span>}
                    </div>
                </TableCell>
                <TableCell className="max-w-xs">
                    <div className="truncate text-gray-700" title={report.barangays_served}>
                        {report.barangays_served || <span className="text-gray-400">-</span>}
                    </div>
                </TableCell>
                <TableCell className="max-w-xs">
                    <div className="truncate text-gray-700" title={report.remarks}>
                        {report.remarks || <span className="text-gray-400">-</span>}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(report.updated_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                            })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(report.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => viewReport(report)} className="cursor-pointer">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                            </DropdownMenuItem>
                            {typhoonStatus === 'active' && (
                                <DropdownMenuItem onClick={editReport} className="cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Update
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </>
        );
    };

    return (
        <ServiceHistoryPage
            serviceType="water"
            title="Water Service Report History"
            icon={Droplets}
            apiEndpoint="/api/water-service-history"
            breadcrumbLabel="Water Service Reports"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: "from-blue-50",
                via: "via-cyan-50",
                to: "to-blue-50",
                border: "border-blue-200/50",
                iconFrom: "from-blue-500",
                iconTo: "to-cyan-500"
            }}
        />
    );
}
