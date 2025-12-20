"use client";
// app/components/StoryViewer.js - UPDATED FOR SUPABASE AUTH
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Story Viewer - Full screen story viewer with gestures
 */
export default function StoryViewer({
  stories: initialStories = [],
  startIndex = 0,
  onClose,
  onDelete,
}) {
  const [stories, setStories] = useState(initialStories);
  const [index, setIndex] = useState(startIndex || 0);
  const [paused, setPaused] = useState(false);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  
  const progressRef = useRef(null);
  const audioRef = useRef(null);
  const longPressRef = useRef(null);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  // ✅ LOAD USER AND PROFILE FROM SUPABASE AUTH
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.error("❌ Not authenticated:", authError);
          return;
        }

        setUser(authUser);

        // Fetch profile from profile_user table
        const { data: profileData, error: profileError } = await supabase
          .from('profile_user')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error("❌ Profile fetch error:", profileError);
          return;
        }

        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("❌ Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Sync stories from parent
  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);

  // Handle audio playback
  useEffect(() => {
    const story = stories[index];
    if (!story || !audioRef.current) return;

    if (story.meta && story.meta.music && story.meta.music.dataUrl) {
      audioRef.current.src = story.meta.music.dataUrl;
      audioRef.current.currentTime = (story.meta.music.startMs || 0) / 1000;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [index, stories]);

  // Pause/resume audio
  useEffect(() => {
    if (!audioRef.current) return;

    if (paused) {
      audioRef.current.pause();
    } else if (audioRef.current.src) {
      audioRef.current.play().catch(() => {});
    }
  }, [paused]);

  // Progress bar animation + auto-advance
  useEffect(() => {
    if (!progressRef.current || !stories[index]) return;

    const el = progressRef.current;
    const duration = stories[index].duration || 4500;

    if (paused) {
      el.style.animationPlayState = "paused";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = `progressAnimation ${duration}ms linear forwards`;
    el.style.animationPlayState = "running";

    timerRef.current = setTimeout(() => {
      goNext();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [index, paused, stories]);

  const goNext = () => {
    if (index + 1 >= stories.length) {
      onClose?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    longPressRef.current = setTimeout(() => {
      setPaused(true);
    }, 200);
  };

  const onTouchEnd = (e) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }

    if (paused) {
      setPaused(false);
      touchStartX.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - (touchStartX.current || 0);

    if (Math.abs(dx) > 50) {
      if (dx > 0) {
        goPrev();
      } else {
        goNext();
      }
    }

    touchStartX.current = null;
  };

  const onMouseDown = () => {
    longPressRef.current = setTimeout(() => {
      setPaused(true);
    }, 200);
  };

  const onMouseUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (paused) {
      setPaused(false);
    }
  };

  const handleDelete = () => {
    onDelete?.(index);

    const copy = [...stories];
    copy.splice(index, 1);
    setStories(copy);

    if (copy.length === 0) {
      onClose?.();
    } else if (index >= copy.length) {
      setIndex(copy.length - 1);
    }
  };

  if (!stories || stories.length === 0) return null;

  const currentStory = stories[index];

  return (
    <>
      <style>{`
        @keyframes progressAnimation {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-30 max-w-md mx-auto">
            {stories.map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-white/30 rounded-full h-0.5 overflow-hidden"
              >
                <div
                  className="h-full bg-white"
                  style={{
                    width: i < index ? "100%" : "0%",
                  }}
                  ref={i === index ? progressRef : null}
                />
              </div>
            ))}
          </div>

          {/* Story content */}
          <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center bg-black">
            {currentStory.type === "video" ? (
              <video
                key={currentStory.id}
                src={currentStory.media}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
                loop
              />
            ) : (
              <img
                src={currentStory.media}
                alt="story"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Top controls */}
          <div className="absolute top-16 right-4 flex gap-2 z-30">
            <button
              onClick={handleDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
            >
              Delete
            </button>
            <button
              onClick={() => onClose?.()}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
            >
              ✕
            </button>
          </div>

          {/* Story info with actual user data */}
          <div className="absolute top-16 left-4 z-30 flex items-center gap-3 max-w-md">
            {profile?.profile_pic ? (
              <img 
                src={profile.profile_pic} 
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white flex-shrink-0" />
            )}
            <div>
              <p className="text-white font-semibold text-sm drop-shadow-lg">
                {profile?.username || user?.email?.split('@')[0] || 'Your Story'}
              </p>
              {currentStory && currentStory.createdAt && (
                <p className="text-white/80 text-xs drop-shadow-lg">
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Navigation zones */}
          <div
            onClick={goPrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
            aria-label="Previous story"
          />
          <div
            onClick={goNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
            aria-label="Next story"
          />

          {/* Pause indicator */}
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-8 bg-white rounded-full" />
                  <div className="w-2 h-8 bg-white rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Hidden audio element */}
          <audio ref={audioRef} />
        </div>
      </div>
    </>
  );
}