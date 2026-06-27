// app/messages/components/calls/CallUI.jsx
// 📱 Instagram-Style Call Interface

import React, { useRef, useEffect, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Volume2, VolumeX, RotateCw, Maximize2, Minimize2, Loader, Wifi, WifiOff
} from 'lucide-react';
import { SafeAvatar } from '@/app/components/SafeAvatar';
import { CALL_STATES } from '@/lib/calls/CallStateManager';
import { formatCallDuration } from '@/lib/calls/mediaHelpers';

const CallUI = ({
  callState,
  callType,
  otherUser,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  callDuration,
  error,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOff;
      setIsSpeakerOff(!isSpeakerOff);
    }
  };

  // Loading states
  if (
    callState === CALL_STATES.INITIALIZING ||
    callState === CALL_STATES.CALLING ||
    callState === CALL_STATES.CONNECTING
  ) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <SafeAvatar
              user={{
                username: otherUser.username,
                profile_pic: otherUser.profile_pic
              }}
              size="2xl"
              className="relative ring-8 ring-white/20"
            />
          </div>
          
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          
          <p className="text-white text-2xl font-semibold mb-2">
            {callState === CALL_STATES.INITIALIZING && 'Setting up call...'}
            {callState === CALL_STATES.CALLING && 'Calling...'}
            {callState === CALL_STATES.CONNECTING && 'Connecting...'}
          </p>
          
          <p className="text-purple-300">@{otherUser.username}</p>
        </div>
      </div>
    );
  }

  // Call ended/failed state
  if (
    callState === CALL_STATES.ENDED ||
    callState === CALL_STATES.DECLINED ||
    callState === CALL_STATES.MISSED ||
    callState === CALL_STATES.FAILED
  ) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999] flex items-center justify-center">
        <div className="text-center">
          <PhoneOff className="w-20 h-20 text-red-400 mx-auto mb-6" />
          
          <p className="text-white text-2xl font-semibold mb-2">
            {callState === CALL_STATES.ENDED && 'Call Ended'}
            {callState === CALL_STATES.DECLINED && 'Call Declined'}
            {callState === CALL_STATES.MISSED && 'Call Missed'}
            {callState === CALL_STATES.FAILED && 'Call Failed'}
          </p>
          
          {callDuration > 0 && (
            <p className="text-gray-400">
              Duration: {formatCallDuration(callDuration)}
            </p>
          )}
          
          {error && (
            <p className="text-red-400 text-sm mt-2 max-w-sm mx-auto">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Minimized view (picture-in-picture style)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 z-50 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SafeAvatar
              user={{
                username: otherUser.username,
                profile_pic: otherUser.profile_pic
              }}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-white">{otherUser.username}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">{formatCallDuration(callDuration)}</p>
                <Wifi className="w-3 h-3 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onEndCall}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call - Full screen
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999] flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video (Full Screen) */}
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
              <SafeAvatar
                user={{
                  username: otherUser.username,
                  profile_pic: otherUser.profile_pic
                }}
                size="2xl"
                className="relative"
              />
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && !isVideoOff && (
          <div className="absolute top-4 right-4 w-32 h-44 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            <button
              onClick={onSwitchCamera}
              className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full transition-all"
            >
              <RotateCw className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <SafeAvatar
              user={{
                username: otherUser.username,
                profile_pic: otherUser.profile_pic
              }}
              size="xs"
            />
            <p className="text-white font-semibold">@{otherUser.username}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-300">{formatCallDuration(callDuration)}</p>
            {callState === CALL_STATES.RECONNECTING ? (
              <>
                <Loader className="w-4 h-4 text-orange-400 animate-spin" />
                <p className="text-sm text-orange-400">Reconnecting...</p>
              </>
            ) : (
              <Wifi className="w-4 h-4 text-green-400" />
            )}
          </div>
        </div>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-xl hover:bg-black/80 rounded-full transition-all shadow-lg"
        >
          <Minimize2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl p-6 border-t border-white/10">
        <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-all shadow-lg ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video Toggle Button */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`p-4 rounded-full transition-all shadow-lg ${
                isVideoOff
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="p-5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full transition-all shadow-2xl hover:scale-110 active:scale-95"
            title="End call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full transition-all shadow-lg ${
              isSpeakerOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isSpeakerOff ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerOff ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CallUI;