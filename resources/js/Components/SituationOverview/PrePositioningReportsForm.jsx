import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { MapPin, Save } from 'lucide-react';

export default function PrePositioningReportsForm({ data, setData, errors, disabled = false }) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        asset_type: '',
        description: '',
        quantity: '',
        location: '',
        deployed_by: '',
        remarks: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        router.post(route('pre-positioning.store'), {
            reports: [formData]
        }, {
            preserveScroll: true,
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Deployment of Response Assets</h3>
                        <p className="text-sm text-gray-600">One report per typhoon — update anytime to keep information current</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Asset Type
                            </label>
                            <select
                                value={formData.asset_type}
                                onChange={(e) => handleChange('asset_type', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                disabled={disabled}
                            >
                                <option value="">Select type...</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Vehicle">Vehicle</option>
                                <option value="Personnel">Personnel</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Medical">Medical</option>
                                <option value="Communication">Communication</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., Rescue boat, Medical supplies"
                                disabled={disabled}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity
                            </label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => handleChange('quantity', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="0"
                                disabled={disabled}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Deployment location"
                                disabled={disabled}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deployed By
                            </label>
                            <input
                                type="text"
                                value={formData.deployed_by}
                                onChange={(e) => handleChange('deployed_by', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Organization/Team"
                                disabled={disabled}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Remarks
                            </label>
                            <input
                                type="text"
                                value={formData.remarks}
                                onChange={(e) => handleChange('remarks', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Additional notes"
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={disabled || isSaving}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Report'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
