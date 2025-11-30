import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { Cloud } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function WeatherHistoryIndex() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Municipality', className: 'min-w-[150px]' },
        { label: 'Sky Condition', className: 'min-w-[120px]' },
        { label: 'Wind', className: 'min-w-[120px]' },
        { label: 'Precipitation', className: 'min-w-[120px]' },
        { label: 'Sea Condition', className: 'min-w-[120px]' },
        { label: 'Last Updated', className: 'min-w-[150px]' },
        { label: 'Updated By', className: 'min-w-[120px]' },
    ];

    const renderCellContent = (report, index, totalReports, helpers) => {
        const { Icon, viewReport, typhoonStatus } = helpers;
        
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

    return (
        <ServiceHistoryPage
            serviceType="weather"
            title="Weather Reports History"
            icon={Cloud}
            apiEndpoint="/api/weather-history"
            breadcrumbLabel="Weather"
            columns={columns}
            renderCellContent={renderCellContent}
            gradientColors={{
                from: 'from-blue-50',
                via: 'via-sky-50',
                to: 'to-blue-100',
                border: 'border-blue-200',
                iconFrom: 'from-blue-500',
                iconTo: 'to-sky-600'
            }}
        />
    );
}
