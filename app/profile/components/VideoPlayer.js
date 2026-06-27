import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, AlertCircle } from 'lucide-react';

export default function VideoPlayer({ 
  src, 
  className = "", 
  autoPlay = false, 
  loop = true,
  onPlayStateChange,
  musicUrl = null,
  musicStartTime = 0,
  musicEndTime = null,
  musicDuration = 0
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  
  const controlsTimeoutRef = useRef(null);
  const musicMonitorRef = useRef(null);
  const MAX_RETRIES = 3;

  const isValidSource = src && typeof src === 'string' && src.trim() !== '';

  // ✅ Calculate music boundaries as INTEGERS
  const getMusicBoundaries = () => {
    // Convert to integers (matching database schema)
    const start = Math.floor(Number(musicStartTime) || 0);
    
    let end;
    if (musicEndTime !== null && musicEndTime !== undefined) {
      // Use stored end time from database (INTEGER)
      end = Math.floor(Number(musicEndTime));
    } else {
      // Fallback: calculate from duration
      const dur = Math.floor(Number(musicDuration) || 15);
      end = start + dur;
    }
    
    const dur = end - start;
    
    console.log('🎵 Music boundaries (INTEGERS):', { 
      start, 
      end, 
      dur,
      source: musicEndTime ? 'database' : 'calculated'
    });
    
    return { start, end, dur };
  };

  // Initialize audio
  useEffect(() => {
    if (!musicUrl || !musicDuration || musicDuration <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(musicUrl);
    audio.crossOrigin = 'anonymous';
    audio.loop = false;
    audio.preload = 'auto';
    audioRef.current = audio;
    
    const { start, end, dur } = getMusicBoundaries();
    
    console.log('🎵 Initializing music clip:', { 
      musicUrl, 
      start, 
      end, 
      dur,
      videoDuration 
    });
    
    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = start;
      console.log('✅ Audio positioned at start:', start);
    });
    
    audio.addEventListener('ended', () => {
      if (isPlaying) {
        console.log('🔄 Audio ended naturally, restarting from:', start);
        audio.currentTime = start;
        audio.play().catch(err => console.log('Audio play error:', err));
      }
    });
    
    return () => {
      if (musicMonitorRef.current) {
        clearInterval(musicMonitorRef.current);
        musicMonitorRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicUrl, musicStartTime, musicEndTime, musicDuration]);

  // ✅ Monitor music playback and enforce boundaries
  useEffect(() => {
    if (!audioRef.current || !isPlaying || !musicUrl) {
      if (musicMonitorRef.current) {
        clearInterval(musicMonitorRef.current);
        musicMonitorRef.current = null;
      }
      return;
    }

    const { start, end, dur } = getMusicBoundaries();
    
    console.log('🎬 Starting music monitor:', { start, end, dur });
    
    // Check music position every 50ms
    musicMonitorRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      
      const current = audio.currentTime;
      
      // ✅ If we've passed the end time OR gone before start, loop back
      if (current >= end || current < start) {
        console.log(`🔄 Music loop trigger: current=${current.toFixed(2)}s, resetting to ${start}s`);
        audio.currentTime = start;
        
        // Ensure it keeps playing
        if (isPlaying) {
          audio.play().catch(err => console.log('Loop play error:', err));
        }
      }
    }, 50); // Check every 50ms for smooth looping

    return () => {
      if (musicMonitorRef.current) {
        clearInterval(musicMonitorRef.current);
        musicMonitorRef.current = null;
      }
    };
  }, [isPlaying, musicUrl, musicStartTime, musicEndTime, musicDuration]);

  // Sync play/pause between video and audio
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const { start } = getMusicBoundaries();
      
      // Ensure we're at the correct start position
      if (audioRef.current.currentTime < start) {
        audioRef.current.currentTime = start;
      }
      
      audioRef.current.play()
        .then(() => console.log('✅ Music playing'))
        .catch(err => console.log('Music play error:', err));
    } else {
      audioRef.current.pause();
      console.log('⏸️ Music paused');
    }
  }, [isPlaying, musicStartTime]);

  // Notify parent of play state changes
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  const handleVideoTap = () => {
    if (!isReady || !isValidSource || hasError) return;

    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      videoRef.current?.play()
        .then(() => {
          setIsPlaying(true);
          resetControlsTimeout();
        })
        .catch(err => {
          console.warn('Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleCanPlay = () => {
    console.log('✅ Video ready');
    setIsReady(true);
    setHasError(false);
    setErrorDetails(null);
    setRetryCount(0);
    setIsLoading(false);
    
    if (autoPlay && videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      console.log('📹 Video duration:', duration, 's');
      
      // Log sync info
      if (musicUrl) {
        const { start, end, dur } = getMusicBoundaries();
        console.log('🎵 Music vs Video:', {
          video: duration,
          music: dur,
          synced: Math.abs(duration - dur) < 1
        });
      }
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleError = (e) => {
    const video = videoRef.current;
    const error = video?.error;
    
    console.error('❌ Video Error:', error);

    let errorMessage = 'Unable to load video';
    let errorCode = 'UNKNOWN';
    
    if (error) {
      switch (error.code) {
        case 1: errorMessage = 'Video loading aborted'; errorCode = 'ABORTED'; break;
        case 2: errorMessage = 'Network error'; errorCode = 'NETWORK'; break;
        case 3: errorMessage = 'Format not supported'; errorCode = 'DECODE'; break;
        case 4: errorMessage = 'Source not accessible'; errorCode = 'NOT_FOUND'; break;
      }
    }

    setErrorDetails({ code: errorCode, message: errorMessage });
    setHasError(true);
    setIsReady(false);
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) return;

    setHasError(false);
    setErrorDetails(null);
    setIsReady(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleEnded = () => {
    console.log('🔄 Video ended');
    
    if (!loop) {
      setIsPlaying(false);
      setShowControls(true);
      
      // Stop and reset music
      if (audioRef.current) {
        const { start } = getMusicBoundaries();
        audioRef.current.pause();
        audioRef.current.currentTime = start;
        console.log('⏹️ Music stopped and reset to:', start);
      }
    } else {
      // Video is looping - reset music to sync
      if (audioRef.current && isPlaying) {
        const { start } = getMusicBoundaries();
        console.log('🔄 Video loop - resetting music to:', start);
        audioRef.current.currentTime = start;
        audioRef.current.play().catch(err => console.log('Loop play error:', err));
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (musicMonitorRef.current) clearInterval(musicMonitorRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Reset on source change
  useEffect(() => {
    setIsPlaying(false);
    setIsReady(false);
    setHasError(false);
    setErrorDetails(null);
    setShowControls(true);
    setRetryCount(0);
    setIsLoading(true);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (musicMonitorRef.current) {
      clearInterval(musicMonitorRef.current);
      musicMonitorRef.current = null;
    }
  }, [src]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
  }, [isPlaying]);

  if (!isValidSource) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-6">
          <AlertCircle size={48} className="mx-auto mb-3 text-gray-500" />
          <p className="text-sm text-gray-400">No video source</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className}`}
      onClick={handleVideoTap}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadStart={handleLoadStart}
        onError={handleError}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={handlePlay}
        loop={loop}
        playsInline
        muted={isMuted}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center p-6 max-w-md">
            <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
            <p className="text-base font-semibold mb-2">Can't play video</p>
            <p className="text-sm text-gray-400 mb-4">{errorDetails?.message}</p>
            {retryCount < MAX_RETRIES && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {!isPlaying && isReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl">
            <Play size={36} className="text-black ml-1" fill="black" />
          </div>
        </div>
      )}

      {isReady && !hasError && (
        <button
          onClick={handleMuteToggle}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center z-10 hover:bg-black/80 transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
        </button>
      )}

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}