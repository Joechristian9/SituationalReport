import React from 'react';
import ServiceHistoryPage from '@/Components/ServiceHistoryPage';
import { Sprout } from 'lucide-react';
import { TableCell } from '@/Components/ui/table';

export default function AgricultureHistory() {
    const columns = [
        { label: '#', className: 'w-12' },
        { label: 'Crops Affected', className: 'min-w-[150px]' },
        { label: 'Standing Crop (Ha)', className: 'min-w-[120px]' },
        { label: 'Stage of Crop', className: 'min-w-[120px]' },
        { label: 'Total Area Affected (Ha)', className: 'min-w-[150px]' },
        { label: 'Total Production Loss', className: 'min-w-[150px]' },
        { label: 'Last Updated', className: 'min-w-[150px]' },
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
                        <span className="font-medium text-gray-900">{report.crops_affected || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-gray-700">
                    {report.standing_crop_ha ? parseFloat(report.standing_crop_ha).toFixed(2) : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-700">{report.stage_of_crop || 'N/A'}</TableCell>
                <TableCell className="text-gray-700">
                    {report.total_area_affected_ha ? parseFloat(report.total_area_affected_ha).toFixed(2) : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-700">
                    {report.total_production_loss ? parseFloat(report.total_production_loss).toFixed(2) : 'N/A'}
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
            </>
        );
    };

    return (
        <ServiceHistoryPage
            serviceType="agriculture"
            title="Agriculture Report History"
            icon={Sprout}
            apiEndpoint="/api/agriculture-history"
            breadcrumbLabel="Agriculture"
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
