"use client";
import { useState, useRef, useEffect } from 'react';
import { X, Type, Sparkles, Music, Play, Pause, Wand2, Sliders, Camera } from 'lucide-react';

export default function ImageEditorModal({ isOpen, onClose, image, onSave, type, mediaType, onAddMusic, currentMusic }) {
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });
  const [selectedPreset, setSelectedPreset] = useState('normal');
  const [activeTab, setActiveTab] = useState('filters');
  const [playingMusic, setPlayingMusic] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const isPost = type === 'post';

  const filterPresets = [
    {
      id: 'normal',
      name: 'Normal',
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 }
    },
    {
      id: 'clarendon',
      name: 'Clarendon',
      filters: { brightness: 110, contrast: 120, saturation: 125, blur: 0 }
    },
    {
      id: 'gingham',
      name: 'Gingham',
      filters: { brightness: 105, contrast: 95, saturation: 85, blur: 0 }
    },
    {
      id: 'moon',
      name: 'Moon',
      filters: { brightness: 110, contrast: 110, saturation: 0, blur: 0 }
    },
    {
      id: 'lark',
      name: 'Lark',
      filters: { brightness: 110, contrast: 90, saturation: 110, blur: 0 }
    },
    {
      id: 'reyes',
      name: 'Reyes',
      filters: { brightness: 110, contrast: 85, saturation: 75, blur: 0 }
    },
    {
      id: 'juno',
      name: 'Juno',
      filters: { brightness: 110, contrast: 110, saturation: 120, blur: 0 }
    },
    {
      id: 'slumber',
      name: 'Slumber',
      filters: { brightness: 105, contrast: 95, saturation: 90, blur: 0 }
    },
    {
      id: 'crema',
      name: 'Crema',
      filters: { brightness: 105, contrast: 90, saturation: 95, blur: 0 }
    },
    {
      id: 'ludwig',
      name: 'Ludwig',
      filters: { brightness: 105, contrast: 115, saturation: 110, blur: 0 }
    },
    {
      id: 'aden',
      name: 'Aden',
      filters: { brightness: 110, contrast: 90, saturation: 85, blur: 0 }
    },
    {
      id: 'perpetua',
      name: 'Perpetua',
      filters: { brightness: 100, contrast: 110, saturation: 105, blur: 0 }
    }
  ];

  useEffect(() => {
    if (isOpen && image) {
      drawImageWithFilters();
    }
  }, [isOpen, image, filters]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const drawImageWithFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
      `;

      ctx.drawImage(img, 0, 0);
    };
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setFilters(preset.filters);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (isPost) {
        onSave(blob, caption, description);
      } else {
        onSave(blob);
      }
      onClose();
    }, 'image/jpeg', 0.95);
  };

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    });
    setSelectedPreset('normal');
  };

  const toggleMusicPreview = () => {
    if (!currentMusic?.preview) return;

    if (playingMusic) {
      audioRef.current?.pause();
      setPlayingMusic(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(currentMusic.preview);
      audioRef.current.play();
      setPlayingMusic(true);
      
      audioRef.current.onended = () => {
        setPlayingMusic(false);
      };
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col backdrop-blur-xl border border-gray-200">
        
        {/* Modern Header with Gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {type === 'profile_pic' ? 'Profile Picture' : type === 'cover_pic' ? 'Cover Image' : 'Create Post'}
                </h2>
                <p className="text-xs text-white/80">
                  {mediaType === 'video' ? 'Edit your video' : 'Edit and enhance your photo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all backdrop-blur-sm"
            >
              <X size={24} />
            </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left: Image Preview */}
          <div className="lg:w-[58%] p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            <div className="flex-1 relative bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mt-4 bg-white rounded-2xl p-1.5 shadow-lg">
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'filters'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Wand2 size={18} />
                Filters
              </button>
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'adjust'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sliders size={18} />
                Adjust
              </button>
            </div>

            {/* Filter/Adjust Content */}
            <div className="mt-4">
              {activeTab === 'filters' ? (
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 text-sm">Choose a Filter</h3>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {filterPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`flex-shrink-0 relative group ${
                          selectedPreset === preset.id
                            ? 'ring-4 ring-purple-500'
                            : 'hover:ring-4 hover:ring-gray-300'
                        } rounded-xl overflow-hidden transition-all shadow-lg`}
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                          <canvas
                            ref={(canvas) => {
                              if (canvas && image) {
                                const ctx = canvas.getContext('2d');
                                const img = new Image();
                                img.src = URL.createObjectURL(image);
                                img.onload = () => {
                                  canvas.width = 80;
                                  canvas.height = 80;
                                  ctx.filter = `
                                    brightness(${preset.filters.brightness}%)
                                    contrast(${preset.filters.contrast}%)
                                    saturate(${preset.filters.saturation}%)
                                    blur(${preset.filters.blur}px)
                                  `;
                                  ctx.drawImage(img, 0, 0, 80, 80);
                                };
                              }
                            }}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5">
                          <span className="text-white text-[10px] font-bold leading-tight">
                            {preset.name}
                          </span>
                        </div>
                        {selectedPreset === preset.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 shadow-lg space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">Fine Tune</h3>
                  
                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-600 font-medium">Brightness</span>
                      <span className="font-bold text-purple-600">{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.brightness}
                      onChange={(e) => {
                        setFilters({ ...filters, brightness: e.target.value });
                        setSelectedPreset('custom');
                      }}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-600 font-medium">Contrast</span>
                      <span className="font-bold text-purple-600">{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.contrast}
                      onChange={(e) => {
                        setFilters({ ...filters, contrast: e.target.value });
                        setSelectedPreset('custom');
                      }}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-600 font-medium">Saturation</span>
                      <span className="font-bold text-purple-600">{filters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) => {
                        setFilters({ ...filters, saturation: e.target.value });
                        setSelectedPreset('custom');
                      }}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Blur */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-600 font-medium">Blur</span>
                      <span className="font-bold text-purple-600">{filters.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={filters.blur}
                      onChange={(e) => {
                        setFilters({ ...filters, blur: e.target.value });
                        setSelectedPreset('custom');
                      }}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:w-[42%] p-6 bg-white flex flex-col overflow-y-auto">
            {isPost ? (
              <div className="space-y-4 flex-1">
                {/* Caption */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                    <Type size={18} className="text-purple-600" />
                    Caption
                  </label>
                  <input
                    type="text"
                    placeholder="Write something amazing..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-gray-800 placeholder-gray-400"
                  />
                  <p className="text-xs text-purple-600 font-semibold mt-2">{caption.length}/100</p>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                    <Sparkles size={18} className="text-blue-600" />
                    Description
                  </label>
                  <textarea
                    placeholder="Share more details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none text-gray-800 placeholder-gray-400"
                  />
                  <p className="text-xs text-blue-600 font-semibold mt-2">{description.length}/500</p>
                </div>

                {/* Music Section */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                      <Music size={18} className="text-pink-600" />
                      Add Music
                    </h3>
                    <button
                      onClick={onAddMusic}
                      className="text-xs text-pink-600 hover:text-pink-700 font-semibold"
                    >
                      {currentMusic ? 'Change' : 'Browse'}
                    </button>
                  </div>

                  {currentMusic ? (
                    <div className="bg-white rounded-xl p-3 border-2 border-pink-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        {currentMusic.cover ? (
                          <img
                            src={currentMusic.cover}
                            alt={currentMusic.title}
                            className="w-12 h-12 rounded-lg shadow-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                            <Music size={20} className="text-white" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate">
                            {currentMusic.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {currentMusic.artist}
                          </p>
                        </div>

                        {currentMusic.preview && (
                          <button
                            onClick={toggleMusicPreview}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 flex items-center justify-center transition-all shadow-md"
                          >
                            {playingMusic ? (
                              <Pause size={14} className="text-white" fill="white" />
                            ) : (
                              <Play size={14} className="text-white ml-0.5" fill="white" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onAddMusic}
                      className="w-full p-4 border-2 border-dashed border-pink-300 rounded-xl hover:border-pink-500 hover:bg-pink-100 transition-all group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-pink-100 group-hover:bg-pink-200 flex items-center justify-center transition-all">
                          <Music size={18} className="text-pink-600" />
                        </div>
                        <p className="text-xs font-semibold text-gray-600 group-hover:text-gray-900">
                          Add background music
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Camera size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {type === 'profile_pic' ? 'Edit Profile Picture' : 'Edit Cover Image'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Apply filters and adjustments to perfect your image
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
            >
              {isPost ? '✨ Publish Post' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}