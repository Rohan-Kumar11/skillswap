// app/messages/components/calls/IncomingCallScreen.jsx
// 📞 Instagram-Style Incoming Call Screen

import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { SafeAvatar } from '@/app/components/SafeAvatar';

const IncomingCallScreen = ({
  callerName,
  callerAvatar,
  isVideo,
  onAccept,
  onDecline
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999] flex flex-col items-center justify-center animate-fadeIn">
      {/* Pulsing Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar with Pulsing Ring */}
        <div className="relative mb-8">
          {/* Outer Pulse Ring */}
          <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
          
          {/* Middle Pulse Ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse opacity-40" />
          
          {/* Inner Glow Ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 blur-xl" />
          
          {/* Avatar */}
          <div className="relative">
            <SafeAvatar
              user={{
                username: callerName,
                profile_pic: callerAvatar
              }}
              size="2xl"
              className="ring-8 ring-white/20 shadow-2xl"
            />
          </div>
        </div>

        {/* Caller Info */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white mb-2">
            @{callerName}
          </h2>
          <div className="flex items-center justify-center gap-2">
            {isVideo ? (
              <Video className="w-5 h-5 text-purple-300" />
            ) : (
              <Phone className="w-5 h-5 text-purple-300" />
            )}
            <p className="text-lg text-purple-300 font-medium">
              Incoming {isVideo ? 'video' : 'voice'} call...
            </p>
          </div>
        </div>

        {/* Pulsing Dots Animation */}
        <div className="flex gap-2 mb-12">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-8">
          {/* Decline Button */}
          <button
            onClick={onDecline}
            className="group relative"
          >
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-active:scale-95">
              <PhoneOff className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-white font-semibold mt-3 text-center">
              Decline
            </p>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="group relative"
          >
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-active:scale-95">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-white font-semibold mt-3 text-center">
              Accept
            </p>
          </button>
        </div>

        {/* Hint Text */}
        <p className="text-gray-400 text-sm mt-8">
          {isVideo ? '📹' : '📞'} Tap accept to start the call
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default IncomingCallScreen;