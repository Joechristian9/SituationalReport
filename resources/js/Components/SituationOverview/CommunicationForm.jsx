import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAppUrl from "@/hooks/useAppUrl";
import { usePage } from "@inertiajs/react";
import { Radio, Loader2, Save, AlertCircle, Plus, X, History } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function CommunicationForm({ data, setData, errors, disabled = false }) {
    const APP_URL = useAppUrl();
    const { typhoon, auth } = usePage().props;
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [formData, setFormData] = useState({
        globe: "",
        smart: "",
        pldt_landline: "",
        pldt_internet: "",
        vhf: "",
        remarks: ""
    });
    
    // Dynamic services state
    const [services, setServices] = useState({
        cellphone: [],
        internet: [],
        radio: []
    });
    const [dynamicValues, setDynamicValues] = useState({});
    const [showAddService, setShowAddService] = useState(false);
    const [newService, setNewService] = useState({ name: '', category: 'cellphone' });
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [isAddingService, setIsAddingService] = useState(false);
    const [isRemovingService, setIsRemovingService] = useState(false);
    
    const [previousDisabled, setPreviousDisabled] = useState(disabled);
    
    // Fetch modification history
    const {
        data: modificationData,
        isError,
        error,
    } = useQuery({
        queryKey: ["communication-modifications"],
        queryFn: async () => {
            const { data } = await axios.get(
                `${APP_URL}/modifications/communication`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
    
    // Check if user has communication form access (CDRRMO users)
    const canManageServices = auth?.user?.permissions?.some(p => p.name === 'access-communication-form') || 
                              auth?.user?.roles?.some(role => role.name === 'admin');
    
    // Fetch available services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get(`${APP_URL}/communication-services`);
                if (response.data && response.data.services) {
                    setServices(response.data.services);
                }
            } catch (err) {
                console.error('Failed to fetch services:', err);
            }
        };
        fetchServices();
    }, [APP_URL]);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    
    useEffect(() => {
        const communications = data.communications ?? [];
        
        // Check if typhoon was recently resumed
        const typhoonResumedAt = typhoon?.resumed_at;
        
        if (communications.length > 0) {
            const firstComm = communications[0];
            
            // Store the record ID for modification tracking
            setCurrentRecordId(firstComm.id);
            
            // If typhoon was resumed and this record was created BEFORE the resume, don't load it
            if (typhoonResumedAt && firstComm.created_at) {
                const commCreatedAt = new Date(firstComm.created_at);
                const resumedAt = new Date(typhoonResumedAt);
                
                if (commCreatedAt < resumedAt) {
                    // This is old data from before resume, keep form empty
                    return;
                }
            }
            
            const loadedData = {
                globe: firstComm.globe || "",
                smart: firstComm.smart || "",
                pldt_landline: firstComm.pldt_landline || "",
                pldt_internet: firstComm.pldt_internet || "",
                vhf: firstComm.vhf || "",
                remarks: firstComm.remarks || ""
            };
            setFormData(loadedData);
            
            // Load dynamic service values
            if (firstComm.service_values) {
                const dynamicVals = {};
                firstComm.service_values.forEach(sv => {
                    dynamicVals[`service_${sv.service_id}`] = sv.status || "";
                });
                setDynamicValues(dynamicVals);
            }
            
            setOriginalData(JSON.parse(JSON.stringify({ ...loadedData, dynamicValues })));
        }
    }, [data.communications, typhoon]);
    
    useEffect(() => {
        if (previousDisabled === true && disabled === false) {
            if (formData.globe || formData.smart || formData.pldt_landline || formData.pldt_internet || formData.vhf || formData.remarks) {
                const emptyData = {
                    globe: "",
                    smart: "",
                    pldt_landline: "",
                    pldt_internet: "",
                    vhf: "",
                    remarks: ""
                };
                setFormData(emptyData);
                setOriginalData(null);
            }
        }
        setPreviousDisabled(disabled);
    }, [disabled]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('service_')) {
            setDynamicValues(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
    const handleAddService = async () => {
        if (!newService.name.trim()) {
            toast.error("Please enter a service name");
            return;
        }
        
        setIsAddingService(true);
        try {
            const response = await axios.post(`${APP_URL}/communication-services`, newService);
            if (response.data && response.data.service) {
                // Refresh services
                const servicesResponse = await axios.get(`${APP_URL}/communication-services`);
                if (servicesResponse.data && servicesResponse.data.services) {
                    setServices(servicesResponse.data.services);
                }
                toast.success("Service added successfully!");
                setNewService({ name: '', category: 'cellphone' });
                setShowAddService(false);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to add service");
        } finally {
            setIsAddingService(false);
        }
    };
    
    const handleRemoveService = (serviceId) => {
        setServiceToDelete(serviceId);
        setShowConfirmDelete(true);
    };
    
    const confirmRemoveService = async () => {
        if (!serviceToDelete) return;
        
        setIsRemovingService(true);
        try {
            await axios.delete(`${APP_URL}/communication-services/${serviceToDelete}`);
            // Refresh services
            const response = await axios.get(`${APP_URL}/communication-services`);
            if (response.data && response.data.services) {
                setServices(response.data.services);
            }
            toast.success("Service removed successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to remove service");
        } finally {
            setIsRemovingService(false);
            setShowConfirmDelete(false);
            setServiceToDelete(null);
        }
    };

    const handleRemarksFocus = () => {
        if (!formData.remarks || formData.remarks.trim() === '') {
            const dateTimeString = currentDateTime.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            setFormData(prev => ({
                ...prev,
                remarks: `As of ${dateTimeString}: `
            }));
        }
    };

    const hasData = useMemo(() => {
        const hasFormData = formData.globe.trim() !== '' || 
               formData.smart.trim() !== '' || 
               formData.pldt_landline.trim() !== '' || 
               formData.pldt_internet.trim() !== '' || 
               formData.vhf.trim() !== '' || 
               formData.remarks.trim() !== '';
        
        const hasDynamicData = Object.values(dynamicValues).some(val => val.trim() !== '');
        
        return hasFormData || hasDynamicData;
    }, [formData, dynamicValues]);

    const hasChanges = useMemo(() => {
        if (!originalData) return hasData;
        const currentData = { ...formData, dynamicValues };
        return JSON.stringify(originalData) !== JSON.stringify(currentData);
    }, [originalData, formData, dynamicValues, hasData]);

    const handleSubmit = async () => {
        if (disabled) {
            toast.error("Forms are currently disabled.");
            return;
        }
        if (!hasChanges) {
            toast.info("No changes to save");
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Prepare service values for submission
            const serviceValues = Object.entries(dynamicValues).map(([key, value]) => ({
                service_id: parseInt(key.replace('service_', '')),
                status: value
            })).filter(sv => sv.status.trim() !== '');
            
            // Include the ID if we're updating an existing record
            const communicationToSubmit = {
                ...formData,
                service_values: serviceValues,
                ...(currentRecordId && { id: currentRecordId })
            };
            
            const response = await axios.post(`${APP_URL}/communication-reports`, {
                communications: [communicationToSubmit],
            });
            
            if (response.data && Array.isArray(response.data.communications)) {
                setData("communications", response.data.communications);
                
                // Update the record ID if it's a new record
                if (response.data.communications[0]?.id) {
                    setCurrentRecordId(response.data.communications[0].id);
                }
                
                setOriginalData(JSON.parse(JSON.stringify({ ...formData, dynamicValues })));
                
                // Invalidate and refetch modification history
                await queryClient.invalidateQueries(['communication-modifications']);
            }
            
            toast.success("Communication report saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save communication report.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Helper function to get field modification history
    const getFieldHistory = (fieldName) => {
        if (!currentRecordId || !modificationData?.history) return [];
        const historyKey = `${currentRecordId}_${fieldName}`;
        return modificationData.history[historyKey] || [];
    };
    
    // Helper component to display modification indicator
    const ModificationIndicator = ({ fieldName }) => {
        const fieldHistory = getFieldHistory(fieldName);
        const [isOpen, setIsOpen] = useState(false);
        const [isPinned, setIsPinned] = useState(false); // Track if popover is pinned by click
        const buttonRef = React.useRef(null);
        const [popoverStyle, setPopoverStyle] = useState({});
        
        // Only show icon if this specific field has been modified
        if (fieldHistory.length === 0) return null;
        
        // Get the latest (current) and previous updates
        const currentUpdate = fieldHistory[0]; // Most recent
        const previousUpdate = fieldHistory.length > 1 ? fieldHistory[1] : null; // Second most recent
        
        // Check if this field was updated in the most recent submit (within last 5 minutes)
        const wasJustUpdated = currentUpdate && (new Date() - new Date(currentUpdate.date)) < 5 * 60 * 1000;
        
        // Calculate popover position when opened
        React.useEffect(() => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const popoverWidth = 384; // w-96 = 384px
                const popoverHeight = 400; // estimated
                
                let left = rect.right + 8; // 8px gap from button
                let top = rect.top;
                
                // Check if popover would go off right edge
                if (left + popoverWidth > window.innerWidth) {
                    left = rect.left - popoverWidth - 8; // Show on left side instead
                }
                
                // Check if popover would go off bottom edge
                if (top + popoverHeight > window.innerHeight) {
                    top = window.innerHeight - popoverHeight - 16; // 16px padding from bottom
                }
                
                // Make sure it doesn't go off top edge
                if (top < 16) {
                    top = 16; // 16px padding from top
                }
                
                setPopoverStyle({
                    left: `${left}px`,
                    top: `${top}px`
                });
            }
        }, [isOpen]);
        
        const handleMouseEnter = () => {
            setIsOpen(true);
        };
        
        const handleMouseLeave = () => {
            // Only close on mouse leave if not pinned
            if (!isPinned) {
                setIsOpen(false);
            }
        };
        
        const handleClick = (e) => {
            e.stopPropagation();
            setIsPinned(!isPinned); // Toggle pinned state
            setIsOpen(true); // Always open when clicked
        };
        
        const handleClose = () => {
            setIsOpen(false);
            setIsPinned(false);
        };
        
        return (
            <>
                <div 
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* "New" badge for just updated fields - NO animation */}
                    {wasJustUpdated && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            New
                        </span>
                    )}
                    
                    {/* History icon button */}
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={handleClick}
                        className={`transition-colors relative ${
                            wasJustUpdated 
                                ? 'text-green-600 hover:text-green-800' 
                                : 'text-blue-600 hover:text-blue-800'
                        }`}
                        title="View modification history"
                    >
                        <History className="w-5 h-5" />
                        {/* Notification dot for recent updates */}
                        {wasJustUpdated && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                        )}
                    </button>
                </div>
                
                {isOpen && (
                    <>
                        {/* Backdrop to close popover when clicking outside - only if pinned */}
                        {isPinned && (
                            <div 
                                className="fixed inset-0 z-[9998]" 
                                onClick={handleClose}
                            />
                        )}
                        
                        {/* Popover - positioned fixed relative to button */}
                        <div 
                            className="fixed bg-white rounded-lg shadow-2xl border-2 border-blue-300 z-[9999] w-96 max-h-[80vh] overflow-y-auto"
                            style={popoverStyle}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-semibold">
                                        Change History
                                    </span>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors flex-shrink-0"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="p-3 space-y-3">
                                {/* Current Update - Show at TOP */}
                                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {currentUpdate.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                                                {currentUpdate.user?.name || 'Unknown User'}
                                                {wasJustUpdated && (
                                                    <span className="bg-green-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full uppercase">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-blue-600">
                                                {new Date(currentUpdate.date).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs pl-8">
                                        {currentUpdate.old !== null && currentUpdate.old !== undefined && (
                                            <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                                <div className="text-red-900 break-words">
                                                    {currentUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                                </div>
                                            </div>
                                        )}
                                        <div className="bg-green-50 border border-green-200 rounded p-2">
                                            <div className="font-semibold text-green-700 mb-0.5">Current:</div>
                                            <div className="text-green-900 break-words font-semibold">
                                                {currentUpdate.new || <span className="italic text-green-400">(empty)</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Previous Update (if exists) - Show at BOTTOM */}
                                {previousUpdate && (
                                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                {previousUpdate.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-700 text-xs">
                                                    {previousUpdate.user?.name || 'Unknown User'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(previousUpdate.date).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-xs pl-8">
                                            <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <div className="font-semibold text-red-700 mb-0.5">Previous:</div>
                                                <div className="text-red-900 break-words">
                                                    {previousUpdate.old || <span className="italic text-red-400">(empty)</span>}
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                                <div className="font-semibold text-yellow-700 mb-0.5">Updated to:</div>
                                                <div className="text-yellow-900 break-words">
                                                    {previousUpdate.new || <span className="italic text-yellow-400">(empty)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    };

    return (
        <>
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 shadow-md">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                    <Radio className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-lg">Communication Status Update</h4>
                    <p className="text-blue-700 text-sm">
                        One report per typhoon — update anytime to keep information current. All changes are tracked in History.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-blue-50 border-b border-blue-200">
                            <th className="text-left p-4 font-semibold text-blue-900 border-r border-blue-200" colSpan={2 + (services.cellphone?.length || 0)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        CELLPHONE (SMS & CALL)
                                    </div>
                                    {canManageServices && (
                                        <button
                                            onClick={() => { setNewService({ name: '', category: 'cellphone' }); setShowAddService(true); }}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            disabled={disabled}
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-blue-900 border-r border-blue-200" colSpan={1 + (services.internet?.length || 0)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        Internet
                                    </div>
                                    {canManageServices && (
                                        <button
                                            onClick={() => { setNewService({ name: '', category: 'internet' }); setShowAddService(true); }}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            disabled={disabled}
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-blue-900 border-r border-blue-200" colSpan={1 + (services.radio?.length || 0)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        Radio
                                    </div>
                                    {canManageServices && (
                                        <button
                                            onClick={() => { setNewService({ name: '', category: 'radio' }); setShowAddService(true); }}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            disabled={disabled}
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-blue-900">
                                <div className="flex items-center gap-2">
                                    REMARKS
                                </div>
                            </th>
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {/* Default cellphone services */}
                            <th className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm">GLOBE</th>
                            <th className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm">SMART</th>
                            
                            {/* Dynamic cellphone services */}
                            {services.cellphone?.filter(service => 
                                !['GLOBE', 'SMART'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <th key={service.id} className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm relative group">
                                    {service.name}
                                    {canManageServices && (
                                        <button
                                            onClick={() => handleRemoveService(service.id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                                            disabled={disabled}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </th>
                            ))}
                            
                            {/* Default internet service */}
                            <th className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm">POLARIS</th>
                            
                            {/* Dynamic internet services */}
                            {services.internet?.filter(service => 
                                !['POLARIS'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <th key={service.id} className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm relative group">
                                    {service.name}
                                    {canManageServices && (
                                        <button
                                            onClick={() => handleRemoveService(service.id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                                            disabled={disabled}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </th>
                            ))}
                            
                            {/* Default radio service */}
                            <th className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm">VHF</th>
                            
                            {/* Dynamic radio services */}
                            {services.radio?.filter(service => 
                                !['VHF'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <th key={service.id} className="text-center p-3 font-medium text-gray-600 border-r border-gray-200 text-sm relative group">
                                    {service.name}
                                    {canManageServices && (
                                        <button
                                            onClick={() => handleRemoveService(service.id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                                            disabled={disabled}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </th>
                            ))}
                            
                            <th className="text-center p-3 font-medium text-gray-600 text-sm"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover:bg-gray-50 transition-colors">
                            {/* Default cellphone inputs */}
                            <td className="p-3 border-r border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="globe"
                                        value={formData.globe}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Serviceable"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                    <ModificationIndicator fieldName="globe" />
                                </div>
                            </td>
                            <td className="p-3 border-r border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="smart"
                                        value={formData.smart}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Serviceable"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                    <ModificationIndicator fieldName="smart" />
                                </div>
                            </td>
                            
                            {/* Dynamic cellphone inputs */}
                            {services.cellphone?.filter(service => 
                                !['GLOBE', 'SMART'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <td key={service.id} className="p-3 border-r border-gray-200">
                                    <input
                                        type="text"
                                        name={`service_${service.id}`}
                                        value={dynamicValues[`service_${service.id}`] || ""}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Serviceable"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                </td>
                            ))}
                            
                            {/* Default internet input */}
                            <td className="p-3 border-r border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="pldt_internet"
                                        value={formData.pldt_internet}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Serviceable"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                    <ModificationIndicator fieldName="pldt_internet" />
                                </div>
                            </td>
                            
                            {/* Dynamic internet inputs */}
                            {services.internet?.filter(service => 
                                !['POLARIS'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <td key={service.id} className="p-3 border-r border-gray-200">
                                    <input
                                        type="text"
                                        name={`service_${service.id}`}
                                        value={dynamicValues[`service_${service.id}`] || ""}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Serviceable"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                </td>
                            ))}
                            
                            {/* Default radio input */}
                            <td className="p-3 border-r border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="vhf"
                                        value={formData.vhf}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Functional"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                    <ModificationIndicator fieldName="vhf" />
                                </div>
                            </td>
                            
                            {/* Dynamic radio inputs */}
                            {services.radio?.filter(service => 
                                !['VHF'].includes(service.name.toUpperCase())
                            ).map(service => (
                                <td key={service.id} className="p-3 border-r border-gray-200">
                                    <input
                                        type="text"
                                        name={`service_${service.id}`}
                                        value={dynamicValues[`service_${service.id}`] || ""}
                                        onChange={handleInputChange}
                                        disabled={disabled}
                                        placeholder="e.g., Functional"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed text-center"
                                    />
                                </td>
                            ))}
                            
                            {/* Remarks */}
                            <td className="p-3">
                                <div className="relative">
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        onFocus={handleRemarksFocus}
                                        rows="2"
                                        disabled={disabled}
                                        placeholder="Click to auto-fill date and time..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                                    />
                                    <ModificationIndicator fieldName="remarks" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-5 border-t border-gray-200">
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !hasChanges || !hasData || disabled}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Submitting...</span>
                        </>
                    ) : !hasData ? (
                        <>
                            <AlertCircle className="w-5 h-5" />
                            <span>Fill in the form</span>
                        </>
                    ) : hasChanges ? (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Submit Report</span>
                        </>
                    ) : (
                        <>
                            <span>No Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
        
        {/* Add Service Modal - Moved outside main container */}
        {showAddService && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Service</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Service Name</label>
                            <input
                                type="text"
                                value={newService.name}
                                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., TM, DITO, Sky Cable"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                            <select
                                value={newService.category}
                                onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            >
                                <option value="cellphone">Cellphone (SMS & Call)</option>
                                <option value="internet">Internet</option>
                                <option value="radio">Radio</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowAddService(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddService}
                            disabled={isAddingService}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAddingService && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isAddingService ? 'Adding...' : 'Add Service'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Confirmation Modal for Deleting Service */}
        {showConfirmDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Remove Service</h3>
                    <p className="text-slate-600 mb-6">
                        Are you sure you want to remove this service? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowConfirmDelete(false);
                                setServiceToDelete(null);
                            }}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmRemoveService}
                            disabled={isRemovingService}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRemovingService && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isRemovingService ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

