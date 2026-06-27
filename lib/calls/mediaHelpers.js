// lib/calls/mediaHelpers.js
// 🎵 Media utilities and sound effects

/**
 * Call Sound Effects (Instagram-style)
 */
export class CallSounds {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.ringingInterval = null;
  }

  /**
   * Initialize audio context
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play ringing sound (caller side)
   */
  playRinging() {
    try {
      const ctx = this.initAudioContext();
      
      this.oscillator = ctx.createOscillator();
      this.gainNode = ctx.createGain();
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
      
      // Ringing tone: 440Hz and 480Hz alternating
      this.oscillator.frequency.value = 440;
      this.gainNode.gain.value = 0.1;
      
      this.oscillator.start();
      
      // Alternate frequencies for realistic ring
      this.ringingInterval = setInterval(() => {
        if (this.oscillator) {
          this.oscillator.frequency.value = 
            this.oscillator.frequency.value === 440 ? 480 : 440;
        }
      }, 1000);
      
      console.log('🔔 Ringing sound started');
      
    } catch (error) {
      console.error('❌ Sound error:', error);
    }
  }

  /**
   * Stop ringing sound
   */
  stopRinging() {
    try {
      if (this.ringingInterval) {
        clearInterval(this.ringingInterval);
        this.ringingInterval = null;
      }
      
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      console.log('🔕 Ringing sound stopped');
      
    } catch (error) {
      console.error('❌ Stop sound error:', error);
    }
  }

  /**
   * Play connected tone
   */
  playConnected() {
    this.playTone(800, 0.1, 200);
    console.log('✅ Connected tone played');
  }

  /**
   * Play call ended tone
   */
  playEnded() {
    this.playTone(400, 0.15, 400);
    console.log('📞 Ended tone played');
  }

  /**
   * Play declined tone
   */
  playDeclined() {
    this.playTone(300, 0.15, 300);
    console.log('❌ Declined tone played');
  }

  /**
   * Play generic tone
   */
  playTone(frequency, volume, duration) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      
      osc.start();
      
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, duration);
      
    } catch (error) {
      console.error('❌ Tone error:', error);
    }
  }

  /**
   * Vibrate (mobile)
   */
  vibrate(pattern = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopRinging();
  }
}

/**
 * Format call duration (seconds to MM:SS or HH:MM:SS)
 */
export function formatCallDuration(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format call timestamp for history
 */
export function formatCallTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute ago
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days ago
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Show actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Get connection quality label
 */
export function getConnectionQualityLabel(stats) {
  if (!stats) return { label: 'Unknown', color: 'gray' };
  
  const { packetsLost = 0, packetsReceived = 0 } = stats;
  
  if (packetsReceived === 0) {
    return { label: 'Connecting...', color: 'yellow' };
  }
  
  const lossRate = (packetsLost / (packetsLost + packetsReceived)) * 100;
  
  if (lossRate < 2) {
    return { label: 'Excellent', color: 'green' };
  } else if (lossRate < 5) {
    return { label: 'Good', color: 'yellow' };
  } else if (lossRate < 10) {
    return { label: 'Fair', color: 'orange' };
  } else {
    return { label: 'Poor', color: 'red' };
  }
}

/**
 * Request screen wake lock (prevent screen from sleeping during call)
 */
export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('🔒 Wake lock active');
      
      wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake lock released');
      });
      
      return wakeLock;
    }
  } catch (error) {
    console.error('❌ Wake lock error:', error);
  }
  return null;
}

/**
 * Release wake lock
 */
export async function releaseWakeLock(wakeLock) {
  if (wakeLock) {
    try {
      await wakeLock.release();
      console.log('🔓 Wake lock released manually');
    } catch (error) {
      console.error('❌ Wake lock release error:', error);
    }
  }
}

/**
 * Check if device supports video calls
 */
export async function checkVideoSupport() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    return hasCamera;
  } catch (error) {
    console.error('❌ Device check error:', error);
    return false;
  }
}

/**
 * Check if device supports audio calls
 */
export async function checkAudioSupport() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMicrophone = devices.some(device => device.kind === 'audioinput');
    return hasMicrophone;
  } catch (error) {
    console.error('❌ Device check error:', error);
    return false;
  }
}

/**
 * Get available cameras
 */
export async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('❌ Get cameras error:', error);
    return [];
  }
}

/**
 * Get available microphones
 */
export async function getAvailableMicrophones() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('❌ Get microphones error:', error);
    return [];
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Detect network type (for adaptive bitrate)
 */
export function getNetworkType() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round-trip time in ms
      saveData: connection.saveData // Data saver mode
    };
  }
  return null;
}

/**
 * Request picture-in-picture for video element
 */
export async function requestPictureInPicture(videoElement) {
  try {
    if (document.pictureInPictureEnabled && !videoElement.disablePictureInPicture) {
      await videoElement.requestPictureInPicture();
      console.log('📺 Picture-in-Picture enabled');
      return true;
    }
  } catch (error) {
    console.error('❌ PiP error:', error);
  }
  return false;
}

/**
 * Exit picture-in-picture
 */
export async function exitPictureInPicture() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      console.log('📺 Picture-in-Picture disabled');
    }
  } catch (error) {
    console.error('❌ Exit PiP error:', error);
  }
}

/**
 * Take snapshot from video stream
 */
export function takeSnapshot(videoElement) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error('❌ Snapshot error:', error);
    return null;
  }
}

export default {
  CallSounds,
  formatCallDuration,
  formatCallTimestamp,
  getConnectionQualityLabel,
  requestWakeLock,
  releaseWakeLock,
  checkVideoSupport,
  checkAudioSupport,
  getAvailableCameras,
  getAvailableMicrophones,
  formatFileSize,
  getNetworkType,
  requestPictureInPicture,
  exitPictureInPicture,
  takeSnapshot
};