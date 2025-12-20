"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Music, Play, Pause, Check, TrendingUp, Clock, X, ArrowRight } from 'lucide-react';

export default function MusicBrowser({ isOpen, onClose, onSelectMusic, currentMusic }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [playingPreview, setPlayingPreview] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const RAPIDAPI_KEY = '53219be129msh234721c4b3f3a11p16d0eajsn5122443254b8';
  const RAPIDAPI_HOST = 'deezerdevs-deezer.p.rapidapi.com';

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingPreview(null);
  }, []);

  const loadTrendingMusic = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('https://deezerdevs-deezer.p.rapidapi.com/chart', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });
      const data = await response.json();
      setTrendingTracks(data.tracks?.data?.slice(0, 20) || []);
    } catch (error) {
      console.error('Error loading trending music:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentMusic = useCallback(async () => {
    try {
      const response = await fetch('https://deezerdevs-deezer.p.rapidapi.com/playlist/1963962142', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      });
      const data = await response.json();
      setRecentTracks(data.tracks?.data?.slice(0, 20) || []);
    } catch (error) {
      console.error('Error loading recent music:', error);
    }
  }, []);

  const searchMusic = useCallback(async (query) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST
          }
        }
      );
      const data = await response.json();
      setSearchResults(data.data?.slice(0, 30) || []);
    } catch (error) {
      console.error('Error searching music:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTrendingMusic();
      loadRecentMusic();
      setSelectedTrack(currentMusic);
    } else {
      stopPreview();
      setSelectedTrack(null);
    }
  }, [isOpen, loadTrendingMusic, loadRecentMusic, stopPreview, currentMusic]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setActiveTab('search');
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchMusic(searchQuery);
      }, 500);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchMusic]);

  if (!isOpen) return null;

  const togglePreview = (track) => {
    if (!track.preview) return;

    if (playingPreview?.id === track.id) {
      stopPreview();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.preview);
      audioRef.current.play();
      setPlayingPreview(track);
      
      audioRef.current.onended = () => {
        setPlayingPreview(null);
      };
    }
  };

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
  };

  const handleConfirmSelection = () => {
    if (selectedTrack) {
      stopPreview();
      onSelectMusic({
        id: selectedTrack.id,
        title: selectedTrack.title,
        artist: selectedTrack.artist.name,
        duration: selectedTrack.duration,
        preview: selectedTrack.preview,
        cover: selectedTrack.album.cover_medium,
      });
      onClose();
    }
  };

  const getCurrentTracks = () => {
    if (activeTab === 'search') return searchResults;
    if (activeTab === 'recent') return recentTracks;
    return trendingTracks;
  };

  const isSelected = (track) => selectedTrack?.id === track.id;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-bold text-gray-900">Add Music</h2>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for songs, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        {searchQuery.trim().length === 0 && (
          <div className="flex px-6 pt-4 gap-2">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'trending'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={18} />
              Trending
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'recent'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock size={18} />
              Popular
            </button>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : getCurrentTracks().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Music size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No results found' : 'No music available'}
              </p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Check back later'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {getCurrentTracks().map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer ${
                    isSelected(track) ? 'bg-purple-50 border-2 border-purple-500' : ''
                  }`}
                  onClick={() => handleSelectTrack(track)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={track.album.cover_small}
                      alt={track.title}
                      className="w-14 h-14 rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(track);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-all"
                    >
                      {playingPreview?.id === track.id ? (
                        <Pause size={24} className="text-white" fill="white" />
                      ) : (
                        <Play size={24} className="text-white" fill="white" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {track.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {track.artist.name}
                    </p>
                  </div>

                  <div className="text-sm text-gray-500 flex-shrink-0">
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                  </div>

                  {isSelected(track) && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <Check size={20} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Confirm Button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {selectedTrack ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <img
                  src={selectedTrack.album.cover_small}
                  alt={selectedTrack.title}
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {selectedTrack.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedTrack.artist.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleConfirmSelection}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center">
              Music provided by Deezer • Select a song to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}