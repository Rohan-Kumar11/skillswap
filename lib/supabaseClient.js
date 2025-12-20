// =====================================================
// 1. lib/supabaseClient.js - UPDATED
// =====================================================
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Helper to create server-side admin client (ONLY use in API routes)
export function createSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
/**
 * Get current session (client-side)
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user (client-side)
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// =====================================================
// VIDEO/IMAGE UPLOAD FUNCTIONS (Keep these)
// =====================================================

/**
 * Upload video file to Supabase storage
 */
export const uploadVideo = async (file, userId, onProgress) => {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `video-${timestamp}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('📤 Starting video upload:', {
      fileName,
      filePath,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    });

    const videoFile = new File([file], fileName, {
      type: file.type || 'video/mp4'
    });

    const { data, error } = await supabase.storage
      .from('post-videos')
      .upload(filePath, videoFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: videoFile.type
      });

    if (error) {
      console.error('❌ Video upload error:', error);
      throw error;
    }

    console.log('✅ Video uploaded successfully:', data);
    if (onProgress) onProgress(100);

    const { data: urlData } = supabase.storage
      .from('post-videos')
      .getPublicUrl(filePath);

    console.log('🔗 Video public URL:', urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('❌ Upload video failed:', error);
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

/**
 * Upload image file to Supabase storage
 */
export const uploadImage = async (blob, userId, bucketName, prefix = 'image') => {
  try {
    const timestamp = Date.now();
    const fileName = `${prefix}-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const file = new File([blob], fileName, { type: 'image/jpeg' });

    console.log('📤 Starting image upload:', {
      fileName,
      filePath,
      bucket: bucketName
    });

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error('❌ Image upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully:', urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('❌ Upload image failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Get video URL from Supabase storage
 */
export const getVideoUrl = (path) => {
  const { data } = supabase.storage
    .from('post-videos')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Delete file from Supabase storage
 */
export const deleteFile = async (bucketName, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;
    console.log('✅ File deleted:', filePath);
  } catch (error) {
    console.error('❌ Delete file failed:', error);
    throw error;
  }
};

/**
 * Generate video thumbnail from video file
 */
export const generateThumbnail = (videoFile, seekTo = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTo, video.duration);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/jpeg', 0.85);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for thumbnail'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Get video duration
 */
export const getVideoDuration = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};