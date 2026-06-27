// app/messages/components/FileUploadModal.jsx
// ✅ FIXED with better error handling and logging

import React, { useState, useRef } from 'react';
import { X, Paperclip, Image, File, FileText, Video, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const FileUploadModal = ({ isOpen, onClose, onFileUploaded, conversationId }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // File type validation
    const ALLOWED_TYPES = {
        images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        videos: ['video/mp4', 'video/webm', 'video/ogg'],
        documents: ['application/pdf', 'text/plain', 'application/msword', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const isValidFile = (file) => {
        const allAllowed = [
            ...ALLOWED_TYPES.images, 
            ...ALLOWED_TYPES.videos, 
            ...ALLOWED_TYPES.documents
        ];
        
        if (!allAllowed.includes(file.type)) {
            setError('File type not supported. Use images, videos, or documents.');
            return false;
        }

        if (file.size > MAX_SIZE) {
            setError('File too large. Maximum size is 10MB.');
            return false;
        }

        setError(null);
        return true;
    };

    const handleFileSelect = (file) => {
        if (!file || !isValidFile(file)) return;

        setSelectedFile(file);

        // Create preview
        if (ALLOWED_TYPES.images.includes(file.type)) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview({
                    type: 'image',
                    url: reader.result,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        } else if (ALLOWED_TYPES.videos.includes(file.type)) {
            const videoUrl = URL.createObjectURL(file);
            setPreview({
                type: 'video',
                url: videoUrl,
                name: file.name
            });
        } else {
            setPreview({
                type: 'document',
                name: file.name,
                size: formatFileSize(file.size),
                extension: file.name.split('.').pop()?.toUpperCase() || 'FILE'
            });
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            setError('No file selected');
            return;
        }

        if (!conversationId) {
            setError('No conversation ID provided');
            console.error('❌ Missing conversationId:', conversationId);
            return;
        }

        console.log('📤 Starting upload...');
        console.log('File:', selectedFile.name, selectedFile.type, formatFileSize(selectedFile.size));
        console.log('Conversation:', conversationId);

        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            // Generate unique filename
            const fileExt = selectedFile.name.split('.').pop();
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const fileName = `${conversationId}/${timestamp}_${random}.${fileExt}`;

            console.log('📁 Upload path:', fileName);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            // Skip bucket check - it exists, just upload directly
            console.log('📦 Using bucket: chat-files');

            // Upload to Supabase Storage
            console.log('⬆️ Uploading to storage...');
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-files')
                .upload(fileName, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            clearInterval(progressInterval);
            setUploadProgress(95);

            if (uploadError) {
                console.error('❌ Upload error:', uploadError);
                throw new Error('Upload failed: ' + uploadError.message);
            }

            console.log('✅ File uploaded:', uploadData);

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('chat-files')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;
            console.log('🔗 Public URL:', publicUrl);

            setUploadProgress(100);

            // Prepare file data
            const fileData = {
                url: publicUrl,
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                caption: caption.trim(),
                isImage: ALLOWED_TYPES.images.includes(selectedFile.type),
                isVideo: ALLOWED_TYPES.videos.includes(selectedFile.type)
            };

            console.log('📨 Sending file data to parent:', fileData);

            // Send to parent component
            await onFileUploaded(fileData);

            console.log('✅ Upload complete!');

            // Reset and close
            setTimeout(() => {
                handleClose();
            }, 500);

        } catch (error) {
            console.error('❌ Upload failed:', error);
            setError(error.message || 'Failed to upload file. Please try again.');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        setUploading(false);
        setUploadProgress(0);
        setError(null);
        onClose();
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type) => {
        if (type === 'image') return <Image className="w-6 h-6 text-blue-400" />;
        if (type === 'video') return <Video className="w-6 h-6 text-purple-400" />;
        return <FileText className="w-6 h-6 text-green-400" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-purple-500/30 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-purple-500/20 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-purple-400" />
                        Send File
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    {!selectedFile ? (
                        /* File Selection Zone */
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                dragActive 
                                    ? 'border-purple-500 bg-purple-500/10' 
                                    : 'border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                accept={[
                                    ...ALLOWED_TYPES.images, 
                                    ...ALLOWED_TYPES.videos, 
                                    ...ALLOWED_TYPES.documents
                                ].join(',')}
                                className="hidden"
                            />
                            
                            <div className="mb-3">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <File className="w-8 h-8 text-purple-400" />
                                </div>
                                <p className="text-white font-semibold mb-1 text-sm">
                                    {dragActive ? 'Drop file here' : 'Choose a file or drag it here'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Images, Videos, Documents (Max 10MB)
                                </p>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
                            >
                                Browse Files
                            </button>
                        </div>
                    ) : (
                        /* File Preview */
                        <div className="space-y-3">
                            {/* Preview */}
                            <div className="bg-slate-800 rounded-xl p-3">
                                {preview?.type === 'image' && (
                                    <img
                                        src={preview.url}
                                        alt="Preview"
                                        className="w-full max-h-64 object-contain rounded-lg"
                                    />
                                )}
                                
                                {preview?.type === 'video' && (
                                    <video
                                        src={preview.url}
                                        controls
                                        className="w-full max-h-64 rounded-lg"
                                    />
                                )}
                                
                                {preview?.type === 'document' && (
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            {getFileIcon(preview.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate mb-0.5">
                                                {preview.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {preview.extension} • {preview.size}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">
                                    Add a caption (optional)
                                </label>
                                <input
                                    type="text"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={uploading}
                                    className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 disabled:opacity-50"
                                    maxLength={200}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {caption.length}/200
                                </p>
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Uploading...</span>
                                        <span className="text-purple-400 font-semibold">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                                <div className="flex gap-2">
                                    <AlertCircle className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-300">
                                        This file will be visible to both users
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreview(null);
                                        setCaption('');
                                        setError(null);
                                    }}
                                    disabled={uploading}
                                    className="flex-1 py-2 text-sm bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                    Choose Different
                                </button>
                                <button
                                    onClick={uploadFile}
                                    disabled={uploading}
                                    className="flex-1 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        'Send File'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUploadModal;