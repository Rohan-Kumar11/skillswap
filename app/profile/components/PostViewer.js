// app/profile/components/PostViewer.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, MoreHorizontal, Trash2, Music, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import VideoPlayer from './VideoPlayer';
import { useToast } from '@/app/components/Toast';
import { useDialog } from '@/app/components/CustomDialog';
// Add this import:
import { getAvatarUrl } from '@/app/utils/avatarUtils';

export default function PostViewer({
  viewerOpen,
  selectedPostIndex,
  posts,
  profile,
  onClose,
  prev,
  next,
  onPostDeleted,
}) {
  const [currentUser, setCurrentUser] = useState(null);
  // Add these two new states after isVideoPlaying:
  const [isSaved, setIsSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const commentsEndRef = useRef(null);
  const menuRef = useRef(null);
  const audioRef = useRef(null);
  const musicMonitorRef = useRef(null);

  // ✅ STEP 1: Add viewerOpenRef to track modal state
  const viewerOpenRef = useRef(false);

  const toast = useToast();
  const { showConfirm, DialogComponent } = useDialog();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setCurrentUser(user);
      }
    };
    loadUser();
  }, []);

  // ✅ Sync viewerOpenRef with viewerOpen state
  useEffect(() => {
    viewerOpenRef.current = viewerOpen;
  }, [viewerOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPostMenu(false);
      }
    };

    if (showPostMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPostMenu]);

  useEffect(() => {
    if (viewerOpen && selectedPostIndex !== null && posts[selectedPostIndex]) {
      loadPostData();
      setShowFullCaption(false);
      setCommentText('');
      setIsVideoPlaying(false);
    }
  }, [viewerOpen, selectedPostIndex, posts]);

  // ✅ STEP 2: Fixed music playback with proper cleanup
  useEffect(() => {
    const stopAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (musicMonitorRef.current) {
        clearInterval(musicMonitorRef.current);
        musicMonitorRef.current = null;
      }
    };

    // 🚫 If modal closed → STOP immediately
    if (!viewerOpen) {
      stopAudio();
      return;
    }

    if (selectedPostIndex === null || !posts[selectedPostIndex]) {
      stopAudio();
      return;
    }

    stopAudio(); // stop previous audio

    const post = posts[selectedPostIndex];
    if (!post.music_url || !post.music_title) return;

    const isVideo = post.media_type === 'video' ||
      (post.media_urls && post.media_urls.length > 0 &&
        (post.media_urls[0].includes('/post-videos/') ||
          post.media_urls[0].match(/\.(mp4|webm|ogg|mov)(\?|$)/i)));

    const startTime = Number(post.music_start_time) || 0;
    const endTime =
      post.music_end_time != null
        ? Number(post.music_end_time)
        : startTime + (Number(post.music_duration) || 15);

    console.log('🎵 PostViewer music setup:', {
      isVideo,
      startTime,
      endTime,
      duration: endTime - startTime,
      hasEndTime: post.music_end_time !== null
    });

    const audio = new Audio(post.music_url);
    audio.crossOrigin = 'anonymous';
    audio.loop = false;
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      // 🛑 CANCEL if modal already closed
      if (!viewerOpenRef.current) {
        stopAudio();
        return;
      }

      audio.currentTime = startTime;
      console.log('✅ Audio positioned at:', startTime);

      if (!isVideo) {
        audio.play()
          .then(() => console.log('✅ Music playing (image post)'))
          .catch(err => console.log('Music autoplay blocked:', err));
      }
    };

    if (!isVideo) {
      musicMonitorRef.current = setInterval(() => {
        if (!viewerOpenRef.current || !audio || audio.paused) return;

        const current = audio.currentTime;

        if (current >= endTime || current < startTime) {
          console.log(`🔄 Image music loop: ${current.toFixed(2)}s → ${startTime}s`);
          audio.currentTime = startTime;
          audio.play().catch(() => { });
        }
      }, 100);
    }

    return stopAudio;
  }, [viewerOpen, selectedPostIndex, posts]);

  // ✅ Handle video play/pause (for VIDEO posts only)
  useEffect(() => {
    if (!audioRef.current || selectedPostIndex === null) return;

    const post = posts[selectedPostIndex];

    const isVideo =
      post.media_type === 'video' ||
      (post.media_urls &&
        post.media_urls[0]?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i));

    if (!isVideo || !post.music_url) return;

    const audio = audioRef.current;

    const startTime = Math.floor(Number(post.music_start_time) || 0);
    const endTime =
      post.music_end_time !== null && post.music_end_time !== undefined
        ? Math.floor(Number(post.music_end_time))
        : startTime + Math.floor(Number(post.music_duration) || 15);

    audio.currentTime = startTime;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endTime) {
        audio.currentTime = startTime;
        audio.play().catch(() => { });
      }
    };

    if (isVideoPlaying) {
      audio.play().catch(() => { });
    } else {
      audio.pause();
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isVideoPlaying, selectedPostIndex, posts]);


  const loadPostData = async () => {
    const post = posts[selectedPostIndex];

    // Get fresh like count from database
    const { data: postData } = await supabase
      .from('post')
      .select('likes_count')
      .eq('id', post.id)
      .single();

    setLikeCount(postData?.likes_count || 0);

    if (!currentUser) {
      setIsLiked(false);
      setIsSaved(false);
      loadComments(post.id);
      return;
    }

    // Don't override manual like
    if (manualLikeRef.current) {
      manualLikeRef.current = false;
      loadComments(post.id);
      return;
    }

    // Check if liked
    const { data: likeData } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    setIsLiked(Boolean(likeData));

    // Check if saved
    const { data: saveData } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    setIsSaved(Boolean(saveData));

    loadComments(post.id);
  };


  const loadComments = async (postId) => {
    setIsLoadingComments(true);

    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        profile_user!inner (
          id,
          username,
          profile_pic,
          full_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    } else {
      setComments([]);
    }
    setIsLoadingComments(false);
  };
  const manualLikeRef = useRef(false);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please log in to like posts');
      return;
    }

    if (isLiking) return;

    const post = posts[selectedPostIndex];
    manualLikeRef.current = true;
    setIsLiking(true);

    // Optimistic UI update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (wasLiked) {
        // Unlike: Delete from post_likes (trigger will update count)
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;

        // Fetch actual count after unlike
        const { data: postData } = await supabase
          .from('post')
          .select('likes_count')
          .eq('id', post.id)
          .single();

        if (postData) {
          setLikeCount(postData.likes_count);
        }
      } else {
        // Like: Insert into post_likes (trigger will update count)
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });

        // Handle duplicate key error (already liked)
        if (error) {
          if (error.code === '23505') {
            // Already liked, just update UI
            setIsLiked(true);
          } else {
            throw error;
          }
        }

        // Fetch actual count after like
        const { data: postData } = await supabase
          .from('post')
          .select('likes_count')
          .eq('id', post.id)
          .single();

        if (postData) {
          setLikeCount(postData.likes_count);
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error('❌ Like error:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };
  const handleSave = async () => {
    if (!currentUser) {
      toast.error('Please log in to save posts');
      return;
    }

    const post = posts[selectedPostIndex];
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      if (wasSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        toast.success('Post removed from saved');
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });

        if (error) throw error;
        toast.success('Post saved');
      }
    } catch (error) {
      setIsSaved(wasSaved);
      console.error('❌ Save error:', error);
      toast.error('Failed to save post');
    }
  };


  const handleCommentSubmit = async () => {
    if (!currentUser || !commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const post = posts[selectedPostIndex];

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          comment_text: commentText.trim()
        })
        .select(`
          id,
          comment_text,
          created_at,
          user_id,
          profile_user!inner (
            id,
            username,
            profile_pic,
            full_name
          )
        `)
        .single();

      if (!error && data) {
        setComments(prev => [...prev, data]);
        setCommentText('');
        toast.success('Comment posted successfully');
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      console.error('❌ Comment error:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser) return;

    const post = posts[selectedPostIndex];

    if (currentUser.id !== post.user_id) {
      toast.error('You can only delete your own posts');
      return;
    }

    const confirmed = await showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      'Delete',
      'Cancel',
      Trash2
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('post')
      .delete()
      .eq('id', post.id);

    if (!error) {
      toast.success('Post deleted successfully');
      if (onPostDeleted) onPostDeleted(post.id);
      onClose();
    } else {
      toast.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    if (!currentUser) return;

    const post = posts[selectedPostIndex];
    const isPostOwner = currentUser.id === post.user_id;
    const isCommentOwner = currentUser.id === commentUserId;

    if (!isPostOwner && !isCommentOwner) return;

    const confirmed = await showConfirm(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      'Delete',
      'Cancel',
      Trash2
    );

    if (!confirmed) return;

    setDeletingCommentId(commentId);

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } else {
      toast.error('Failed to delete comment');
    }

    setDeletingCommentId(null);
  };

  useEffect(() => {
    if (!viewerOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && selectedPostIndex > 0) prev();
      else if (e.key === 'ArrowRight' && selectedPostIndex < posts.length - 1) next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, selectedPostIndex, posts.length, onClose, prev, next]);

  // ✅ STEP 3: Stop all media when modal closes (extra safety)
  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';

      // Stop audio when modal closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (musicMonitorRef.current) {
        clearInterval(musicMonitorRef.current);
        musicMonitorRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [viewerOpen]);
  // Add after other useEffects
  useEffect(() => {
    if (!viewerOpen || selectedPostIndex === null) return;

    const post = posts[selectedPostIndex];

    // Subscribe to like changes
    const likeSubscription = supabase
      .channel(`post_likes:${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${post.id}`
        },
        async (payload) => {
          // Refresh like count when anyone likes/unlikes
          const { data: postData } = await supabase
            .from('post')
            .select('likes_count')
            .eq('id', post.id)
            .single();

          if (postData) {
            setLikeCount(postData.likes_count);
          }

          // Check if current user's like status changed
          if (currentUser) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUser.id)
              .maybeSingle();

            setIsLiked(Boolean(likeData));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likeSubscription);
    };
  }, [viewerOpen, selectedPostIndex, currentUser]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!viewerOpen || selectedPostIndex === null || !posts[selectedPostIndex]) return null;

  const post = posts[selectedPostIndex];
  const isPostOwner = currentUser && currentUser.id === post.user_id;

  const isVideo = post.media_type === 'video' ||
    (post.media_urls && post.media_urls.length > 0 &&
      (post.media_urls[0].includes('/post-videos/') ||
        post.media_urls[0].match(/\.(mp4|webm|ogg|mov)(\?|$)/i)));

  const mediaUrl = post.media_urls?.[0] || post.image_url;
  const hasMusic = post.music_url && post.music_title;

  const captionText = post.caption || '';
  const contentText = post.content || '';
  const hasCaption = captionText.trim().length > 0;
  const hasContent = contentText.trim().length > 0;

  const isCaptionLong = captionText.length > 150;
  const isContentLong = contentText.length > 300;
  const displayCaption = showFullCaption ? captionText : (isCaptionLong ? captionText.substring(0, 150) + '...' : captionText);
  const displayContent = showFullCaption ? contentText : (isContentLong ? contentText.substring(0, 300) + '...' : contentText);

  return (
    <>
      <DialogComponent />

      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
        <div className="w-full h-full flex items-center justify-center relative">

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black/30 p-2 rounded-full"
          >
            <X size={28} />
          </button>

          {selectedPostIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-4 text-white z-20 bg-black/30 p-2 rounded-full"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {selectedPostIndex < posts.length - 1 && (
            <button
              onClick={next}
              className="absolute right-4 text-white z-20 bg-black/30 p-2 rounded-full"
            >
              <ChevronRight size={36} />
            </button>
          )}

          <div className="bg-black flex max-h-[90vh] max-w-[95vw] md:max-w-[1200px] w-full rounded-lg overflow-hidden shadow-2xl">

            {/* LEFT: Media Section */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
              {isVideo ? (
                <VideoPlayer
                  src={mediaUrl}
                  className="w-full h-full"
                  autoPlay={false}
                  onPlayStateChange={setIsVideoPlaying}
                  musicUrl={hasMusic ? post.music_url : null}
                  musicStartTime={hasMusic ? (post.music_start_time || 0) : 0}
                  musicEndTime={hasMusic ? (post.music_end_time || null) : null}
                  musicDuration={hasMusic ? (post.music_duration || 0) : 0}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={captionText || 'Post'}
                  className="w-full h-full object-contain max-h-[90vh]"
                />
              )}
            </div>

            {/* RIGHT: Details Section */}
            <div className="hidden md:flex flex-col w-[420px] bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(profile)}
                    alt={profile?.username || 'User'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                    onError={(e) => {
                      e.target.src = getAvatarUrl({ username: profile?.username, gender: profile?.gender });
                    }}
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{profile?.username || 'unknown'}</p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>

                {isPostOwner && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowPostMenu(!showPostMenu)}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreHorizontal size={22} />
                    </button>

                    {showPostMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border z-30">
                        <button
                          onClick={handleDeletePost}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 font-semibold"
                        >
                          <Trash2 size={18} />
                          Delete Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
                {(hasCaption || hasContent) && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex gap-3">
                      <img
                        src={getAvatarUrl(profile)}
                        className="w-9 h-9 rounded-full"
                        onError={(e) => {
                          e.target.src = getAvatarUrl({ username: profile?.username, gender: profile?.gender });
                        }}
                      />
                      <div className="flex-1">
                        {hasCaption && (
                          <p className="text-sm text-gray-900 mb-2">
                            <span className="font-bold mr-2 text-gray-900">{profile?.username}</span>
                            <span className="text-gray-700">{displayCaption}</span>
                          </p>
                        )}

                        {hasContent && (
                          <div className={hasCaption ? "mt-2 pt-2 border-t border-gray-100" : ""}>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {displayContent}
                            </p>
                          </div>
                        )}

                        {(isCaptionLong || isContentLong) && (
                          <button
                            onClick={() => setShowFullCaption(!showFullCaption)}
                            className="text-gray-500 text-sm font-semibold mt-2 hover:text-gray-700"
                          >
                            {showFullCaption ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Music Info */}
                {hasMusic && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Music size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {post.music_title}
                        </p>
                        {post.music_artist && (
                          <p className="text-xs text-gray-600 truncate">
                            {post.music_artist}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs font-semibold text-purple-600">
                          {isVideo ? 'Synced' : 'Playing'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase">
                    Comments ({comments.length})
                  </h3>

                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-3 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isCommentOwner = currentUser && currentUser.id === comment.user_id;
                        const canDeleteComment = isPostOwner || isCommentOwner;

                        return (
                          <div key={comment.id} className="bg-white rounded-xl p-3 shadow-sm group">
                            <div className="flex gap-3">
                              <img
                                src={getAvatarUrl(comment.profile_user)}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  e.target.src = getAvatarUrl({
                                    username: comment.profile_user?.username,
                                    gender: comment.profile_user?.gender
                                  });
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-sm text-gray-900">{comment.profile_user?.username}</p>
                                  <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment_text}</p>
                              </div>

                              {canDeleteComment && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 p-1.5 rounded-full hover:bg-red-50"
                                >
                                  {deletingCommentId === comment.id ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={commentsEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
                      <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">No comments yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t bg-white">
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={handleLike}
                      disabled={isLiking}
                      className="hover:scale-110 transition-transform active:scale-95"
                    >
                      <Heart
                        size={28}
                        fill={isLiked ? '#ed4956' : 'none'}
                        className={`transition-all ${isLiked ? 'text-[#ed4956] animate-pulse' : 'text-gray-700'}`}
                      />
                    </button>
                    <MessageCircle size={28} className="text-gray-700" />
                    <Send size={28} className="text-gray-700" />
                    <button
                      onClick={handleSave}
                      className="hover:scale-110 transition-transform active:scale-95"
                    >
                      <Bookmark
                        size={28}
                        fill={isSaved ? 'currentColor' : 'none'}
                        className={isSaved ? 'text-gray-900' : 'text-gray-700'}
                      />
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-3">
                  <p className="font-bold text-sm text-gray-900">{likeCount.toLocaleString()} likes</p>
                </div>
              </div>

              {/* Comment Input */}
              <div className="border-t px-5 py-4 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCommentSubmit()}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm outline-none bg-gray-50 px-4 py-2.5 rounded-full text-gray-900 placeholder-gray-500"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold ${commentText.trim() && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                    }`}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}