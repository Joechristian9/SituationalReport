import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { MapPin } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function RoadHistoryIndex() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Road Classification', className: 'min-w-[150px]' },
        { label: 'Name of Road', className: 'min-w-[150px]' },
        { label: 'Status', className: 'min-w-[120px]' },
        { label: 'Areas/Barangays Affected', className: 'min-w-[180px]' },
        { label: 'Re-routing', className: 'min-w-[150px]' },
        { label: 'Remarks', className: 'min-w-[150px]' },
        { label: 'Last Updated', className: 'min-w-[150px]' },
        { label: 'Updated By', className: 'min-w-[120px]' },
    ];

    const renderCellContent = (report, index, totalReports, helpers) => {
        const { Icon } = helpers;
        
        return (
            <>
                <TableCell className="text-center font-medium text-gray-700">
                    {totalReports - index}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.road_classification || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">{report.name_of_road || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.status || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.areas_barangays_affected || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.re_routing || 'N/A'}</TableCell>
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
        <ServiceHistoryPage
            serviceType="road"
            title="Road Reports History"
            icon={MapPin}
            apiEndpoint="/api/road-history"
            breadcrumbLabel="Road"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-green-50',
                via: 'via-emerald-50',
                to: 'to-green-100',
                border: 'border-green-200',
                iconFrom: 'from-green-500',
                iconTo: 'to-emerald-600'
            }}
        />
    );
}
