"use client";
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Music, Sparkles, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/app/utils/avatarUtils';
import { useToast } from '@/app/components/Toast';

export default function ExplorePostViewer({
  viewerOpen,
  selectedPostIndex,
  posts,
  onClose,
  prev,
  next,
  userInterests = []
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const commentsEndRef = useRef(null);
  const audioRef = useRef(null);
  const musicMonitorRef = useRef(null);
  const videoRef = useRef(null);
  const viewerOpenRef = useRef(false);

  const toast = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setCurrentUser(user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    viewerOpenRef.current = viewerOpen;
  }, [viewerOpen]);

  useEffect(() => {
    if (viewerOpen && selectedPostIndex !== null && posts[selectedPostIndex]) {
      loadPostData();
      setShowFullCaption(false);
      setCommentText('');
      setIsVideoPlaying(false);
    }
  }, [viewerOpen, selectedPostIndex, posts]);

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

    if (!viewerOpen) {
      stopAudio();
      return;
    }

    if (selectedPostIndex === null || !posts[selectedPostIndex]) {
      stopAudio();
      return;
    }

    stopAudio();

    const post = posts[selectedPostIndex];
    if (!post.music_url || !post.music_title) return;

    const isVideo =
      post.media_type === 'video' ||
      (post.media_urls && post.media_urls.length > 0 &&
        (post.media_urls[0].includes('/post-videos/') ||
          post.media_urls[0].match(/\.(mp4|webm|ogg|mov)(\?|$)/i)));

    const startTime = Number(post.music_start_time) || 0;
    const endTime =
      post.music_end_time != null
        ? Number(post.music_end_time)
        : startTime + (Number(post.music_duration) || 15);

    const audio = new Audio(post.music_url);
    audio.crossOrigin = 'anonymous';
    audio.loop = false;
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (!viewerOpenRef.current) {
        stopAudio();
        return;
      }

      audio.currentTime = startTime;

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
          audio.currentTime = startTime;
          audio.play().catch(() => {});
        }
      }, 100);
    }

    return stopAudio;
  }, [viewerOpen, selectedPostIndex, posts]);

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
    setLikeCount(post.likes_count || 0);

    if (currentUser) {
      const { data: likeData, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error) {
        setIsLiked(!!likeData);
      } else {
        setIsLiked(false);
      }
    } else {
      setIsLiked(false);
    }

    loadComments(post.id);
  };

  const loadComments = async (postId) => {
    setIsLoadingComments(true);

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, comment_text, created_at, user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('❌ Error loading comments:', commentsError);
        setComments([]);
        setIsLoadingComments(false);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoadingComments(false);
        return;
      }

      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      const { data: usersData, error: usersError } = await supabase
        .from('profile_user')
        .select('id, username, profile_pic, full_name, gender')
        .in('id', userIds);

      if (usersError) {
        console.error('❌ Error loading users:', usersError);
        setComments([]);
        setIsLoadingComments(false);
        return;
      }

      const usersMap = {};
      usersData.forEach(user => {
        usersMap[user.id] = user;
      });

      const enrichedComments = commentsData.map(comment => ({
        ...comment,
        profile_user: usersMap[comment.user_id] || null
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error('❌ Error in loadComments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please log in to like posts');
      return;
    }

    const post = posts[selectedPostIndex];

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (!error) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });

        if (error && error.code === '23505') {
          setIsLiked(true);
          return;
        }

        if (!error) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('❌ Like error:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const post = posts[selectedPostIndex];

    try {
      // Insert comment with only the required fields
      const { data: commentData, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          comment_text: commentText.trim()
        })
        .select('id, comment_text, created_at, user_id')
        .single();

      if (insertError) {
        console.error('❌ Comment insert error:', insertError);
        toast.error('Failed to post comment');
        setIsSubmitting(false);
        return;
      }

      if (!commentData) {
        console.error('❌ No comment data returned');
        toast.error('Failed to post comment');
        setIsSubmitting(false);
        return;
      }

      // Fetch user data separately
      const { data: userData, error: userError } = await supabase
        .from('profile_user')
        .select('id, username, profile_pic, full_name, gender')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('❌ Error loading user data:', userError);
        // Still add comment but with minimal user data
        setComments(prev => [...prev, {
          ...commentData,
          profile_user: {
            id: currentUser.id,
            username: 'User',
            profile_pic: null,
            full_name: null,
            gender: null
          }
        }]);
      } else {
        // Add comment with full user data
        setComments(prev => [...prev, {
          ...commentData,
          profile_user: userData
        }]);
      }

      setCommentText('');
      toast.success('Comment posted successfully');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('❌ Comment error:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
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

  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      
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
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewerOpen]);

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

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoEnded = () => {
      videoElement.currentTime = 0;
      videoElement.play();
    };

    videoElement.addEventListener('ended', handleVideoEnded);

    return () => {
      videoElement.removeEventListener('ended', handleVideoEnded);
    };
  }, [selectedPostIndex]);

  if (!viewerOpen || selectedPostIndex === null || !posts[selectedPostIndex]) return null;

  const post = posts[selectedPostIndex];

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
            className="absolute left-4 text-white z-20 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {selectedPostIndex < posts.length - 1 && (
          <button
            onClick={next}
            className="absolute right-4 text-white z-20 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={36} />
          </button>
        )}

        <div className="bg-black flex max-h-[90vh] max-w-[95vw] md:max-w-[1200px] w-full rounded-lg overflow-hidden shadow-2xl">

          {/* LEFT: Media Section */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="w-full h-full object-contain max-h-[90vh]"
                  onClick={handleVideoPlayPause}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
                
                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={handleVideoPlayPause}
                  >
                    <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}
              </div>
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
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/profile/${post.user.username}`)}
              >
                <img
                  src={getAvatarUrl(post.user)}
                  alt={post.user.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                  onError={(e) => e.target.src = '/default-avatar.png'}
                />
                <div>
                  <p className="font-bold text-sm text-gray-900">{post.user.username || 'unknown'}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Match indicator */}
            {post.matchedSkills && post.matchedSkills.length > 0 && (
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Matches your interests: </span>
                    <span className="text-purple-600 font-medium">
                      {post.matchedSkills.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
              {(hasCaption || hasContent) && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-3">
                    <img
                      src={getAvatarUrl(post.user)}
                      className="w-9 h-9 rounded-full"
                      onError={(e) => e.target.src = '/default-avatar.png'}
                    />
                    <div className="flex-1">
                      {hasCaption && (
                        <p className="text-sm text-gray-900 mb-2">
                          <span className="font-bold mr-2 text-gray-900">{post.user.username}</span>
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
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex gap-3">
                          <img
                            src={getAvatarUrl(comment.profile_user)}
                            className="w-8 h-8 rounded-full cursor-pointer"
                            onClick={() => router.push(`/profile/${comment.profile_user?.username || ''}`)}
                            onError={(e) => e.target.src = '/default-avatar.png'}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p 
                                className="font-bold text-sm text-gray-900 cursor-pointer hover:text-purple-600"
                                onClick={() => router.push(`/profile/${comment.profile_user?.username || ''}`)}
                              >
                                {comment.profile_user?.username || 'User'}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
                    <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No comments yet</p>
                    <p className="text-gray-400 text-xs mt-1">Be the first to comment</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t bg-white">
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-5">
                  <button onClick={handleLike} className="hover:scale-110 transition-transform">
                    <Heart
                      size={28}
                      fill={isLiked ? '#ed4956' : 'none'}
                      className={isLiked ? 'text-[#ed4956]' : 'text-gray-700'}
                    />
                  </button>
                  <MessageCircle size={28} className="text-gray-700" />
                  <Send size={28} className="text-gray-700" />
                </div>
              </div>
              <div className="px-5 pb-3">
                <p className="font-bold text-sm text-gray-900">{likeCount} likes</p>
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
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${commentText.trim() && !isSubmitting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
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
  );
}