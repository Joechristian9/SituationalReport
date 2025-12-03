import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { ClipboardList } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function PreEmptiveHistoryIndex() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Barangay', className: 'min-w-[150px]' },
        { label: 'Evacuation Center', className: 'min-w-[180px]' },
        { label: 'Inside - Families', className: 'min-w-[100px]' },
        { label: 'Inside - Individuals', className: 'min-w-[100px]' },
        { label: 'Outside - Location', className: 'min-w-[150px]' },
        { label: 'Outside - Families', className: 'min-w-[100px]' },
        { label: 'Outside - Individuals', className: 'min-w-[100px]' },
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
                        <div className="bg-indigo-100 p-1.5 rounded">
                            <Icon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">{report.barangay || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">{report.evacuation_center || 'N/A'}</TableCell>
                <TableCell className="text-center text-gray-700">{report.families || '0'}</TableCell>
                <TableCell className="text-center text-gray-700">{report.persons || '0'}</TableCell>
                <TableCell className="text-gray-700">{report.outside_center || 'N/A'}</TableCell>
                <TableCell className="text-center text-gray-700">{report.outside_families || '0'}</TableCell>
                <TableCell className="text-center text-gray-700">{report.outside_persons || '0'}</TableCell>
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
            serviceType="pre-emptive"
            title="Pre-Emptive Evacuation Reports History"
            icon={ClipboardList}
            apiEndpoint="/api/pre-emptive-history"
            breadcrumbLabel="Pre-Emptive Reports"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-indigo-50',
                via: 'via-purple-50',
                to: 'to-indigo-100',
                border: 'border-indigo-200',
                iconFrom: 'from-indigo-500',
                iconTo: 'to-purple-600'
            }}
        />
    );
}
