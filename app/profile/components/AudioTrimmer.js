"use client";
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Check, SkipBack, SkipForward, ArrowLeft } from 'lucide-react';

export default function AudioTrimmer({ isOpen, onClose, musicData, onConfirm, onBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const audioRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // Initialize audio and load metadata
  useEffect(() => {
    if (isOpen && musicData?.preview) {
      setIsLoading(true);
      setLoadError(null);
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const audio = new Audio();
      audioRef.current = audio;

      // Set CORS mode
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';

      const handleLoadedMetadata = () => {
        const audioDuration = audio.duration;
        console.log('✅ Audio loaded, duration:', audioDuration);
        setDuration(audioDuration);
        setClipDuration(15);
        setStartTime(0);
        setCurrentTime(0);
        setIsLoading(false);
        setLoadError(null);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = startTime;
          setCurrentTime(startTime);
        }
      };

      const handleError = (e) => {
        console.error('❌ Audio loading error:', {
          error: e,
          src: musicData.preview,
          errorCode: audio.error?.code,
          errorMessage: audio.error?.message
        });
        
        let errorMsg = 'Failed to load audio';
        if (audio.error) {
          switch (audio.error.code) {
            case 1: errorMsg = 'Audio loading aborted'; break;
            case 2: errorMsg = 'Network error loading audio'; break;
            case 3: errorMsg = 'Audio format not supported'; break;
            case 4: errorMsg = 'Audio source not found'; break;
          }
        }
        
        setLoadError(errorMsg);
        setIsLoading(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Set source and load
      console.log('🔄 Loading audio from:', musicData.preview);
      audio.src = musicData.preview;
      audio.load();

      return () => {
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
        }
        if (audio) {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          audio.pause();
          audio.src = '';
        }
      };
    }
  }, [isOpen, musicData]);

  // Handle playback monitoring
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }

      timeUpdateIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const time = audioRef.current.currentTime;
          setCurrentTime(time);
          
          if (time >= startTime + clipDuration) {
            audioRef.current.pause();
            audioRef.current.currentTime = startTime;
            setCurrentTime(startTime);
            setIsPlaying(false);
            clearInterval(timeUpdateIntervalRef.current);
          }
        }
      }, 50);

      return () => {
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
        }
      };
    }
  }, [isPlaying, startTime, clipDuration]);

  if (!isOpen || !musicData) return null;

  const togglePlay = () => {
    if (!audioRef.current || isLoading || loadError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Play error:', error);
          setIsPlaying(false);
          setLoadError('Failed to play audio. Try another song.');
        });
    }
  };

  const handleStartTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    const newStartTime = Math.max(0, Math.min(value, duration));
    
    const remainingDuration = duration - newStartTime;
    if (clipDuration > remainingDuration) {
      const adjustedClipDuration = Math.max(15, Math.min(30, Math.floor(remainingDuration)));
      setClipDuration(adjustedClipDuration);
    }
    
    setStartTime(newStartTime);
    
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = newStartTime;
      setCurrentTime(newStartTime);
    }
  };

  const handleClipDurationChange = (e) => {
    const value = parseInt(e.target.value);
    const remainingAudio = duration - startTime;
    const maxPossibleClip = Math.floor(Math.min(30, remainingAudio));
    const newDuration = Math.max(15, Math.min(value, maxPossibleClip));
    
    setClipDuration(newDuration);
  };

  const skipBackward = () => {
    const newTime = Math.max(0, startTime - 5);
    setStartTime(newTime);
    
    const remainingDuration = duration - newTime;
    if (clipDuration > remainingDuration) {
      const adjustedClipDuration = Math.max(15, Math.min(30, Math.floor(remainingDuration)));
      setClipDuration(adjustedClipDuration);
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipForward = () => {
    const newTime = Math.min(duration - 15, startTime + 5);
    setStartTime(newTime);
    
    const remainingDuration = duration - newTime;
    if (clipDuration > remainingDuration) {
      const adjustedClipDuration = Math.max(15, Math.min(30, Math.floor(remainingDuration)));
      setClipDuration(adjustedClipDuration);
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    setIsPlaying(false);
    
    onConfirm({
      ...musicData,
      startTime,
      clipDuration,
      endTime: startTime + clipDuration
    });
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    setIsPlaying(false);
    onClose();
  };

  const handleBackToSearch = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    setIsPlaying(false);
    
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (clipDuration === 0) return 0;
    const progress = ((currentTime - startTime) / clipDuration) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const maxStartTime = Math.max(0, duration - 15);
  const remainingFromStart = duration - startTime;
  const maxClipDuration = Math.floor(Math.min(30, remainingFromStart));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSearch}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2 transition-all"
              title="Back to search"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Select Music Clip</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Music Info */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
            <img
              src={musicData.cover}
              alt={musicData.title}
              className="w-16 h-16 rounded-xl shadow-lg"
              onError={(e) => e.target.src = '/default-music.png'}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{musicData.title}</p>
              <p className="text-sm text-gray-600 truncate">{musicData.artist}</p>
              <p className="text-xs text-purple-600 font-semibold mt-1">
                Full length: {formatTime(duration)}
              </p>
            </div>
          </div>

          {loadError ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X size={32} className="text-red-600" />
              </div>
              <p className="text-red-600 font-semibold text-center mb-2">{loadError}</p>
              <p className="text-sm text-gray-500 text-center mb-4">This preview may not be available</p>
              <button
                onClick={handleBackToSearch}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Choose Another Song
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-600">Loading audio...</p>
            </div>
          ) : (
            <>
              {/* Playback Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={skipBackward}
                    disabled={startTime === 0}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipBack size={20} className="text-gray-700" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <Pause size={28} className="text-white" fill="white" />
                    ) : (
                      <Play size={28} className="text-white ml-1" fill="white" />
                    )}
                  </button>
                  
                  <button
                    onClick={skipForward}
                    disabled={startTime >= maxStartTime}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipForward size={20} className="text-gray-700" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-100"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-purple-600 font-bold">{clipDuration}s clip</span>
                    <span>{formatTime(startTime + clipDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Start Time Selector */}
              <div className="space-y-3">
                <label className="block">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Start Point</span>
                      <p className="text-xs text-gray-500 mt-0.5">Choose where to start the clip</p>
                    </div>
                    <span className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                      {formatTime(startTime)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxStartTime}
                    step="0.1"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider-purple"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>0:00</span>
                    <span>{formatTime(maxStartTime)}</span>
                  </div>
                </label>
              </div>

              {/* Clip Duration Selector */}
              <div className="space-y-3">
                <label className="block">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Clip Length</span>
                      <p className="text-xs text-gray-500 mt-0.5">15-30 seconds</p>
                    </div>
                    <span className="text-sm font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-lg">
                      {clipDuration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max={maxClipDuration}
                    step="1"
                    value={clipDuration}
                    onChange={handleClipDurationChange}
                    className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider-pink"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>15s</span>
                    <span>{Math.min(30, maxClipDuration)}s max</span>
                  </div>
                </label>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Selected Clip</p>
                  <p className="text-lg font-bold text-purple-700">
                    {formatTime(startTime)} → {formatTime(startTime + clipDuration)}
                  </p>
                  <p className="text-sm text-pink-600 font-semibold mt-1">
                    {clipDuration} seconds from this song
                  </p>
                </div>
              </div>

              {/* Instagram-style Info */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  <span>Drag to select any part</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-pink-600"></div>
                  <span>15-30s clips</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Bottom Action Buttons */}
        {!isLoading && !loadError && (
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-3">
              <button
                onClick={handleBackToSearch}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
                <span className="text-sm">Change Song</span>
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Check size={20} />
                <span className="text-sm">Use This Clip</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider-purple::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(to right, #9333ea, #db2777);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(147, 51, 234, 0.5);
          transition: all 0.2s;
        }
        .slider-purple::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.6);
        }
        .slider-purple::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(to right, #9333ea, #db2777);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 12px rgba(147, 51, 234, 0.5);
        }
        .slider-pink::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(to right, #db2777, #f43f5e);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(219, 39, 119, 0.5);
          transition: all 0.2s;
        }
        .slider-pink::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(219, 39, 119, 0.6);
        }
        .slider-pink::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(to right, #db2777, #f43f5e);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 12px rgba(219, 39, 119, 0.5);
        }
      `}</style>
    </div>
  );
}