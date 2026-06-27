// app/messages/components/HeaderActions.jsx
// 📞 Updated Header Actions with Call History

import React, { useState, useEffect, useRef } from 'react';
import { 
    Phone, Video, MoreVertical, Calendar, TrendingUp, 
    Share2, FileText, Settings, X, Clock, CheckCircle, History
} from 'lucide-react';

// ⭐ More Options Dropdown Menu (UPDATED)
export const MoreOptionsMenu = ({ 
    isOpen, 
    onClose, 
    recipientName,
    conversationId,
    onShare,
    onSchedule,
    onProgress,
    onViewCallHistory, // ⭐ NEW
    activeSection,
    buttonRef 
}) => {
    const menuRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuRef.current && 
                !menuRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={menuRef}
            className="absolute top-full right-4 mt-2 bg-slate-800 border border-purple-500/30 rounded-xl shadow-2xl py-2 z-50 min-w-[220px] animate-slideDown"
        >
            {/* Header */}
            <div className="px-4 py-2 border-b border-purple-500/20">
                <p className="text-xs text-gray-400">Options for @{recipientName}</p>
            </div>

            {/* ⭐ NEW: Call History */}
            <button
                onClick={() => {
                    onViewCallHistory();
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
                <History className="w-4 h-4 text-blue-400" />
                <div>
                    <p className="text-sm text-white font-medium">Call History</p>
                    <p className="text-xs text-gray-400">View past calls</p>
                </div>
            </button>

            {/* SWAP Section Options */}
            {activeSection === 'swap' && (
                <>
                    <button
                        onClick={() => {
                            onSchedule();
                            onClose();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <div>
                            <p className="text-sm text-white font-medium">Schedule Session</p>
                            <p className="text-xs text-gray-400">Book a time to meet</p>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            onProgress();
                            onClose();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <div>
                            <p className="text-sm text-white font-medium">View Progress</p>
                            <p className="text-xs text-gray-400">Track session history</p>
                        </div>
                    </button>

                    <div className="border-t border-purple-500/20 my-2" />
                </>
            )}

            {/* Common Options */}
            <button
                onClick={() => {
                    onShare();
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
                <Share2 className="w-4 h-4 text-purple-400" />
                <div>
                    <p className="text-sm text-white font-medium">Share Profile</p>
                    <p className="text-xs text-gray-400">Share with others</p>
                </div>
            </button>

            <button
                onClick={() => {
                    console.log('Export chat history');
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
                <FileText className="w-4 h-4 text-orange-400" />
                <div>
                    <p className="text-sm text-white font-medium">Export Chat</p>
                    <p className="text-xs text-gray-400">Download history</p>
                </div>
            </button>

            <div className="border-t border-purple-500/20 my-2" />

            <button
                onClick={() => {
                    console.log('Open settings');
                    onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
                <Settings className="w-4 h-4 text-gray-400" />
                <div>
                    <p className="text-sm text-white font-medium">Settings</p>
                    <p className="text-xs text-gray-400">Conversation settings</p>
                </div>
            </button>
        </div>
    );
};

// ⭐ Share Profile Modal
export const ShareModal = ({ 
    isOpen, 
    onClose, 
    recipientName,
    conversationId 
}) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${window.location.origin}/profile/${recipientName}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full mx-4 animate-scaleIn shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Share Profile</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-gray-300 mb-4">
                        Share @{recipientName}'s profile
                    </p>

                    {/* Share URL */}
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-400 truncate flex-1 mr-2">
                            {shareUrl}
                        </span>
                        <button
                            onClick={handleCopy}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            }`}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Share Options */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <button
                            onClick={() => {
                                window.open(`https://twitter.com/intent/tweet?text=Check out @${recipientName} on SkillSwap!&url=${shareUrl}`, '_blank');
                            }}
                            className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all"
                        >
                            <Share2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <span className="text-xs text-blue-400">Twitter</span>
                        </button>

                        <button
                            onClick={() => {
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
                            }}
                            className="p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-xl transition-all"
                        >
                            <Share2 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <span className="text-xs text-blue-500">LinkedIn</span>
                        </button>

                        <button
                            onClick={() => {
                                window.open(`mailto:?subject=Check out @${recipientName}&body=${shareUrl}`, '_blank');
                            }}
                            className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all"
                        >
                            <Share2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                            <span className="text-xs text-purple-400">Email</span>
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// Add animations CSS
const styles = `
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
    animation: scaleIn 0.2s ease-out;
}

.animate-slideDown {
    animation: slideDown 0.15s ease-out;
}
`;

export default { MoreOptionsMenu, ShareModal };