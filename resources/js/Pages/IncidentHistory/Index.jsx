import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { Flame } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function IncidentHistory() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Kinds of Incident', className: 'min-w-[150px]' },
        { label: 'Date & Time', className: 'min-w-[150px]' },
        { label: 'Location', className: 'min-w-[150px]' },
        { label: 'Description', className: 'min-w-[200px]' },
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
                        <div className="bg-orange-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.kinds_of_incident || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">
                    {report.date_time ? new Date(report.date_time).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-700">{report.location || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.description || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">{report.remarks || 'N/A'}</TableCell>
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
            serviceType="incident"
            title="Incident Monitored History"
            icon={Flame}
            apiEndpoint="/api/incident-history"
            breadcrumbLabel="Incident Monitored"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-orange-50',
                via: 'via-red-50',
                to: 'to-orange-100',
                border: 'border-orange-200',
                iconFrom: 'from-orange-500',
                iconTo: 'to-red-600'
            }}
        />
    );
}
