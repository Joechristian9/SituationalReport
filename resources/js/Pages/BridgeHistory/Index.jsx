import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { MapPin } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function BridgeHistoryIndex() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Bridge Classification', className: 'min-w-[150px]' },
        { label: 'Name of Bridge', className: 'min-w-[150px]' },
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
                        <div className="bg-teal-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.bridge_classification || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">{report.name_of_bridge || 'N/A'}</TableCell>
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
            serviceType="bridge"
            title="Bridge Reports History"
            icon={MapPin}
            apiEndpoint="/api/bridge-history"
            breadcrumbLabel="Bridge"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-teal-50',
                via: 'via-cyan-50',
                to: 'to-teal-100',
                border: 'border-teal-200',
                iconFrom: 'from-teal-500',
                iconTo: 'to-cyan-600'
            }}
        />
    );
}
