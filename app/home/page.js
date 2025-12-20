"use client";
// app/Home/page.js - UPDATED FOR SUPABASE AUTH

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { uploadMediaToSupabase, uploadMusicToSupabase, compressImage } from "../../lib/storyHelpers";
import Sidebar from "../components/Sidebar";
import StoryEditor from "../components/StoryEditor";
import StoryViewer from "../components/StoryViewer";
import { useToast, DeleteConfirmationModal } from "../components/Toast";
import { useRouter } from "next/navigation";

const STORY_DURATION = 4500;

export default function HomeFeed() {
  const router = useRouter();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMedia, setEditorMedia] = useState(null);
  const [editorType, setEditorType] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const fileRef = useRef(null);
  const toast = useToast();

  // ✅ Initialize user session using Supabase Auth
  useEffect(() => {
    if (initialized) return;

    const init = async () => {
      try {
        // Get user from Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.log("❌ No session found, redirecting to login");
          router.push("/");
          return;
        }

        setUser(authUser);

        // Get profile from database
        const { data: profileData, error: profileError } = await supabase
          .from('profile_user')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error("❌ Profile fetch error:", profileError);
          router.push("/");
          return;
        }

        setProfile(profileData);
        console.log("✅ Session initialized:", { user: authUser, profile: profileData });
        setInitialized(true);
      } catch (error) {
        console.error("❌ Initialization failed:", error);
        router.push("/");
      }
    };

    init();
  }, [initialized, router]);

  // ✅ Load stories from database
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadStories = async () => {
      try {
        setLoading(true);
        console.log("🔄 Loading stories for user:", user.id);
        
        // Note: You need to create a 'stories' table if you don't have one
        // For now, this will fail gracefully
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("❌ Stories fetch error:", error);
          if (isMounted) {
            setStories([]);
          }
          return;
        }

        if (!isMounted) return;

        const formattedStories = (data || []).map(story => ({
          id: story.id,
          media: story.media_url,
          type: story.media_type || 'image',
          createdAt: story.created_at,
          duration: story.duration || STORY_DURATION,
          meta: story.music_url ? {
            music: {
              dataUrl: story.music_url,
              startMs: story.music_start_ms || 0,
              name: story.music_name || ''
            }
          } : {}
        }));

        setStories(formattedStories);
        console.log(`✅ Loaded ${formattedStories.length} stories`);
        
      } catch (error) {
        console.error("❌ Error loading stories:", error);
        if (isMounted) {
          setStories([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStories();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const triggerAdd = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB", 2000);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (data) {
        setEditorMedia(data);
        setEditorType(f.type.startsWith("video/") ? "video" : "image");
        setShowEditor(true);
      }
    };
    reader.onerror = () => console.error("Could not read file");
    reader.readAsDataURL(f);
    e.target.value = "";
  }, [toast]);

  const handleSaveFromEditor = useCallback(async (imageDataUrl, meta) => {
    if (!imageDataUrl || !user) {
      toast.error("Cannot save: Missing data", 2000);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Saving story for user:", user.id);

      const compressed = await compressImage(imageDataUrl);
      const mediaUrl = await uploadMediaToSupabase(compressed, user.id, 'image');

      let musicUrl = null;
      let musicName = null;
      let musicStartMs = 0;

      if (meta?.music?.dataUrl) {
        try {
          musicUrl = await uploadMusicToSupabase(meta.music.dataUrl, user.id);
          musicName = meta.music.name || 'music.mp3';
          musicStartMs = meta.music.startMs || 0;
        } catch (error) {
          console.error("⚠️ Music upload failed:", error);
        }
      }

      const storyData = {
        user_id: user.id,
        media_url: mediaUrl,
        media_type: 'image',
        duration: STORY_DURATION,
        music_url: musicUrl,
        music_start_ms: musicStartMs,
        music_name: musicName,
        views_count: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      const newStory = {
        id: data.id,
        media: mediaUrl,
        type: 'image',
        createdAt: data.created_at,
        duration: STORY_DURATION,
        meta: musicUrl ? {
          music: {
            dataUrl: musicUrl,
            startMs: musicStartMs,
            name: musicName
          }
        } : {}
      };

      setStories((prev) => [newStory, ...prev]);
      setShowEditor(false);
      setEditorMedia(null);
      setEditorType(null);
      toast.success("Story saved! 🎉", 2000);

    } catch (error) {
      console.error("❌ Save failed:", error);
      toast.error(`Failed: ${error.message}`, 2000);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleCancelEditor = useCallback(() => {
    setShowEditor(false);
    setEditorMedia(null);
    setEditorType(null);
  }, []);

  const openViewerAt = useCallback((index = 0) => {
    if (!stories || stories.length === 0) {
      triggerAdd();
      return;
    }
    setViewerStartIndex(index);
    setViewerOpen(true);
  }, [stories, triggerAdd]);

  const handleDeleteStory = useCallback(async (indexToDelete) => {
    setStoryToDelete(indexToDelete);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!user || storyToDelete === null) return;

    try {
      const story = stories[storyToDelete];
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setStories((prev) => {
        const copy = [...prev];
        copy.splice(storyToDelete, 1);
        return copy;
      });

      toast.success("Story deleted! 🗑️", 2000);
      setDeleteModalOpen(false);
      setStoryToDelete(null);
    } catch (error) {
      console.error("❌ Delete failed:", error);
      toast.error("Failed to delete", 2000);
    }
  }, [stories, user, storyToDelete, toast]);

  if (loading && stories.length === 0) {
    return (
      <div className="flex w-full min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        {/* Story Header */}
        <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
          <div className="relative">
            <div
              onClick={() => openViewerAt(0)}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 cursor-pointer overflow-hidden p-1 hover:scale-105 transition-transform shadow-lg"
            >
              <div className="w-full h-full rounded-full bg-white p-1 flex items-center justify-center overflow-hidden">
                {stories.length === 0 ? (
                  profile?.profile_pic ? (
                    <img
                      src={profile.profile_pic}
                      className="w-full h-full object-cover rounded-full"
                      alt="Your profile"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">+</span>
                  )
                ) : (
                  <img
                    src={stories[0].media}
                    className="w-full h-full object-cover rounded-full"
                    alt="Your story"
                  />
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerAdd();
              }}
              className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-lg hover:bg-blue-600 transition-colors"
              title="Add story"
              disabled={loading}
            >
              +
            </button>
          </div>

          <div>
            <p className="font-bold text-lg text-gray-900">
              {profile?.username || user?.email?.split('@')[0] || 'Your Stories'}
            </p>
            <p className="text-sm text-gray-500">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </p>
          </div>
        </div>

        {/* Feed Content */}
        <section className="mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              {profile?.profile_pic ? (
                <img 
                  src={profile.profile_pic} 
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {profile?.username || user?.email?.split('@')[0] || 'user'}
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="w-full h-96 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">Feed post placeholder</p>
            </div>
          </div>
        </section>
      </main>

      <input
        ref={fileRef}
        className="hidden"
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        disabled={loading}
      />

      {showEditor && editorMedia && (
        <StoryEditor
          media={editorMedia}
          type={editorType}
          onCancel={handleCancelEditor}
          onSave={handleSaveFromEditor}
        />
      )}

      {viewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          startIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}
          onDelete={handleDeleteStory}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        message="Delete this story? This cannot be undone."
        type="post"
      />

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}