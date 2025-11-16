import { AlertCircle, CheckCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';

export default function TyphoonStatusBanner() {
    const { typhoon } = usePage().props;
    const activeTyphoon = typhoon?.active;
    const hasActive = typhoon?.hasActive;

    if (!hasActive) {
        return (
            <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-6">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                        <p className="font-semibold text-gray-800">No Active Typhoon</p>
                        <p className="text-sm text-gray-600">
                            Forms are currently disabled. Wait for admin to create a new typhoon report.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                    <p className="font-semibold text-blue-900">
                        Active Typhoon: {activeTyphoon?.name}
                    </p>
                    <p className="text-sm text-blue-700">
                        {activeTyphoon?.description && `${activeTyphoon.description} • `}
                        Started: {activeTyphoon?.started_at && format(new Date(activeTyphoon.started_at), 'PPP')}
                    </p>
                </div>
            </div>
        </div>
    );
}
