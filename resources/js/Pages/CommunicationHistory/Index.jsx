import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { Radio } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function CommunicationHistoryIndex() {
    const columns = [
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

    const renderCellContent = (report, index, totalReports, helpers) => {
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
        <ServiceHistoryPage
            serviceType="communication"
            title="Communication Reports History"
            icon={Radio}
            apiEndpoint="/api/communication-history"
            breadcrumbLabel="Communication"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-purple-50',
                via: 'via-violet-50',
                to: 'to-purple-100',
                border: 'border-purple-200',
                iconFrom: 'from-purple-500',
                iconTo: 'to-violet-600'
            }}
        />
    );
}
