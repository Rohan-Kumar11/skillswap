// app/messages/components/SwapRequestBadge.jsx

import React from 'react';
import { Zap } from 'lucide-react';

const SwapRequestBadge = ({ request, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl p-4 mb-4 cursor-pointer hover:from-purple-500/30 hover:to-pink-500/30 transition-all animate-pulse-slow shadow-lg"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">
                        🎯 Swap Request Pending
                    </h4>
                    <p className="text-xs text-gray-300">
                        <span className="text-white font-semibold">{request.requesterName}</span> wants
                        to upgrade to Professional Swap
                    </p>
                </div>
            </div>
            <button className="w-full mt-2 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-semibold transition-colors">
                Review Request →
            </button>
        </div>
    );
};

export default SwapRequestBadge;