// app/messages/components/InlineSwapActions.jsx

import React from 'react';
import { Check, X, Loader, Zap } from 'lucide-react';

const InlineSwapActions = ({ request, onAccept, onDecline, loading }) => {
    return (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 rounded-xl p-4 my-3 animate-pulse-slow">
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-white">
                    Professional Swap Request
                </span>
            </div>

            <p className="text-xs text-gray-300 mb-4">
                <span className="font-semibold text-white">{request.requesterName}</span> wants
                to upgrade this conversation to a Professional Skill Swap with scheduling,
                hour tracking, and enhanced features.
            </p>

            <div className="flex gap-2">
                <button
                    onClick={() => onAccept(request.id)}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold text-sm hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    {loading ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Accept & Move to Swap
                        </>
                    )}
                </button>

                <button
                    onClick={() => onDecline(request.id)}
                    disabled={loading}
                    className="px-4 py-3 bg-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-600 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-2">
                💡 Declining keeps the conversation in Common section
            </p>
        </div>
    );
};

export default InlineSwapActions;