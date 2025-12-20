"use client";
// app/profile/page.js - FIXED AUTH HANDLING

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, uploadVideo, uploadImage, generateThumbnail, getVideoDuration } from "@/lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import ImageCropper from "../components/ImageCropper";

// Components
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import PostGrid from "./components/PostGrid";
import PostViewer from "./components/PostViewer";
import ImageEditorModal from "./components/ImageEditorModal";
import MediaUploader from "./components/MediaUploader";
import MusicPicker from "./components/MusicPicker";

// Icons
import {
  Code, Palette, Brush, Camera, Film, Pen, Megaphone,
  Binary, Terminal, Coffee, Wrench, Cpu, Mic, Users
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Image/Video upload states
  const [mediaUploaderOpen, setMediaUploaderOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentImageType, setCurrentImageType] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);

  // Video states
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);

  // Music states
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  // Post viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);

  // Current media type
  const [currentMediaType, setCurrentMediaType] = useState(null);

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const SKILL_ICONS = {
    "Web Development": Code,
    "UI/UX Design": Palette,
    "Graphic Design": Brush,
    "Photography": Camera,
    "Video Editing": Film,
    "Content Writing": Pen,
    "Digital Marketing": Megaphone,
    Python: Binary,
    "C Programming": Terminal,
    Java: Coffee,
    "Mobile Repairing": Wrench,
    Electronics: Cpu,
    "Public Speaking": Mic,
    Leadership: Users,
  };

  // ✅ IMPROVED AUTH CHECK WITH SESSION HANDLING
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔍 Checking authentication...');

        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setAuthError(sessionError.message);
          router.push("/");
          return;
        }

        if (!session) {
          console.log("❌ No active session found");
          router.push("/");
          return;
        }

        console.log('✅ Session found:', session.user.id);
        
        if (mounted) {
          setUser(session.user);
          await loadProfile(session.user.id);
          await loadPosts(session.user.id);
        }
        
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        setAuthError(error.message);
        router.push("/");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (event === 'SIGNED_IN' && session) {
          if (mounted) {
            setUser(session.user);
            await loadProfile(session.user.id);
            await loadPosts(session.user.id);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const loadProfile = async (userId) => {
    try {
      console.log('📥 Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from("profile_user")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Profile load error:", error);
        throw error;
      }
      
      console.log('✅ Profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      // If profile doesn't exist, redirect to onboarding
      if (error.code === 'PGRST116') {
        console.log('📝 No profile found, redirecting to onboarding');
        router.push('/onboarding/interests?mode=new');
      }
    }
  };

  const loadPosts = async (userId) => {
    try {
      console.log('📥 Loading posts for user:', userId);
      
      const { data, error } = await supabase
        .from("post")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log('✅ Posts loaded:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error("❌ Error loading posts:", error);
      setPosts([]);
    }
  };

  const handleOpenMediaUploader = () => {
    setMediaUploaderOpen(true);
  };

  const handleMediaSelect = async (file, type) => {
    setCurrentMediaType(type);
    
    if (type === 'image') {
      setCurrentImage(file);
      setCurrentImageType('post');
      setMediaUploaderOpen(false);
      setCropperOpen(true);
    } else if (type === 'video') {
      setCurrentVideo(file);
      setCurrentImageType('post');
      
      try {
        setUploadStatus('Generating thumbnail...');
        const thumbnailBlob = await generateThumbnail(file);
        setVideoThumbnail(thumbnailBlob);
        setMediaUploaderOpen(false);
        setEditorOpen(true);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        alert('Failed to process video. Please try again.');
      }
    }
  };

  const openCropper = (file, type) => {
    setCurrentImage(file);
    setCurrentImageType(type);
    setCurrentMediaType('image');
    setCropperOpen(true);
  };

  const onCropDone = (blob) => {
    setCroppedImageBlob(blob);
    setCropperOpen(false);
    setEditorOpen(true);
  };

  const saveImage = async (blob, caption, description) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      if (currentImageType === "post") {
        // Upload image
        setUploadStatus('Uploading image...');
        setUploadProgress(20);
        
        const imageResult = await uploadImage(blob, user.id, 'post-images', 'post');
        setUploadProgress(50);

        // Upload music if selected
        let musicUrl = null;
        if (selectedMusic) {
          setUploadStatus('Uploading music...');
          const musicPath = `${user.id}/music-${Date.now()}.${selectedMusic.file.name.split('.').pop()}`;
          await supabase.storage
            .from("post-music")
            .upload(musicPath, selectedMusic.file, { upsert: true });
          const musicData = supabase.storage.from("post-music").getPublicUrl(musicPath);
          musicUrl = musicData.data.publicUrl;
        }

        setUploadProgress(80);
        setUploadStatus('Creating post...');

        // Insert post
        const { error: insertError } = await supabase.from("post").insert({
          user_id: user.id,
          content: caption || '',
          caption: caption || '',
          image_url: imageResult.url,
          media_urls: [imageResult.url],
        });

        if (insertError) throw insertError;

        setUploadProgress(100);
        await loadPosts(user.id);
        setSelectedMusic(null);

      } else {
        // Profile/cover pic upload
        setUploadStatus('Uploading profile picture...');
        const result = await uploadImage(blob, user.id, 'profile-pics', currentImageType === 'profile_pic' ? 'profile' : 'cover');
        
        setUploadProgress(50);
        setUploadStatus('Updating profile...');

        const updateField = currentImageType === 'profile_pic' ? 'profile_pic' : 'cover_pic';
        await supabase.from("profile_user")
          .update({ [updateField]: result.url })
          .eq("id", user.id);
        
        setUploadProgress(100);
        await loadProfile(user.id);
      }
      
      setCroppedImageBlob(null);
      console.log('✅ Image saved successfully');

    } catch (error) {
      console.error("❌ Error saving image:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const saveVideo = async (thumbnailBlob, caption, description) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      setUploadStatus('Uploading video...');
      setUploadProgress(10);
      
      const videoResult = await uploadVideo(currentVideo, user.id, (progress) => {
        setUploadProgress(10 + (progress * 0.4));
      });

      console.log('✅ Video uploaded:', videoResult.url);
      setUploadProgress(50);

      setUploadStatus('Uploading thumbnail...');
      const thumbnailResult = await uploadImage(thumbnailBlob, user.id, 'video-thumbnails', 'thumb');
      
      console.log('✅ Thumbnail uploaded:', thumbnailResult.url);
      setUploadProgress(65);

      let musicUrl = null;
      if (selectedMusic) {
        setUploadStatus('Uploading music...');
        const musicPath = `${user.id}/music-${Date.now()}.${selectedMusic.file.name.split('.').pop()}`;
        await supabase.storage
          .from("post-music")
          .upload(musicPath, selectedMusic.file, { upsert: true });
        const musicData = supabase.storage.from("post-music").getPublicUrl(musicPath);
        musicUrl = musicData.data.publicUrl;
      }

      setUploadProgress(75);

      setUploadStatus('Processing video metadata...');
      const duration = await getVideoDuration(currentVideo);
      setUploadProgress(85);

      setUploadStatus('Creating post...');
      const { error: insertError } = await supabase.from("post").insert({
        user_id: user.id,
        content: caption || '',
        caption: caption || '',
        image_url: thumbnailResult.url,
        media_urls: [videoResult.url],
      });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      setUploadProgress(100);
      setUploadStatus('Complete!');

      await loadPosts(user.id);
      setCurrentVideo(null);
      setVideoThumbnail(null);
      setSelectedMusic(null);

      console.log('✅ Video post created successfully!');

    } catch (error) {
      console.error("❌ Error saving video:", error);
      alert(`Failed to upload video: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 1000);
    }
  };

  const handleEditorSave = async (finalBlob, caption, description) => {
    if (currentMediaType === 'video') {
      await saveVideo(finalBlob, caption, description);
    } else {
      await saveImage(finalBlob, caption, description);
    }
  };

  const openViewer = (index) => {
    setSelectedPostIndex(index);
    setViewerOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setCroppedImageBlob(null);
    setCurrentVideo(null);
    setVideoThumbnail(null);
  };

  const handlePostDeleted = async (postId) => {
    try {
      const { error } = await supabase
        .from('post')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    } catch (error) {
      console.error("❌ Error deleting post:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#e9eaec]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#e9eaec]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Show "no profile" state
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#e9eaec]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Let's set up your profile first</p>
          <button
            onClick={() => router.push('/onboarding/interests?mode=new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full bg-[#e9eaec] p-8">
        <ProfileHeader
          profile={profile}
          SKILL_ICONS={SKILL_ICONS}
          openCropper={openCropper}
          router={router}
        />

        <ProfileStats profile={profile} />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "posts" && (
          <PostGrid 
            posts={posts} 
            openMediaUploader={handleOpenMediaUploader}
            openViewer={openViewer} 
          />
        )}
      </div>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              {currentMediaType === 'video' ? 'Uploading Video' : 'Uploading Image'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{uploadStatus}</p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700">{uploadProgress}%</p>
              {uploadProgress === 100 && (
                <p className="text-sm text-green-600 font-semibold">✓ Complete</p>
              )}
            </div>

            {currentMediaType === 'video' && uploadProgress < 100 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                This may take a few moments depending on video size
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {mediaUploaderOpen && (
        <MediaUploader
          isOpen={mediaUploaderOpen}
          onMediaSelect={handleMediaSelect}
          onClose={() => setMediaUploaderOpen(false)}
        />
      )}

      {cropperOpen && (
        <ImageCropper
          isOpen={cropperOpen}
          image={currentImage}
          onCrop={onCropDone}
          onClose={() => setCropperOpen(false)}
          aspectRatio={currentImageType === "profile_pic" ? 1 : currentImageType === "cover_pic" ? 6.2 : null}
          cropShape={currentImageType === "profile_pic" ? "circle" : "rect"}
          cropType={currentImageType === "cover_pic" ? "cover" : "post"}
        />
      )}

      {editorOpen && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={handleEditorClose}
          image={currentMediaType === 'video' ? videoThumbnail : croppedImageBlob}
          onSave={handleEditorSave}
          type={currentImageType}
          mediaType={currentMediaType}
          onAddMusic={() => setMusicPickerOpen(true)}
          currentMusic={selectedMusic}
        />
      )}

      {musicPickerOpen && (
        <MusicPicker
          isOpen={musicPickerOpen}
          onClose={() => setMusicPickerOpen(false)}
          onSelectMusic={setSelectedMusic}
          currentMusic={selectedMusic}
        />
      )}

      {viewerOpen && (
        <PostViewer
          viewerOpen={viewerOpen}
          selectedPostIndex={selectedPostIndex}
          posts={posts}
          profile={profile}
          onClose={() => setViewerOpen(false)}
          prev={() => setSelectedPostIndex(selectedPostIndex - 1)}
          next={() => setSelectedPostIndex(selectedPostIndex + 1)}
          onPostDeleted={handlePostDeleted}
        />
      )}
    </div>
  );
}