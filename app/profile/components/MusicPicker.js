"use client";
import { useState, useRef } from 'react';
import { Music, Upload, X, Play, Pause, Trash2, Scissors } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import MusicBrowser from './MusicBrowser';
import AudioTrimmer from './AudioTrimmer';

export default function MusicPicker({ isOpen, onClose, onSelectMusic, currentMusic, videoDuration }) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [selectedMusicForTrim, setSelectedMusicForTrim] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleMusicFromBrowser = async (musicData) => {
    setShowBrowser(false);
    setSelectedMusicForTrim(musicData);
    setShowTrimmer(true);
  };

  const handleTrimmerConfirm = async (trimmedData) => {
    try {
      console.log('🎵 Starting music upload process...');

      const response = await fetch(trimmedData.preview);
      const blob = await response.blob();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to add music');
        return;
      }

      const timestamp = Date.now();
      const sanitizedTitle = trimmedData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${user.id}/${timestamp}-${sanitizedTitle}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-music')
        .upload(fileName, blob, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        alert('Failed to upload music. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('post-music')
        .getPublicUrl(fileName);

      const musicUrl = urlData.publicUrl;

      // ✅ CRITICAL FIX: Ensure INTEGER types for database
      const startTime = Math.floor(parseFloat(trimmedData.startTime) || 0); // INTEGER
      const clipDuration = Math.floor(parseFloat(trimmedData.clipDuration || trimmedData.duration) || 15); // INTEGER

      console.log('✅ Final music data:', {
        startTime,
        clipDuration,
        types: {
          startTime: typeof startTime,
          clipDuration: typeof clipDuration
        }
      });

      onSelectMusic({
        file: blob,
        musicUrl: musicUrl,
        title: trimmedData.title,
        artist: trimmedData.artist,
        duration: clipDuration, // INTEGER
        clipDuration: clipDuration, // INTEGER
        startTime: startTime, // INTEGER
        endTime: startTime + clipDuration,
        cover: trimmedData.cover,
        preview: musicUrl,
        totalDuration: Math.floor(trimmedData.totalDuration || 30)
      });

      setShowTrimmer(false);
      onClose();

    } catch (error) {
      console.error('❌ Error in music upload:', error);
      alert('Failed to process music. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file (MP3, WAV, etc.)');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to upload music');
        return;
      }

      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}-${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-music')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        alert('Failed to upload music. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('post-music')
        .getPublicUrl(fileName);

      const musicUrl = urlData.publicUrl;

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        const duration = Math.floor(audio.duration);
        URL.revokeObjectURL(audio.src);

        const finalDuration = Math.min(duration, 30);

        onSelectMusic({
          file: file,
          musicUrl: musicUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Custom Upload',
          duration: finalDuration, // INTEGER
          startTime: 0, // INTEGER
          endTime: finalDuration,
          cover: null,
          preview: musicUrl
        });

        onClose();
      };

      audio.onerror = () => {
        console.error('❌ Failed to load audio metadata');
        alert('Failed to process audio file. Please try another file.');
      };

    } catch (error) {
      console.error('❌ Error uploading custom music:', error);
      alert('Failed to upload music. Please try again.');
    }
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
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900">Add Music</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2">
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {currentMusic ? (
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center gap-4">
                  {currentMusic.cover ? (
                    <img src={currentMusic.cover} alt={currentMusic.title} className="w-16 h-16 rounded-lg shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <Music size={32} className="text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{currentMusic.title}</p>
                    <p className="text-sm text-gray-600 truncate">{currentMusic.artist}</p>
                    {currentMusic.duration > 0 && (
                      <p className="text-xs text-purple-600 font-semibold mt-1">
                        {currentMusic.duration}s clip
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {currentMusic.preview && (
                      <button onClick={togglePreview} className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center">
                        {playingPreview ? <Pause size={18} className="text-white" fill="white" /> : <Play size={18} className="text-white ml-0.5" fill="white" />}
                      </button>
                    )}
                    <button onClick={handleRemoveMusic} className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center">
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
                <p className="text-gray-600 text-sm font-medium">No music selected yet</p>
              </div>
            )}

            {videoDuration && videoDuration > 0 && (
              <div className="mb-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
                <p className="text-xs text-pink-800">
                  <strong>Video detected:</strong> {Math.floor(videoDuration)}s • Music will match video length
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button onClick={() => setShowBrowser(true)} className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3">
                <Music size={24} />
                Browse Music Library
                <Scissors size={18} className="ml-auto opacity-75" />
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-3">
                <Upload size={24} />
                Upload Your Own
              </button>

              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </div>
      </div>

      <MusicBrowser isOpen={showBrowser} onClose={() => setShowBrowser(false)} onSelectMusic={handleMusicFromBrowser} currentMusic={currentMusic} />

      <AudioTrimmer isOpen={showTrimmer} onClose={() => setShowTrimmer(false)} musicData={selectedMusicForTrim} onConfirm={handleTrimmerConfirm} onBack={() => { setShowTrimmer(false); setShowBrowser(true); }} videoDuration={videoDuration} />
    </>
  );
}