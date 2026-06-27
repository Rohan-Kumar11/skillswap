// app/messages/components/tracking/SessionTimer.jsx
// ⏱️ Live session timer with progress tracking

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Target } from 'lucide-react';

const SessionTimer = ({ swapAgreement, sessionStartTime }) => {
    const [sessionDuration, setSessionDuration] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(swapAgreement?.progress || 0);

    useEffect(() => {
        if (!sessionStartTime) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
            setSessionDuration(elapsed);
            
            // Update current progress (hours)
            const hoursThisSession = elapsed / 3600;
            setCurrentProgress((swapAgreement?.progress || 0) + hoursThisSession);
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionStartTime, swapAgreement]);

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalHours = swapAgreement?.hours || 10;
    const progressPercent = Math.min((currentProgress / totalHours) * 100, 100);

    return (
        <div className="flex items-center gap-4 bg-slate-700/50 rounded-xl px-4 py-2">
            {/* Session Duration */}
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                    <p className="text-xs text-gray-400">Session Time</p>
                    <p className="text-sm font-bold text-white">{formatDuration(sessionDuration)}</p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-600"></div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div>
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-sm font-bold text-white">
                        {currentProgress.toFixed(1)} / {totalHours}h
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-32">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Completion</span>
                    <span className="text-xs font-semibold text-purple-400">
                        {progressPercent.toFixed(0)}%
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Milestone Alert */}
            {progressPercent >= 50 && progressPercent < 51 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                    <Target className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-300 font-semibold">Halfway!</span>
                </div>
            )}

            {progressPercent >= 100 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-300 font-semibold">Complete! 🎉</span>
                </div>
            )}
        </div>
    );
};

export default SessionTimer;