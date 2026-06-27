// lib/calls/CallStateManager.js
// 🎯 FIXED - Centralized Call State Management

import { WebRTCEngine } from './WebRTCEngine';
import { SignalingService, CallDatabaseService } from './SignalingService';

/**
 * Call States (Instagram-style flow)
 */
export const CALL_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  ACTIVE: 'active',
  RECONNECTING: 'reconnecting',
  ENDING: 'ending',
  ENDED: 'ended',
  DECLINED: 'declined',
  MISSED: 'missed',
  FAILED: 'failed'
};

/**
 * Call State Manager - FIXED
 */
export class CallStateManager {
  constructor(config) {
    const {
      conversationId,
      currentUserId,
      otherUserId,
      isVideoCall = true,
      isOutgoing = true
    } = config;

    this.conversationId = conversationId;
    this.currentUserId = currentUserId;
    this.otherUserId = otherUserId;
    this.isVideoCall = isVideoCall;
    this.isOutgoing = isOutgoing;

    // ⭐ FIX: Correctly assign caller and receiver based on call direction
    this.callerId = isOutgoing ? currentUserId : otherUserId;
    this.receiverId = isOutgoing ? otherUserId : currentUserId;

    // State
    this.state = CALL_STATES.IDLE;
    this.callId = null;
    this.startTime = null;
    this.endTime = null;

    // Services
    this.webrtc = null;
    this.signaling = null;

    // Callbacks
    this.callbacks = {
      onStateChange: null,
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onCallEnd: null
    };

    console.log('🎯 Call State Manager initialized:', {
      conversationId,
      currentUserId,
      otherUserId,
      isVideoCall,
      isOutgoing,
      callerId: this.callerId,      // ⭐ Log for debugging
      receiverId: this.receiverId   // ⭐ Log for debugging
    });
  }

