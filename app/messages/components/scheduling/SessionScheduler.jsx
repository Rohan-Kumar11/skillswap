// app/messages/components/scheduling/SessionScheduler.jsx
// 📅 Professional session scheduling system

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Check, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '../../../components/Toast';

const SessionScheduler = ({ conversationId, currentUser, otherUser, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [duration, setDuration] = useState(60); // minutes
    const [note, setNote] = useState('');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('calendar'); // calendar, list
    const toast = useToast();

    useEffect(() => {
        loadScheduledSessions();
    }, [conversationId]);

    const loadScheduledSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('scheduled_sessions')
                .select('*')
                .eq('conversation_id', conversationId)
                .gte('scheduled_at', new Date().toISOString())
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const scheduleSession = async () => {
        if (!selectedTime) {
            toast.error('Please select a time');
            return;
        }

        setLoading(true);
        try {
            const scheduledDateTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Check if time is in the future
            if (scheduledDateTime <= new Date()) {
                toast.error('Please select a future time');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('scheduled_sessions')
                .insert({
                    conversation_id: conversationId,
                    scheduled_by: currentUser.id,
                    other_user_id: otherUser.id,
                    scheduled_at: scheduledDateTime.toISOString(),
                    duration_minutes: duration,
                    note: note.trim(),
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Send notification
            await sendScheduleNotification(data);

            toast.success('Session scheduled! Notification sent.');
            setSelectedTime('');
            setNote('');
            loadScheduledSessions();
        } catch (error) {
            console.error('Error scheduling session:', error);
            toast.error('Failed to schedule session');
        } finally {
            setLoading(false);
        }
    };

    const sendScheduleNotification = async (session) => {
        try {
            await supabase
                .from('notifications')
                .insert({
                    user_id: otherUser.id,
                    type: 'session_scheduled',
                    title: 'New Session Scheduled',
                    message: `${currentUser.user_metadata?.username || 'Someone'} scheduled a session with you`,
                    data: { session_id: session.id, conversation_id: conversationId },
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const cancelSession = async (sessionId) => {
        if (!window.confirm('Cancel this session?')) return;

        try {
            const { error } = await supabase
                .from('scheduled_sessions')
                .update({ status: 'cancelled' })
                .eq('id', sessionId);

            if (error) throw error;
            toast.success('Session cancelled');
            loadScheduledSessions();
        } catch (error) {
            console.error('Error cancelling session:', error);
            toast.error('Failed to cancel session');
        }
    };

    const confirmSession = async (sessionId) => {
        try {
            const { error } = await supabase
                .from('scheduled_sessions')
                .update({ status: 'confirmed' })
                .eq('id', sessionId);

            if (error) throw error;
            toast.success('Session confirmed');
            loadScheduledSessions();
        } catch (error) {
            console.error('Error confirming session:', error);
            toast.error('Failed to confirm session');
        }
    };

    // Generate time slots (9 AM - 9 PM)
    const timeSlots = [];
    for (let hour = 9; hour <= 21; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 21) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
    }

    // Calendar navigation
    const goToPrevMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setSelectedDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setSelectedDate(newDate);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const days = getDaysInMonth(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Schedule Session</h2>
                            <p className="text-sm text-gray-400">with @{otherUser.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
                        >
                            {view === 'calendar' ? 'View List' : 'View Calendar'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex">
                    {/* Calendar View */}
                    {view === 'calendar' ? (
                        <>
                            {/* Calendar */}
                            <div className="flex-1 p-6">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={goToPrevMonth}
                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button
                                        onClick={goToNextMonth}
                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {days.map((day, index) => {
                                        if (!day) {
                                            return <div key={`empty-${index}`} className="aspect-square" />;
                                        }

                                        const isToday = day.getTime() === today.getTime();
                                        const isSelected = day.getTime() === new Date(selectedDate).setHours(0,0,0,0);
                                        const isPast = day < today;
                                        const hasSessions = sessions.some(s => 
                                            new Date(s.scheduled_at).toDateString() === day.toDateString()
                                        );

                                        return (
                                            <button
                                                key={day.toISOString()}
                                                onClick={() => !isPast && setSelectedDate(day)}
                                                disabled={isPast}
                                                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${
                                                    isPast
                                                        ? 'text-gray-600 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'bg-purple-500 text-white font-bold'
                                                        : isToday
                                                        ? 'bg-blue-500/20 text-blue-400 font-semibold'
                                                        : 'hover:bg-slate-700 text-gray-300'
                                                }`}
                                            >
                                                <span className="text-sm">{day.getDate()}</span>
                                                {hasSessions && (
                                                    <div className="absolute bottom-1 w-1 h-1 bg-green-400 rounded-full"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Booking Form */}
                            <div className="w-96 border-l border-slate-700 p-6 bg-slate-800/50">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    {selectedDate.toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </h3>

                                {/* Time Selection */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Select Time
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                        {timeSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                                                    selectedTime === time
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Duration
                                    </label>
                                    <div className="flex gap-2">
                                        {[30, 60, 90, 120].map(mins => (
                                            <button
                                                key={mins}
                                                onClick={() => setDuration(mins)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                    duration === mins
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                }`}
                                            >
                                                {mins}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Note (optional)
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="What will you cover in this session?"
                                        className="w-full bg-slate-700 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        rows={3}
                                    />
                                </div>

                                {/* Schedule Button */}
                                <button
                                    onClick={scheduleSession}
                                    disabled={!selectedTime || loading}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                                >
                                    {loading ? (
                                        <>Scheduling...</>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Schedule Session
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* List View */
                        <div className="flex-1 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Upcoming Sessions</h3>
                            
                            {sessions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                    <p className="text-gray-400">No sessions scheduled yet</p>
                                    <button
                                        onClick={() => setView('calendar')}
                                        className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold"
                                    >
                                        Schedule First Session
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map(session => {
                                        const sessionDate = new Date(session.scheduled_at);
                                        const isPending = session.status === 'pending';
                                        const isScheduledByMe = session.scheduled_by === currentUser.id;

                                        return (
                                            <div
                                                key={session.id}
                                                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <Clock className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-semibold">
                                                                {sessionDate.toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                            <p className="text-sm text-gray-400">
                                                                {sessionDate.toLocaleTimeString('en-US', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit'
                                                                })} • {session.duration_minutes} minutes
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isPending && !isScheduledByMe && (
                                                            <button
                                                                onClick={() => confirmSession(session.id)}
                                                                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                                                                title="Confirm"
                                                            >
                                                                <Check className="w-4 h-4 text-green-400" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => cancelSession(session.id)}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {session.note && (
                                                    <p className="text-sm text-gray-300 mt-2 pl-13">
                                                        {session.note}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-3 pl-13">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        session.status === 'confirmed'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {session.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                                                    </span>
                                                    {isPending && !isScheduledByMe && (
                                                        <span className="text-xs text-gray-400">
                                                            Waiting for your confirmation
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionScheduler;