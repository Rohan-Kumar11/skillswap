"use client";
import { useState, useRef, useEffect } from 'react';
import { Image, Video, X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function MediaUploader({ isOpen, onMediaSelect, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_VIDEO_DURATION = 60; // 60 seconds

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const validateImage = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF)');
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must be less than 10MB');
      return false;
    }
    return true;
  };

  const validateVideo = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (MP4, MOV, AVI)');
        resolve(false);
        return;
      }
      if (file.size > MAX_VIDEO_SIZE) {
        setError('Video size must be less than 100MB');
        resolve(false);
        return;
      }

      // Check video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          setError(`Video duration must be less than ${MAX_VIDEO_DURATION} seconds (${Math.floor(video.duration)}s detected)`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        setError('Failed to load video file. Please try another file.');
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file, type) => {
    setError('');
    setIsProcessing(true);
    
    try {
      if (type === 'image') {
        if (validateImage(file)) {
          onMediaSelect(file, 'image');
        } else {
          setIsProcessing(false);
        }
      } else if (type === 'video') {
        const isValid = await validateVideo(file);
        if (isValid) {
          onMediaSelect(file, 'video');
        } else {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      setError('An error occurred while processing the file');
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      await handleFileSelect(file, 'image');
    } else if (file.type.startsWith('video/')) {
      await handleFileSelect(file, 'video');
    } else {
      setError('Please drop an image or video file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slideDown">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-blue-800 font-medium">Processing your file...</p>
            </div>
          )}

          {/* Type Selection */}
          {!selectedType && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-center text-gray-600 text-sm mb-6">
                Choose what you'd like to share
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Image Option */}
                <button
                  onClick={() => setSelectedType('image')}
                  disabled={isProcessing}
                  className="group relative p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Image size={32} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Photo</span>
                    <span className="text-xs text-gray-500">JPG, PNG, GIF</span>
                    <span className="text-xs text-gray-400">Max 10MB</span>
                  </div>
                </button>

                {/* Video Option */}
                <button
                  onClick={() => setSelectedType('video')}
                  disabled={isProcessing}
                  className="group relative p-6 border-2 border-gray-200 rounded-2xl hover:border-pink-500 hover:bg-pink-50 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Video size={32} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Video</span>
                    <span className="text-xs text-gray-500">MP4, MOV, AVI</span>
                    <span className="text-xs text-gray-400">Max 60s, 100MB</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Upload Area - Image */}
          {selectedType === 'image' && (
            <div className="space-y-4 animate-fadeIn">
              <button
                onClick={() => {
                  setSelectedType(null);
                  setError('');
                }}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>←</span> Back to options
              </button>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center transition-transform ${dragActive ? 'scale-110' : ''}`}>
                    <Upload size={36} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-semibold mb-1">
                      Drag and drop your photo here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Browse Files
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Supported formats: JPG, PNG, GIF<br />
                    Maximum size: 10MB
                  </p>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0], 'image')}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {/* Upload Area - Video */}
          {selectedType === 'video' && (
            <div className="space-y-4 animate-fadeIn">
              <button
                onClick={() => {
                  setSelectedType(null);
                  setError('');
                }}
                disabled={isProcessing}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>←</span> Back to options
              </button>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
                  dragActive
                    ? 'border-pink-500 bg-pink-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center transition-transform ${dragActive ? 'scale-110' : ''}`}>
                    <Upload size={36} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-semibold mb-1">
                      Drag and drop your video here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Browse Files
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Supported formats: MP4, MOV, AVI<br />
                    Maximum: 60 seconds, 100MB
                  </p>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0], 'video')}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}