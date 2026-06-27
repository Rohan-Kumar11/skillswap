// app/messages/components/calls/CallSystem.jsx
// 📞 FIXED - Main Call System Controller

import React, { useState, useEffect, useRef } from 'react';
import { CallStateManager, CALL_STATES } from '@/lib/calls/CallStateManager';
import { CallDatabaseService } from '@/lib/calls/SignalingService';
import { CallSounds, requestWakeLock, releaseWakeLock } from '@/lib/calls/mediaHelpers';
import CallUI from './CallUI';
import IncomingCallScreen from './IncomingCallScreen';
import { useToast } from '@/app/components/Toast';

const CallSystem = ({
  conversationId,
  currentUser,
  otherUser,
  callType, // 'voice' or 'video'
  isIncoming = false,
  incomingCallData = null,
  onClose
}) => {
  // State
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  
  // Refs
  const callManagerRef = useRef(null);
  const soundsRef = useRef(new CallSounds());
  const wakeLockRef = useRef(null);
  const durationTimerRef = useRef(null);
  const toast = useToast();

  // Initialize call on mount
  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  // Start duration timer when call becomes active
  useEffect(() => {
    if (callState === CALL_STATES.ACTIVE) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Handle sounds based on call state
  useEffect(() => {
    if (callState === CALL_STATES.CALLING || callState === CALL_STATES.RINGING) {
      soundsRef.current.playRinging();
    } else {
      soundsRef.current.stopRinging();
    }

    if (callState === CALL_STATES.ACTIVE) {
      soundsRef.current.playConnected();
      requestWakeLock().then(lock => {
        wakeLockRef.current = lock;
      });
    }

    if (callState === CALL_STATES.ENDED) {
      soundsRef.current.playEnded();
    }

    if (callState === CALL_STATES.DECLINED) {
      soundsRef.current.playDeclined();
    }
  }, [callState]);

  const initializeCall = async () => {
    try {
      console.log('🚀 Initializing call system...');
      
      // ⭐ FIX: Log user IDs to verify they're correct
      console.log('👤 Current User ID:', currentUser.id);
      console.log('👤 Other User ID:', otherUser.id);
      console.log('📞 Call Type:', callType);
      console.log('📥 Is Incoming:', isIncoming);

      // ⭐ FIX: Always use currentUser.id as currentUserId and otherUser.id as otherUserId
      // The CallStateManager will determine who is caller/receiver based on isOutgoing
      const manager = new CallStateManager({
        conversationId,
        currentUserId: currentUser.id,  // ⭐ Always the authenticated user
        otherUserId: otherUser.id,      // ⭐ Always the other person
        isVideoCall: callType === 'video',
        isOutgoing: !isIncoming         // ⭐ This determines caller/receiver
      });

      callManagerRef.current = manager;

      // Register callbacks
      manager.on('onStateChange', (newState, oldState) => {
        console.log(`📊 State: ${oldState} → ${newState}`);
        setCallState(newState);
      });

      manager.on('onLocalStream', (stream) => {
        console.log('🎥 Local stream ready');
        setLocalStream(stream);
      });

      manager.on('onRemoteStream', (stream) => {
        console.log('📺 Remote stream ready');
        setRemoteStream(stream);
      });

      manager.on('onError', (errorMsg) => {
        console.error('❌ Call error:', errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
      });

      manager.on('onCallEnd', (data) => {
        console.log('📞 Call ended:', data);
        handleCallEnded(data);
      });

      // Initialize
      const success = await manager.initialize();

      if (!success) {
        throw new Error('Failed to initialize call');
      }

      // For outgoing calls, start immediately
      if (!isIncoming) {
        await manager.startOutgoingCall();
      } else {
        // For incoming calls, show accept/decline screen
        setCallState(CALL_STATES.RINGING);
      }

    } catch (err) {
      console.error('❌ Initialize error:', err);
      toast.error(err.message || 'Failed to initialize call');
      setTimeout(() => onClose(), 2000);
    }
  };

  const handleAcceptCall = async () => {
    try {
      console.log('✅ User accepted call');
      soundsRef.current.stopRinging();
      
      await callManagerRef.current?.acceptIncomingCall();

      // If we have incoming call data with an offer, process it
      if (incomingCallData?.offer) {
        await callManagerRef.current?.handleIncomingOffer(
          incomingCallData.offer,
          otherUser.id
        );
      }

    } catch (err) {
      console.error('❌ Accept call error:', err);
      toast.error('Failed to accept call');
    }
  };

  const handleDeclineCall = async () => {
    console.log('❌ User declined call');
    soundsRef.current.stopRinging();
    
    await callManagerRef.current?.declineIncomingCall();
    
    setTimeout(() => onClose(), 1000);
  };

  const handleEndCall = async () => {
    console.log('📞 User ended call');
    
    await callManagerRef.current?.endCall();
  };

  const handleCallEnded = (data) => {
    console.log('📊 Call ended with data:', data);
    
    // Show toast with call duration
    if (data.duration && data.duration > 0) {
      const minutes = Math.floor(data.duration / 60);
      const seconds = data.duration % 60;
      toast.success(`Call duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    // Wait 2 seconds then close
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    callManagerRef.current?.toggleMute(newMuted);
    toast.info(newMuted ? 'Muted' : 'Unmuted');
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    callManagerRef.current?.toggleVideo(newVideoOff);
    toast.info(newVideoOff ? 'Camera off' : 'Camera on');
  };

  const handleSwitchCamera = async () => {
    try {
      const newStream = await callManagerRef.current?.switchCamera();
      if (newStream) {
        setLocalStream(newStream);
        toast.success('Camera switched');
      }
    } catch (err) {
      toast.error('Failed to switch camera');
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up call system...');
    
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    soundsRef.current.cleanup();
    
    if (wakeLockRef.current) {
      releaseWakeLock(wakeLockRef.current);
    }
    
    if (callManagerRef.current) {
      callManagerRef.current.cleanup();
    }
  };

  // Show incoming call screen
  if (isIncoming && callState === CALL_STATES.RINGING) {
    return (
      <IncomingCallScreen
        callerName={otherUser.username}
        callerAvatar={otherUser.profile_pic}
        isVideo={callType === 'video'}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    );
  }

  // Show main call UI
  return (
    <CallUI
      callState={callState}
      callType={callType}
      otherUser={otherUser}
      localStream={localStream}
      remoteStream={remoteStream}
      isMuted={isMuted}
      isVideoOff={isVideoOff}
      callDuration={callDuration}
      error={error}
      onEndCall={handleEndCall}
      onToggleMute={handleToggleMute}
      onToggleVideo={handleToggleVideo}
      onSwitchCamera={handleSwitchCamera}
    />
  );
};

export default CallSystem;