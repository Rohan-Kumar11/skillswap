import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, AlertCircle, RefreshCw } from 'lucide-react';

export default function VideoPlayer({ src, className = "", autoPlay = false, loop = true }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const controlsTimeoutRef = useRef(null);
  const loadAttemptRef = useRef(0);
  const MAX_RETRIES = 3;

  const isValidSource = src && typeof src === 'string' && src.trim() !== '';

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
    console.log('✅ Video ready to play:', src);
    setIsReady(true);
    setHasError(false);
    setErrorDetails(null);
    setRetryCount(0);
    setIsLoading(false);
    loadAttemptRef.current = 0;
    
    if (autoPlay && videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleLoadStart = () => {
    console.log('🔄 Video loading started:', src);
    setIsLoading(true);
  };

  const handleLoadedMetadata = () => {
    console.log('📊 Video metadata loaded');
  };

  const handleLoadedData = () => {
    console.log('📦 Video data loaded');
  };

  const handleError = (e) => {
    const video = videoRef.current;
    const error = video?.error;
    
    console.error('❌ Video Error Details:', {
      errorObject: error,
      errorCode: error?.code,
      errorMessage: error?.message,
      videoSrc: src,
      videoReadyState: video?.readyState,
      videoNetworkState: video?.networkState,
      eventType: e?.type,
      loadAttempt: loadAttemptRef.current + 1
    });

    let errorMessage = 'Unable to load video';
    let errorCode = 'UNKNOWN';
    let suggestion = 'Please check the video URL and try again';
    
    if (error) {
      switch (error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = 'Video loading was aborted';
          errorCode = 'ABORTED';
          suggestion = 'The video loading was interrupted. Please try again.';
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = 'Network error occurred';
          errorCode = 'NETWORK_ERROR';
          suggestion = 'Check your internet connection and try again.';
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = 'Video format not supported';
          errorCode = 'DECODE_ERROR';
          suggestion = 'Your browser cannot decode this video format.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = 'Video source not accessible';
          errorCode = 'SOURCE_NOT_SUPPORTED';
          suggestion = 'The video URL may be invalid or blocked by CORS/permissions.';
          break;
      }
    } else {
      // No error object means likely a CORS or 406 issue
      errorMessage = 'Video access denied';
      errorCode = 'ACCESS_DENIED';
      suggestion = 'Storage permissions may be incorrect. Check Supabase RLS policies.';
    }

    setErrorDetails({ 
      code: errorCode, 
      message: errorMessage, 
      suggestion,
      url: src 
    });
    setHasError(true);
    setIsReady(false);
    setIsPlaying(false);
    setIsLoading(false);
    
    loadAttemptRef.current += 1;
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      console.log('❌ Max retries reached');
      return;
    }

    console.log(`🔄 Retrying video load (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
    setHasError(false);
    setErrorDetails(null);
    setIsReady(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Small delay before retry
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force reload
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Test video URL accessibility
  useEffect(() => {
    if (!isValidSource) return;

    console.log('🔍 Testing video URL accessibility:', src);
    
    fetch(src, { 
      method: 'HEAD',
      mode: 'cors',
    })
      .then(response => {
        console.log('✅ Video URL test response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          cors: response.headers.get('access-control-allow-origin'),
        });
        
        if (response.status === 406) {
          console.error('⚠️ 406 Error: Server rejected the request. Check Supabase storage policies!');
        } else if (response.status === 403) {
          console.error('⚠️ 403 Error: Access forbidden. Check authentication and RLS policies!');
        } else if (response.status === 404) {
          console.error('⚠️ 404 Error: Video not found at this URL!');
        } else if (!response.ok) {
          console.error(`⚠️ ${response.status} Error: ${response.statusText}`);
        }
      })
      .catch(error => {
        console.error('❌ Video URL test failed:', {
          error: error.message,
          type: error.name,
          suggestion: 'This might be a CORS issue. Check Supabase storage CORS settings.'
        });
      });
  }, [src, isValidSource]);

  const handleEnded = () => {
    if (!loop) {
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔄 Video source changed:', src);
    setIsPlaying(false);
    setIsReady(false);
    setHasError(false);
    setErrorDetails(null);
    setShowControls(true);
    setRetryCount(0);
    setIsLoading(true);
    loadAttemptRef.current = 0;
  }, [src]);

  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying]);

  if (!isValidSource) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-6">
          <AlertCircle size={48} className="mx-auto mb-3 text-gray-500" />
          <p className="text-sm text-gray-400">No video source provided</p>
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
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={handleEnded}
        loop={loop}
        playsInline
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
        controlsList="nodownload"
      />

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm">Loading video...</p>
            {retryCount > 0 && (
              <p className="text-gray-400 text-xs mt-1">Retry attempt {retryCount}/{MAX_RETRIES}</p>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center p-6 max-w-md mx-auto">
            <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold mb-2">Unable to play video</p>
            <p className="text-sm text-gray-300 mb-2">
              {errorDetails?.message || 'The video could not be loaded'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {errorDetails?.suggestion || 'Please try again'}
            </p>
            
            {retryCount < MAX_RETRIES && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium mb-4"
              >
                <RefreshCw size={16} />
                <span>Retry ({MAX_RETRIES - retryCount} left)</span>
              </button>
            )}
            
            {retryCount >= MAX_RETRIES && (
              <div className="text-xs text-gray-500 mb-4">
                <p className="mb-2">Still having issues? Try these steps:</p>
                <ul className="text-left space-y-1 max-w-xs mx-auto">
                  <li>• Check Supabase storage RLS policies</li>
                  <li>• Verify bucket is set to PUBLIC</li>
                  <li>• Clear browser cache and reload</li>
                  <li>• Try a different browser</li>
                </ul>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 font-mono mb-1">Error: {errorDetails?.code}</p>
              <p className="text-xs text-gray-600 break-all">{src}</p>
            </div>
          </div>
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && isReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl animate-pulse">
            <Play size={32} className="text-black ml-1" fill="black" />
          </div>
        </div>
      )}

      {/* Volume Control */}
      {isReady && !hasError && (
        <button
          onClick={handleMuteToggle}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 z-10 hover:bg-black/80 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isMuted ? (
            <VolumeX size={20} className="text-white" />
          ) : (
            <Volume2 size={20} className="text-white" />
          )}
        </button>
      )}

      {/* Pause Indicator */}
      {!isPlaying && isReady && !hasError && showControls && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="flex gap-2">
            <div className="w-1.5 h-12 bg-white rounded-full opacity-90"></div>
            <div className="w-1.5 h-12 bg-white rounded-full opacity-90"></div>
          </div>
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}