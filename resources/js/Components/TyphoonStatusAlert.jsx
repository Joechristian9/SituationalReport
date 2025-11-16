import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { AlertTriangle, Cloud, CheckCircle, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

/**
 * TyphoonStatusAlert Component
 * Displays the current typhoon status with visual alerts
 * 
 * @param {Object} typhoon - The active typhoon object (null if no active typhoon)
 * @param {boolean} hasActive - Whether there's an active typhoon
 * @param {boolean} formsDisabled - Whether forms should be disabled
 */
export default function TyphoonStatusAlert({ typhoon, hasActive, formsDisabled = false }) {
    // No active typhoon - show warning
    if (!hasActive || !typhoon) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 shadow-lg mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-amber-900 text-lg">No Active Typhoon Report</CardTitle>
                                <p className="text-sm text-amber-700 mt-1">
                                    Forms are currently disabled. An administrator must create a typhoon report before you can input data.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>
        );
    }

    // Typhoon ended - show info alert
    if (typhoon.status === 'ended' || formsDisabled) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-600 rounded-full">
                                    <Cloud className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-slate-900 text-lg">Typhoon Report Ended</CardTitle>
                                    <p className="text-sm text-slate-700 mt-1">
                                        <strong>{typhoon.name}</strong> - All forms are now disabled. Data collection has been completed.
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-slate-600 hover:bg-slate-700">
                                Ended
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-slate-700 bg-white/50 p-2 rounded">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs">
                                    Started: {format(new Date(typhoon.started_at), 'PPP p')}
                                </span>
                            </div>
                            {typhoon.ended_at && (
                                <div className="flex items-center gap-2 text-slate-700 bg-white/50 p-2 rounded">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">
                                        Ended: {format(new Date(typhoon.ended_at), 'PPP p')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Active typhoon - show success alert
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-full">
                                <Cloud className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-900 text-lg">Active Typhoon: {typhoon.name}</CardTitle>
                                {typhoon.description && (
                                    <p className="text-sm text-blue-700 mt-1">{typhoon.description}</p>
                                )}
                            </div>
                        </div>
                        <Badge className="bg-blue-600 hover:bg-blue-700 animate-pulse">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-blue-700 bg-white/50 p-2 rounded">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">
                                Started: {format(new Date(typhoon.started_at), 'PPP p')}
                            </span>
                        </div>
                        {typhoon.creator?.name && (
                            <div className="flex items-center gap-2 text-blue-700 bg-white/50 p-2 rounded">
                                <User className="w-4 h-4" />
                                <span className="text-xs">
                                    Created by: {typhoon.creator.name}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
