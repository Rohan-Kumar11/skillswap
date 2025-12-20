"use client";
import { useState, useRef } from 'react';
import { Music, Upload, X, Play, Pause, Trash2, Scissors } from 'lucide-react';
import MusicBrowser from './MusicBrowser';
import AudioTrimmer from './AudioTrimmer';

export default function MusicPicker({ isOpen, onClose, onSelectMusic, currentMusic }) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [selectedMusicForTrim, setSelectedMusicForTrim] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleMusicFromBrowser = async (musicData) => {
    // Close browser and open trimmer
    setShowBrowser(false);
    setSelectedMusicForTrim(musicData);
    setShowTrimmer(true);
  };

  const handleTrimmerConfirm = async (trimmedData) => {
    // Download the preview audio and convert to file
    try {
      const response = await fetch(trimmedData.preview);
      const blob = await response.blob();
      const file = new File([blob], `${trimmedData.title}.mp3`, { type: 'audio/mpeg' });
      
      onSelectMusic({
        file: file,
        title: trimmedData.title,
        artist: trimmedData.artist,
        duration: trimmedData.clipDuration,
        cover: trimmedData.cover,
        preview: trimmedData.preview,
        startTime: trimmedData.startTime,
        endTime: trimmedData.endTime
      });
      
      setShowTrimmer(false);
      onClose();
    } catch (error) {
      console.error('Error downloading music:', error);
      alert('Failed to download music. Please try uploading a file instead.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Audio file must be less than 10MB');
      return;
    }

    const fileName = file.name.replace(/\.[^/.]+$/, "");
    
    onSelectMusic({
      file: file,
      title: fileName,
      artist: 'Unknown Artist',
      duration: 0,
      cover: null,
      preview: URL.createObjectURL(file)
    });
    
    onClose();
  };

  const togglePreview = () => {
    if (!currentMusic?.preview) return;

    if (playingPreview) {
      audioRef.current?.pause();
      setPlayingPreview(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(currentMusic.preview);
      audioRef.current.play();
      setPlayingPreview(true);
      
      audioRef.current.onended = () => {
        setPlayingPreview(false);
      };
    }
  };

  const handleRemoveMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingPreview(false);
    onSelectMusic(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900">Add Music</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* Current Music Display */}
            {currentMusic ? (
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center gap-4">
                  {currentMusic.cover ? (
                    <img
                      src={currentMusic.cover}
                      alt={currentMusic.title}
                      className="w-16 h-16 rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <Music size={32} className="text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {currentMusic.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {currentMusic.artist}
                    </p>
                    {currentMusic.duration > 0 && (
                      <p className="text-xs text-purple-600 font-semibold mt-1">
                        {currentMusic.duration}s clip
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {currentMusic.preview && (
                      <button
                        onClick={togglePreview}
                        className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all"
                      >
                        {playingPreview ? (
                          <Pause size={18} className="text-white" fill="white" />
                        ) : (
                          <Play size={18} className="text-white ml-0.5" fill="white" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleRemoveMusic}
                      className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                  <Music size={40} className="text-white" />
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  No music selected yet
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Choose from library or upload your own
                </p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              
              {/* Browse Music Library */}
              <button
                onClick={() => setShowBrowser(true)}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <Music size={24} />
                <span>Browse Music Library</span>
                <Scissors size={18} className="ml-auto opacity-75" />
              </button>

              {/* Upload Custom Music */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Upload size={24} />
                Upload Your Own
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="mt-6 space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800 flex items-center gap-2">
                  <Scissors size={14} className="flex-shrink-0" />
                  <span><strong>New:</strong> Trim any song to 15-60 seconds</span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-xs text-purple-800">
                  <strong>Browse:</strong> Search thousands of songs from Deezer or upload your own audio file (MP3, WAV, etc.)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Browser Modal */}
      <MusicBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelectMusic={handleMusicFromBrowser}
        currentMusic={currentMusic}
      />

      {/* Audio Trimmer Modal */}
      <AudioTrimmer
        isOpen={showTrimmer}
        onClose={() => setShowTrimmer(false)}
        musicData={selectedMusicForTrim}
        onConfirm={handleTrimmerConfirm}
      />
    </>
  );
}