// lib/calls/WebRTCEngine.js
// 🎥 Production-Ready WebRTC Engine with Group Call Support

/**
 * Free STUN/TURN Servers (Production-Ready)
 * - Google STUN: Reliable for most cases
 * - OpenRelay TURN: Free TURN server (works behind NAT/firewalls)
 */
export const ICE_CONFIG = {
  iceServers: [
    // Google's Public STUN Servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Free TURN Servers (for NAT traversal)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' // Use both STUN and TURN
};

/**
 * High-Quality Media Constraints (Instagram-style)
 */
export const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  }
};

/**
 * WebRTC Engine Class
 * Handles peer-to-peer connections with full state management
 */
export class WebRTCEngine {
  constructor(callId, localUserId, isVideoCall = true) {
    this.callId = callId;
    this.localUserId = localUserId;
    this.isVideoCall = isVideoCall;
    
    // Connection state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    
    // ICE candidates queue (for race condition handling)
    this.iceCandidatesQueue = [];
    this.isRemoteDescriptionSet = false;
    
    // Event callbacks
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onIceConnectionStateChange = null;
    this.onSignalingStateChange = null;
    this.onDataChannelMessage = null;
    this.onError = null;
    
    // Stats
    this.stats = {
      packetsLost: 0,
      bytesReceived: 0,
      frameRate: 0,
      bitrate: 0
    };
    
    console.log('🎥 WebRTC Engine initialized:', { callId, localUserId, isVideoCall });
  }

  /**
   * Get user media with proper error handling
   */
  async getUserMedia() {
    try {
      console.log('🎤 Requesting media access...');
      
      const constraints = {
        audio: MEDIA_CONSTRAINTS.audio,
        video: this.isVideoCall ? MEDIA_CONSTRAINTS.video : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Media access granted:', {
        audio: this.localStream.getAudioTracks().length > 0,
        video: this.localStream.getVideoTracks().length > 0
      });
      
      return this.localStream;
      
    } catch (error) {
      console.error('❌ Media access error:', error);
      
      const errorMessage = this.getMediaErrorMessage(error);
      if (this.onError) this.onError(errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  /**
   * User-friendly error messages for media errors
   */
  getMediaErrorMessage(error) {
    const errorMap = {
      'NotAllowedError': 'Camera/microphone permission denied. Please allow access in your browser settings.',
      'PermissionDeniedError': 'Camera/microphone permission denied. Please allow access in your browser settings.',
      'NotFoundError': 'No camera or microphone found. Please connect a device.',
      'NotReadableError': 'Camera/microphone is already in use by another application.',
      'OverconstrainedError': 'Camera/microphone does not meet the required specifications.',
      'TypeError': 'Invalid media constraints.',
      'AbortError': 'Media access was aborted.'
    };
    
    return errorMap[error.name] || `Failed to access media: ${error.message}`;
  }

  /**
   * Create peer connection with all event handlers
   */
  createPeerConnection() {
    if (this.peerConnection) {
      console.warn('⚠️ Peer connection already exists');
      return this.peerConnection;
    }

    console.log('🔗 Creating peer connection...');
    this.peerConnection = new RTCPeerConnection(ICE_CONFIG);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        const sender = this.peerConnection.addTrack(track, this.localStream);
        console.log('➕ Added track:', track.kind, sender);
      });
    }

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      this.remoteStream.addTrack(event.track);
      
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 New ICE candidate:', event.candidate.type);
        
