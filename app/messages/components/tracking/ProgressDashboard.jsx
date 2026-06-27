    // app/messages/components/tracking/ProgressDashboard.jsx
// 📊 Comprehensive progress tracking dashboard for swap section

import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, Clock, Award, Target, Calendar, 
    Video, Phone, FileText, X, Download, BarChart3 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ProgressDashboard = ({ conversationId, currentUser, otherUser, swapAgreement, onClose }) => {
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgressData();
    }, [conversationId]);

    const loadProgressData = async () => {
        try {
            // Load completed sessions
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('swap_sessions')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('completed_at', { ascending: false });

            if (sessionsError) throw sessionsError;
            setSessions(sessionsData || []);

            // Calculate statistics
            const totalMinutes = sessionsData?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
            const totalHours = totalMinutes / 60;
            const videoSessions = sessionsData?.filter(s => s.session_type === 'video').length || 0;
            const voiceSessions = sessionsData?.filter(s => s.session_type === 'voice').length || 0;

            setStats({
                totalHours: totalHours.toFixed(1),
                totalSessions: sessionsData?.length || 0,
                videoSessions,
                voiceSessions,
                averageSession: sessionsData?.length > 0 
                    ? (totalMinutes / sessionsData.length).toFixed(0)
                    : 0
            });

            setLoading(false);
        } catch (error) {
            console.error('Error loading progress:', error);
            setLoading(false);
        }
    };

    const downloadProgressReport = () => {
        // Generate CSV report
        const headers = ['Date', 'Duration (mins)', 'Type', 'Recorded'];
        const rows = sessions.map(s => [
            new Date(s.completed_at).toLocaleDateString(),
            s.duration_minutes,
            s.session_type,
            s.recorded ? 'Yes' : 'No'
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillswap_progress_${conversationId}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-slate-900 rounded-2xl p-8">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-white mt-4">Loading progress...</p>
                </div>
            </div>
        );
    }

    const totalHours = swapAgreement?.hours || 10;
    const completedHours = parseFloat(stats?.totalHours || 0);
    const progressPercent = Math.min((completedHours / totalHours) * 100, 100);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Progress Dashboard</h2>
                            <p className="text-sm text-gray-400">Tracking your skill swap with @{otherUser.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadProgressReport}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold flex items-center gap-2 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Overall Progress */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
                            <span className="text-2xl font-bold text-purple-400">
                                {progressPercent.toFixed(0)}%
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-500 relative"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                                <span className="text-white font-semibold">{completedHours}</span> of {totalHours} hours completed
                            </span>
                            <span className="text-gray-400">
                                <span className="text-white font-semibold">{(totalHours - completedHours).toFixed(1)}</span> hours remaining
                            </span>
                        </div>

                        {/* Milestones */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-500/20">
                            {[25, 50, 75, 100].map(milestone => {
                                const reached = progressPercent >= milestone;
                                return (
                                    <div key={milestone} className="text-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                                            reached 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-slate-700 text-gray-500'
                                        }`}>
                                            {reached ? <Award className="w-5 h-5" /> : milestone}
                                        </div>
                                        <span className={`text-xs ${reached ? 'text-green-400' : 'text-gray-500'}`}>
                                            {milestone}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <span className="text-sm text-gray-400">Total Hours</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.totalHours}h</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <span className="text-sm text-gray-400">Sessions</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Video className="w-5 h-5 text-purple-400" />
                                <span className="text-sm text-gray-400">Video Calls</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.videoSessions}</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Phone className="w-5 h-5 text-pink-400" />
                                <span className="text-sm text-gray-400">Voice Calls</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.voiceSessions}</p>
                        </div>
                    </div>

                    {/* Session History */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Session History
                        </h3>

                        {sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-400">No sessions completed yet</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Start your first session to track progress
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {sessions.map((session, index) => {
                                    const sessionDate = new Date(session.completed_at);
                                    const isVideo = session.session_type === 'video';

                                    return (
                                        <div
                                            key={session.id}
                                            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        isVideo ? 'bg-purple-500/20' : 'bg-pink-500/20'
                                                    }`}>
                                                        {isVideo ? (
                                                            <Video className="w-5 h-5 text-purple-400" />
                                                        ) : (
                                                            <Phone className="w-5 h-5 text-pink-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold">
                                                            Session #{sessions.length - index}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            {sessionDate.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })} at {sessionDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold">
                                                        {session.duration_minutes} mins
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {(session.duration_minutes / 60).toFixed(1)}h
                                                    </p>
                                                </div>
                                            </div>

                                            {session.recorded && (
                                                <div className="mt-2 pt-2 border-t border-slate-600">
                                                    <span className="text-xs text-red-400 flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                        Session was recorded
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Completion Message */}
                    {progressPercent >= 100 && (
                        <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-6 text-center">
                            <Award className="w-16 h-16 mx-auto mb-4 text-green-400" />
                            <h3 className="text-2xl font-bold text-white mb-2">
                                🎉 Congratulations!
                            </h3>
                            <p className="text-gray-300 mb-4">
                                You've completed your {totalHours}-hour skill swap agreement!
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold transition-all">
                                Download Certificate
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgressDashboard;