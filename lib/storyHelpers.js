// lib/storyHelpers.js
import { supabase } from './supabaseClient';

const BUCKET_NAME = 'stories-media'; // matches your Supabase bucket name

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataUrl) {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error('Error converting data URL to blob:', error);
    throw new Error('Failed to convert image data');
  }
}

/**
 * Upload media file to Supabase Storage
 */
export async function uploadMediaToSupabase(dataUrl, userId, type = 'image') {
  try {
    if (!dataUrl) throw new Error('No data URL provided');
    if (!userId) throw new Error('User ID is required');

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = type === 'video' ? 'mp4' : 'jpg';
    const filename = `${userId}/media/${timestamp}-${randomStr}.${extension}`;
    
    console.log('📤 Uploading media:', filename);
    
    const blob = dataURLtoBlob(dataUrl);
    const contentType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    
    console.log('✅ Media uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadMediaToSupabase:', error);
    throw error;
  }
}

/**
 * Upload music file to Supabase Storage
 */
export async function uploadMusicToSupabase(dataUrl, userId) {
  try {
    if (!dataUrl) throw new Error('No audio data URL provided');
    if (!userId) throw new Error('User ID is required');

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `${userId}/music/${timestamp}-${randomStr}.mp3`;
    
    console.log('📤 Uploading music:', filename);
    
    const blob = dataURLtoBlob(dataUrl);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Music upload error:', error);
      throw new Error(`Music upload failed: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    
    console.log('✅ Music uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadMusicToSupabase:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromSupabase(fileUrl) {
  try {
    if (!fileUrl) return;

    const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    console.log('🗑️ Deleting file:', filePath);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) throw error;
    
    console.log('✅ File deleted:', filePath);
  } catch (error) {
    console.error('Error in deleteFileFromSupabase:', error);
  }
}

/**
 * Compress image to reduce size
 */
export function compressImage(dataUrl, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!dataUrl) {
      reject(new Error('No data URL provided'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Get file size from data URL
 */
export function getDataURLSize(dataUrl) {
  if (!dataUrl) return 0;
  
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Base64 encoding increases size by ~33%
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  return sizeInMB;
}

/**
 * Validate media file
 */
export function validateMedia(dataUrl, maxSizeMB = 10) {
  if (!dataUrl) {
    return { valid: false, error: 'No media provided' };
  }

  const size = getDataURLSize(dataUrl);
  
  if (size > maxSizeMB) {
    return { 
      valid: false, 
      error: `File size (${size.toFixed(2)}MB) exceeds ${maxSizeMB}MB limit` 
    };
  }

  return { valid: true, size };
}