        // Callback will send this to remote peer via signaling
        if (this.onIceCandidate) {
          this.onIceCandidate(event.candidate);
        }
      } else {
        console.log('✅ ICE gathering complete');
      }
    };

    // Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔄 Connection state:', state);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
      
      // Auto-cleanup on close
      if (state === 'closed' || state === 'failed') {
        this.cleanup();
      }
    };

    // ICE connection state monitoring
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(state);
      }
    };

    // Signaling state monitoring
    this.peerConnection.onsignalingstatechange = () => {
      const state = this.peerConnection.signalingState;
      console.log('📡 Signaling state:', state);
      
      if (this.onSignalingStateChange) {
        this.onSignalingStateChange(state);
      }
    };

    // Create data channel for text messages during call
    this.dataChannel = this.peerConnection.createDataChannel('call-messages');
    
    this.dataChannel.onopen = () => {
      console.log('💬 Data channel opened');
    };
    
    this.dataChannel.onmessage = (event) => {
      console.log('💬 Data channel message:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(JSON.parse(event.data));
      }
    };

    console.log('✅ Peer connection created');
    return this.peerConnection;
  }

  /**
   * Create offer (caller side)
   */
  async createOffer() {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      console.log('📝 Creating offer...');
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.isVideoCall
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set (offer)');

      return offer;
      
    } catch (error) {
      console.error('❌ Create offer error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming offer (receiver side)
   */
  async handleOffer(offer) {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      console.log('📥 Handling incoming offer...');
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      this.isRemoteDescriptionSet = true;
      console.log('✅ Remote description set (offer)');

      // Process queued ICE candidates
      await this.processIceCandidatesQueue();

      // Create answer
      console.log('📝 Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set (answer)');

      return answer;
      
    } catch (error) {
      console.error('❌ Handle offer error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      console.log('📥 Handling incoming answer...');
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      this.isRemoteDescriptionSet = true;
      console.log('✅ Remote description set (answer)');

      // Process queued ICE candidates
      await this.processIceCandidatesQueue();
      
    } catch (error) {
      console.error('❌ Handle answer error:', error);
      throw error;
    }
  }

  /**
   * Handle ICE candidate from remote peer
   */
  async handleIceCandidate(candidate) {
    try {
      if (!this.isRemoteDescriptionSet) {
        console.log('🧊 Queueing ICE candidate (remote description not set yet)');
        this.iceCandidatesQueue.push(candidate);
        return;
      }

      console.log('🧊 Adding ICE candidate');
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      
    } catch (error) {
      console.error('❌ Handle ICE candidate error:', error);
    }
  }

  /**
   * Process queued ICE candidates
   */
  async processIceCandidatesQueue() {
    if (this.iceCandidatesQueue.length === 0) return;

    console.log(`🧊 Processing ${this.iceCandidatesQueue.length} queued ICE candidates...`);
    
    for (const candidate of this.iceCandidatesQueue) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('❌ Error adding queued ICE candidate:', error);
      }
    }
    
    this.iceCandidatesQueue = [];
    console.log('✅ All queued ICE candidates processed');
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`🔇 Audio ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(enabled) {
    if (this.localStream && this.isVideoCall) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera() {
    if (!this.localStream || !this.isVideoCall) return;

    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const currentFacingMode = videoTrack.getSettings().facingMode;
      
      // Stop current video track
      videoTrack.stop();

      // Get new stream with opposite facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...MEDIA_CONSTRAINTS.video,
          facingMode: currentFacingMode === 'user' ? 'environment' : 'user'
        },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);

      console.log('📹 Camera switched');
      return this.localStream;
      
    } catch (error) {
      console.error('❌ Switch camera error:', error);
      throw error;
    }
  }

  /**
   * Send message via data channel
   */
  sendDataChannelMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      console.log('💬 Data channel message sent:', message);
    }
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    if (!this.peerConnection) return null;

    try {
      const stats = await this.peerConnection.getStats();
      const result = {};

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          result.packetsLost = report.packetsLost || 0;
          result.packetsReceived = report.packetsReceived || 0;
          result.bytesReceived = report.bytesReceived || 0;
          result.frameRate = report.framesPerSecond || 0;
        }
      });

      this.stats = result;
      return result;
      
    } catch (error) {
      console.error('❌ Get stats error:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('🧹 Cleaning up WebRTC resources...');

    // Stop local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear queues
    this.iceCandidatesQueue = [];
    this.isRemoteDescriptionSet = false;
    this.remoteStream = null;

    console.log('✅ Cleanup complete');
  }
}

export default WebRTCEngine;