  /**
   * Initialize call
   */
  async initialize() {
    try {
      this.setState(CALL_STATES.INITIALIZING);

      // ⭐ FIX: Create call record with correct caller/receiver
      console.log('💾 Creating call record with:', {
        conversationId: this.conversationId,
        callerId: this.callerId,
        receiverId: this.receiverId,
        callType: this.isVideoCall ? 'video' : 'voice'
      });

      const callData = await CallDatabaseService.createCall(
        this.conversationId,
        this.callerId,      // ⭐ Will be currentUserId if outgoing
        this.receiverId,    // ⭐ Will be otherUserId if outgoing
        this.isVideoCall ? 'video' : 'voice'
      );

      if (!callData) {
        throw new Error('Failed to create call record');
      }

      this.callId = callData.id;
      console.log('📞 Call ID:', this.callId);

      // Initialize WebRTC
      this.webrtc = new WebRTCEngine(
        this.callId,
        this.currentUserId,
        this.isVideoCall
      );

      // Setup WebRTC callbacks
      this.webrtc.onRemoteStream = (stream) => {
        console.log('📺 Remote stream received in state manager');
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(stream);
        }
        this.setState(CALL_STATES.ACTIVE);
        this.startTime = Date.now();
        CallDatabaseService.updateCallStatus(this.callId, 'active');
      };

      this.webrtc.onConnectionStateChange = (state) => {
        this.handleConnectionStateChange(state);
      };

      this.webrtc.onIceConnectionStateChange = (state) => {
        this.handleIceConnectionStateChange(state);
      };

      this.webrtc.onIceCandidate = async (candidate) => {
        await this.signaling.sendIceCandidate(candidate, this.otherUserId);
      };

      this.webrtc.onError = (error) => {
        console.error('❌ WebRTC error:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
        this.handleCallFailure(error);
      };

      // Get user media
      console.log('🎥 Getting user media...');
      const localStream = await this.webrtc.getUserMedia();

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(localStream);
      }

      // Initialize signaling
      this.signaling = new SignalingService(this.callId, this.currentUserId);

      // Setup signaling callbacks
      this.signaling.on('onOffer', async (offer, from) => {
        await this.handleIncomingOffer(offer, from);
      });

      this.signaling.on('onAnswer', async (answer, from) => {
        await this.handleIncomingAnswer(answer, from);
      });

      this.signaling.on('onIceCandidate', async (candidate, from) => {
        await this.webrtc.handleIceCandidate(candidate);
      });

      this.signaling.on('onCallEnd', () => {
        this.handleRemoteCallEnd();
      });

      this.signaling.on('onCallDecline', () => {
        this.handleRemoteCallDecline();
      });

      await this.signaling.initialize();

      console.log('✅ Call initialization complete');
      return true;

    } catch (error) {
      console.error('❌ Initialization error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error.message);
      }
      this.setState(CALL_STATES.FAILED);
      return false;
    }
  }

  /**
   * Start outgoing call
   */
  async startOutgoingCall() {
    try {
      console.log('📞 Starting outgoing call...');
      this.setState(CALL_STATES.CALLING);

      await CallDatabaseService.updateCallStatus(this.callId, 'calling');

      // Create peer connection and offer
      const offer = await this.webrtc.createOffer();

      // Send offer to remote peer
      await this.signaling.sendOffer(offer, this.otherUserId);

      console.log('✅ Offer sent, waiting for answer...');
      return true;

    } catch (error) {
      console.error('❌ Start outgoing call error:', error);
      this.handleCallFailure(error.message);
      return false;
    }
  }

  /**
   * Accept incoming call
   */
  async acceptIncomingCall() {
    try {
      console.log('✅ Accepting incoming call...');
      this.setState(CALL_STATES.CONNECTING);

      await CallDatabaseService.updateCallStatus(this.callId, 'ringing');

      console.log('⏳ Waiting for offer...');
      return true;

    } catch (error) {
      console.error('❌ Accept call error:', error);
      this.handleCallFailure(error.message);
      return false;
    }
  }

  /**
   * Decline incoming call
   */
  async declineIncomingCall() {
    try {
      console.log('❌ Declining incoming call...');

      await this.signaling.declineCall(this.otherUserId);
      await CallDatabaseService.updateCallStatus(
        this.callId,
        'declined',
        { declined_by: this.currentUserId }
      );

      this.setState(CALL_STATES.DECLINED);
      this.cleanup();

      return true;

    } catch (error) {
      console.error('❌ Decline call error:', error);
      return false;
    }
  }

  /**
   * End active call
   */
  async endCall() {
    try {
      console.log('📞 Ending call...');
      this.setState(CALL_STATES.ENDING);

      // Notify remote peer
      await this.signaling.endCall();

      // Update database
      this.endTime = Date.now();
      const duration = this.startTime
        ? Math.floor((this.endTime - this.startTime) / 1000)
        : 0;

      await CallDatabaseService.updateCallStatus(
        this.callId,
        'ended',
        { duration_seconds: duration }
      );

      this.setState(CALL_STATES.ENDED);

      // Cleanup
      setTimeout(() => {
        this.cleanup();
        if (this.callbacks.onCallEnd) {
          this.callbacks.onCallEnd({ duration });
        }
      }, 2000);

      return true;

    } catch (error) {
      console.error('❌ End call error:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Handle incoming offer (receiver side)
   */
  async handleIncomingOffer(offer, from) {
    try {
      console.log('📥 Handling incoming offer from:', from);

      if (this.state !== CALL_STATES.CONNECTING && this.state !== CALL_STATES.RINGING) {
        console.warn('⚠️ Ignoring offer, call not in correct state:', this.state);
        return;
      }

      // Handle offer and create answer
      const answer = await this.webrtc.handleOffer(offer);

      // Send answer back
      await this.signaling.sendAnswer(answer, from);

      console.log('✅ Answer sent');

    } catch (error) {
      console.error('❌ Handle offer error:', error);
      this.handleCallFailure(error.message);
    }
  }

  /**
   * Handle incoming answer (caller side)
   */
  async handleIncomingAnswer(answer, from) {
    try {
      console.log('📥 Handling incoming answer from:', from);

      if (this.state !== CALL_STATES.CALLING) {
        console.warn('⚠️ Ignoring answer, call not in calling state');
        return;
      }

      this.setState(CALL_STATES.CONNECTING);

      // Handle answer
      await this.webrtc.handleAnswer(answer);

      console.log('✅ Answer processed, connecting...');

    } catch (error) {
      console.error('❌ Handle answer error:', error);
      this.handleCallFailure(error.message);
    }
  }

  /**
   * Handle connection state changes
   */
  handleConnectionStateChange(state) {
    console.log('🔄 Connection state:', state);

    switch (state) {
      case 'connected':
        if (this.state !== CALL_STATES.ACTIVE) {
          this.setState(CALL_STATES.ACTIVE);
          this.startTime = Date.now();
          CallDatabaseService.updateCallStatus(this.callId, 'active');
        }
        break;

      case 'disconnected':
        if (this.state === CALL_STATES.ACTIVE) {
          this.setState(CALL_STATES.RECONNECTING);
        }
        break;

      case 'failed':
        this.handleCallFailure('Connection failed');
        break;

      case 'closed':
        if (this.state !== CALL_STATES.ENDING && this.state !== CALL_STATES.ENDED) {
          this.endCall();
        }
        break;
    }
  }

  /**
   * Handle ICE connection state changes
   */
  handleIceConnectionStateChange(state) {
    console.log('🧊 ICE connection state:', state);

    if (state === 'connected' || state === 'completed') {
      if (this.state === CALL_STATES.RECONNECTING) {
        this.setState(CALL_STATES.ACTIVE);
      }
    } else if (state === 'failed') {
      this.handleCallFailure('ICE connection failed');
    }
  }

  /**
   * Handle remote peer ending call
   */
  handleRemoteCallEnd() {
    console.log('📞 Remote peer ended call');

    this.endTime = Date.now();
    const duration = this.startTime
      ? Math.floor((this.endTime - this.startTime) / 1000)
      : 0;

    CallDatabaseService.updateCallStatus(
      this.callId,
      'ended',
      { duration_seconds: duration }
    );

    this.setState(CALL_STATES.ENDED);

    setTimeout(() => {
      this.cleanup();
      if (this.callbacks.onCallEnd) {
        this.callbacks.onCallEnd({ duration, endedBy: 'remote' });
      }
    }, 2000);
  }

  /**
   * Handle remote peer declining call
   */
  handleRemoteCallDecline() {
    console.log('❌ Remote peer declined call');

    CallDatabaseService.updateCallStatus(
      this.callId,
      'declined',
      { declined_by: this.otherUserId }
    );

    this.setState(CALL_STATES.DECLINED);

    setTimeout(() => {
      this.cleanup();
      if (this.callbacks.onCallEnd) {
        this.callbacks.onCallEnd({ declined: true });
      }
    }, 2000);
  }

  /**
   * Handle call failure
   */
  handleCallFailure(reason) {
    console.error('❌ Call failed:', reason);

    CallDatabaseService.updateCallStatus(this.callId, 'failed');

    this.setState(CALL_STATES.FAILED);

    if (this.callbacks.onError) {
      this.callbacks.onError(reason);
    }

    setTimeout(() => {
      this.cleanup();
    }, 2000);
  }

  /**
   * Toggle mute
   */
  toggleMute(muted) {
    this.webrtc?.toggleAudio(!muted);
  }

  /**
   * Toggle video
   */
  toggleVideo(videoOff) {
    this.webrtc?.toggleVideo(!videoOff);
  }

  /**
   * Switch camera
   */
  async switchCamera() {
    return await this.webrtc?.switchCamera();
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    return await this.webrtc?.getStats();
  }

  /**
   * Set state and notify
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;

    console.log(`🎯 State transition: ${oldState} → ${newState}`);

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState, oldState);
    }
  }

  /**
   * Register callback
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    console.log('🧹 Cleaning up call state manager...');

    if (this.webrtc) {
      this.webrtc.cleanup();
      this.webrtc = null;
    }

    if (this.signaling) {
      this.signaling.cleanup();
      this.signaling = null;
    }

    console.log('✅ Call state manager cleaned up');
  }

  /**
   * Get current call duration (seconds)
   */
  getCurrentDuration() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get call information
   */
  getCallInfo() {
    return {
      callId: this.callId,
      state: this.state,
      conversationId: this.conversationId,
      currentUserId: this.currentUserId,
      otherUserId: this.otherUserId,
      callerId: this.callerId,
      receiverId: this.receiverId,
      isVideoCall: this.isVideoCall,
      isOutgoing: this.isOutgoing,
      duration: this.getCurrentDuration()
    };
  }
}

export default CallStateManager;