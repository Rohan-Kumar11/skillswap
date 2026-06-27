// app/messages/components/SwapRequestModal.jsx

import React from 'react';
import { Check, X, Loader, Zap, Calendar, Award, Video } from 'lucide-react';

const SwapRequestModal = ({ request, onAccept, onDecline, onClose, loading }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 md:p-8 max-w-md w-full border border-purple-500/30 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Skill Swap Request!
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                        <span className="font-semibold text-white">{request.requesterName}</span> wants
                        to upgrade this conversation to a Professional Swap
                    </p>
                    <div className="bg-white/5 rounded-lg p-3 mt-3">
                        <p className="text-xs text-gray-400 mb-1">Message:</p>
                        <p className="text-sm text-purple-300 italic">"{request.messagePreview}"</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {[
                        { icon: Calendar, title: 'Session Scheduling', desc: 'Plan and track your skill exchange sessions' },
                        { icon: Award, title: 'Hour Tracking', desc: 'Monitor progress with built-in timers' },
                        { icon: Video, title: 'Enhanced Features', desc: 'Access to pro video calls and tools' }
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20">
                            <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1 text-white">{title}</h4>
                                <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
                    <p className="text-xs text-amber-200 text-center">
                        ⚠️ Accepting will move this conversation to the Swap section with professional features
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onDecline(request.id)}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                        Decline
                    </button>
                    <button
                        onClick={() => onAccept(request.id)}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Accept Swap
                            </>
                        )}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    disabled={loading}
                    className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    Decide Later
                </button>
            </div>
        </div>
    );
};

export default SwapRequestModal;