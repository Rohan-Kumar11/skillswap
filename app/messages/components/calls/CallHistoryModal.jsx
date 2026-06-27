// app/messages/components/calls/CallHistoryModal.jsx
// 📊 Call History Viewer

import React, { useState, useEffect } from 'react';
import { X, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react';
import { CallDatabaseService } from '@/lib/calls/SignalingService';
import { formatCallTimestamp, formatCallDuration } from '@/lib/calls/mediaHelpers';
import { SafeAvatar } from '@/app/components/SafeAvatar';

export const CallHistoryModal = ({ isOpen, onClose, conversationId, otherUser }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadCallHistory();
    }
  }, [isOpen, conversationId]);

  const loadCallHistory = async () => {
    setLoading(true);
    try {
      const history = await CallDatabaseService.getCallHistory(conversationId);
      setCallHistory(history);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getCallIcon = (call, currentUserId) => {
    const isOutgoing = call.caller_id === currentUserId;
    
    if (call.status === 'missed' && !isOutgoing) {
      return <PhoneMissed className="w-4 h-4 text-red-400" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="w-4 h-4 text-green-400" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-blue-400" />;
  };

  const getCallStatusText = (call, currentUserId) => {
    const isOutgoing = call.caller_id === currentUserId;
    
    switch (call.status) {
      case 'ended':
        return isOutgoing ? 'Outgoing' : 'Incoming';
      case 'missed':
        return 'Missed';
      case 'declined':
        return 'Declined';
      case 'failed':
        return 'Failed';
      default:
        return call.status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fadeIn">
      <div className="bg-slate-800 rounded-2xl border border-purple-500/30 w-full max-w-md mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <SafeAvatar user={otherUser} size="sm" />
            <div>
              <h3 className="text-lg font-bold text-white">Call History</h3>
              <p className="text-xs text-gray-400">@{otherUser.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading history...</p>
            </div>
          ) : callHistory.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No call history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {callHistory.map(call => (
                <div
                  key={call.id}
                  className="bg-slate-900/50 rounded-xl p-3 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        call.status === 'missed' ? 'bg-red-500/20' :
                        call.status === 'ended' ? 'bg-green-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {getCallIcon(call, otherUser.id)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          {call.call_type === 'video' ? (
                            <Video className="w-3 h-3 text-purple-400" />
                          ) : (
                            <Phone className="w-3 h-3 text-purple-400" />
                          )}
                          <span className="text-sm font-medium text-white">
                            {getCallStatusText(call, otherUser.id)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatCallTimestamp(call.created_at)}
                        </p>
                      </div>
                    </div>

                    {call.status === 'ended' && call.duration_seconds > 0 && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {formatCallDuration(call.duration_seconds)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ===============================================================
// Missed Call Badge Component
// ===============================================================

export const MissedCallBadge = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-all"
    >
      <PhoneMissed className="w-4 h-4 text-red-400" />
      <span className="text-xs text-red-400 font-semibold">
        {count} missed {count === 1 ? 'call' : 'calls'}
      </span>
    </button>
  );
};

export default CallHistoryModal;