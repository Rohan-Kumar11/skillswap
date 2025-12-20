"use client";
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, MoreHorizontal, Trash2, Music, Play, Pause, Volume2, VolumeX, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast, DeleteConfirmationModal } from '../../components/Toast';
import VideoPlayer from './VideoPlayer';

export default function PostViewer({ 
  viewerOpen, 
  selectedPostIndex, 
  posts, 
  profile,
  currentUser,
  onClose, 
  prev, 
  next,
  onPostDeleted,
  handleShare // NEW: Share function passed from parent
}) {
  const toast = useToast();

  // Like & Comment states
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  // Share states
  const [shareCount, setShareCount] = useState(0);
  
  // Menu & Delete states
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showFullCaption, setShowFullCaption] = useState(false);
  
  // Music player state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioRef = useRef(null);
  
  // Delete confirmation states
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  
  const commentsEndRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
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

  // Load post data when viewer opens or post changes
  useEffect(() => {
    if (viewerOpen && selectedPostIndex !== null && posts[selectedPostIndex]) {
      loadPostData();
      setShowFullCaption(false);
      setIsMusicPlaying(false);
    }
  }, [viewerOpen, selectedPostIndex, posts, currentUser]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const loadPostData = async () => {
    const post = posts[selectedPostIndex];
    
    // Load like count from database
    const { count: likeCountFromDB } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    setLikeCount(likeCountFromDB || 0);

    // Load share count from database
    const { count: shareCountFromDB } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    setShareCount(shareCountFromDB || 0);
    
    // Check if current user has liked this post
    if (currentUser) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
        .single();
      
      setIsLiked(!!likeData);
    } else {
      setIsLiked(false);
    }
    
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
        profile_users (
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
      console.error('Error loading comments:', error);
      setComments([]);
    }
    setIsLoadingComments(false);
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast?.error?.('Please sign in to like posts');
      return;
    }
    
    const post = posts[selectedPostIndex];
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);
        
        if (!error) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          console.error('Error unliking:', error);
          toast?.error?.('Failed to unlike post');
        }
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        if (!error) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        } else {
          console.error('Error liking:', error);
          toast?.error?.('Failed to like post');
        }
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
      toast?.error?.('Something went wrong');
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    if (!currentUser) {
      toast?.error?.('Please sign in to comment');
      return;
    }
    
    if (isSubmitting) return;
    
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
          profile_users (
            username,
            profile_pic,
            full_name
          )
        `)
        .single();
      
      if (!error && data) {
        setComments(prev => [...prev, data]);
        setCommentText('');
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        toast?.success?.('Comment posted!');
      } else {
        console.error('Error posting comment:', error);
        toast?.error?.('Failed to post comment');
      }
    } catch (error) {
      console.error('Error in handleCommentSubmit:', error);
      toast?.error?.('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareClick = async (e) => {
    if (e) e.stopPropagation();
    
    const post = posts[selectedPostIndex];
    
    if (handleShare) {
      // Use parent's share function
      await handleShare(post, e);
      // Reload share count after sharing
      const { count: newShareCount } = await supabase
        .from('post_shares')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      setShareCount(newShareCount || 0);
    } else {
      // Fallback share implementation
      try {
        const shareUrl = `${window.location.origin}/profile/${profile.username}?post=${post.id}`;
        
        if (navigator.share) {
          await navigator.share({
            title: `Check out ${profile.full_name}'s post`,
            text: post.caption || 'Check out this post!',
            url: shareUrl
          });
          
          if (currentUser) {
            await supabase.from('post_shares').insert({
              post_id: post.id,
              user_id: currentUser.id,
              shared_to: 'external'
            });
            setShareCount(prev => prev + 1);
          }
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast?.success?.('Link copied to clipboard!');
          
          if (currentUser) {
            await supabase.from('post_shares').insert({
              post_id: post.id,
              user_id: currentUser.id,
              shared_to: 'copied'
            });
            setShareCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error sharing:', error);
        toast?.error?.('Failed to share');
      }
    }
  };

  const initiateDeletePost = () => {
    if (!currentUser) return;
    
    const post = posts[selectedPostIndex];
    
    if (currentUser.id !== post.user_id) {
      toast?.error?.('You can only delete your own posts');
      return;
    }

    setShowPostMenu(false);
    setShowDeletePostModal(true);
  };

  const confirmDeletePost = async () => {
    const post = posts[selectedPostIndex];

    const { error } = await supabase
      .from('post')
      .delete()
      .eq('id', post.id);
    
    if (!error) {
      setShowDeletePostModal(false);
      toast?.success?.('Post deleted successfully! 🎉');
      if (onPostDeleted) onPostDeleted(post.id);
      onClose();
    } else {
      console.error('Error deleting post:', error);
      toast?.error?.('Failed to delete post. Please try again.');
    }
  };

  const initiateDeleteComment = (commentId, commentUserId) => {
    if (!currentUser) {
      toast?.error?.('Please sign in to delete comments');
      return;
    }

    const post = posts[selectedPostIndex];
    const isPostOwner = currentUser.id === post.user_id;
    const isCommentOwner = currentUser.id === commentUserId;

    if (!isPostOwner && !isCommentOwner) {
      toast?.error?.('You can only delete your own comments');
      return;
    }

    setCommentToDelete({ id: commentId, userId: commentUserId });
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setDeletingCommentId(commentToDelete.id);

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentToDelete.id);
    
    if (!error) {
      toast?.success?.('Comment deleted successfully! ✨');
      setComments(prev => prev.filter(c => c.id !== commentToDelete.id));
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    } else {
      console.error('Error deleting comment:', error);
      toast?.error?.('Failed to delete comment. Please try again.');
    }

    setDeletingCommentId(null);
  };
  // CONTINUATION FROM PART 1...

  // Music controls
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const toggleMusicMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMusicMuted;
      setIsMusicMuted(!isMusicMuted);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!viewerOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && selectedPostIndex > 0) {
        prev();
      } else if (e.key === 'ArrowRight' && selectedPostIndex < posts.length - 1) {
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, selectedPostIndex, posts.length, onClose, prev, next]);

  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
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
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);
      
      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin}min ago`;
      if (diffHour < 24) return `${diffHour}hrs ago`;
      if (diffDays === 1) return '1d ago';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  if (!viewerOpen || selectedPostIndex === null || !posts[selectedPostIndex]) return null;

  const post = posts[selectedPostIndex];
  const isPostOwner = currentUser && currentUser.id === post.user_id;
  const isVideo = post.media_type === 'video' || post.post_type === 'video';
  const hasMusic = post.music_url && post.music_title;

  const captionText = post.caption || '';
  const descriptionText = post.description || '';
  const isCaptionLong = captionText.length > 150;
  const displayCaption = showFullCaption ? captionText : (isCaptionLong ? captionText.substring(0, 150) + '...' : captionText);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="w-full h-full flex items-center justify-center relative">

          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all hover:scale-110 z-20 bg-black/30 p-2 rounded-full"
          >
            <X size={28} strokeWidth={2} />
          </button>

          {selectedPostIndex > 0 && (
            <button 
              onClick={prev} 
              className="absolute left-4 text-white hover:scale-110 transition-all z-20 bg-black/30 p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft size={36} strokeWidth={2.5} />
            </button>
          )}

          {selectedPostIndex < posts.length - 1 && (
            <button 
              onClick={next} 
              className="absolute right-4 text-white hover:scale-110 transition-all z-20 bg-black/30 p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronRight size={36} strokeWidth={2.5} />
            </button>
          )}

          <div className="bg-black flex max-h-[90vh] max-w-[95vw] md:max-w-[1200px] w-full rounded-lg overflow-hidden shadow-2xl">
            
            {/* LEFT: Media Section */}
            <div className="flex-1 flex items-center justify-center bg-black min-w-0 relative">
              {/* Media Type Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className={`px-4 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-md shadow-lg flex items-center gap-2 ${
                  isVideo ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                }`}>
                  {isVideo ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      VIDEO
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      IMAGE
                    </>
                  )}
                </div>
              </div>

              {isVideo ? (
                <VideoPlayer 
                  src={post.video_url || post.image_url} 
                  className="w-full h-full"
                  autoPlay={false}
                />
              ) : (
                <img 
                  src={post.image_url} 
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-contain max-h-[90vh]"
                />
              )}

              {/* Compact Music Player Overlay */}
              {hasMusic && (
                <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-xl rounded-2xl p-3 flex items-center gap-3 border border-white/20 shadow-2xl">
                  <button
                    onClick={toggleMusic}
                    className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0 shadow-lg"
                  >
                    {isMusicPlaying ? (
                      <Pause size={20} className="text-purple-600" fill="currentColor" />
                    ) : (
                      <Play size={20} className="text-purple-600 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Music size={14} className="text-pink-300 flex-shrink-0" />
                      <p className="text-white font-bold text-sm truncate">{post.music_title}</p>
                    </div>
                    <p className="text-pink-200 text-xs truncate">{post.music_artist || 'Unknown Artist'}</p>
                  </div>
                  <button
                    onClick={toggleMusicMute}
                    className="text-white hover:scale-110 transition-transform p-2 hover:bg-white/10 rounded-full"
                  >
                    {isMusicMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <audio
                    ref={audioRef}
                    src={post.music_url}
                    loop
                    preload="auto"
                    crossOrigin="anonymous"
                    onEnded={() => setIsMusicPlaying(false)}
                    onError={(e) => {
                      console.error('Audio playback error:', e);
                      toast?.error?.('Unable to play music.');
                      setIsMusicPlaying(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* RIGHT: Details Section */}
            <div className="hidden md:flex flex-col w-[420px] bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={profile?.profile_pic || '/default-avatar.png'}
                      alt={profile?.full_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                      onError={(e) => e.target.src = '/default-avatar.png'}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{profile?.username || 'unknown'}</p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                
                {isPostOwner && (
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setShowPostMenu(!showPostMenu)}
                      className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                      <MoreHorizontal size={22} />
                    </button>

                    {showPostMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-30 overflow-hidden">
                        <button
                          onClick={initiateDeletePost}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-semibold"
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
                {/* Caption & Description Card */}
                {(captionText || descriptionText) && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex gap-3">
                      <img
                        src={profile?.profile_pic || '/default-avatar.png'}
                        alt={profile?.full_name || 'User'}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        onError={(e) => e.target.src = '/default-avatar.png'}
                      />
                      <div className="flex-1 min-w-0">
                        {captionText && (
                          <div className="mb-2">
                            <p className="text-sm leading-relaxed">
                              <span className="font-bold text-gray-900 mr-2">{profile?.username || 'unknown'}</span>
                              <span className="text-gray-800">{displayCaption}</span>
                            </p>
                            {isCaptionLong && (
                              <button
                                onClick={() => setShowFullCaption(!showFullCaption)}
                                className="text-gray-500 text-sm font-semibold hover:text-gray-700 mt-1"
                              >
                                {showFullCaption ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        )}
                        {descriptionText && (
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 mt-2">
                            {descriptionText}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
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
                          <div key={comment.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                            <div className="flex gap-3 relative">
                              <img
                                src={comment.profile_users?.profile_pic || '/default-avatar.png'}
                                alt={comment.profile_users?.username || 'User'}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => e.target.src = '/default-avatar.png'}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-sm text-gray-900">{comment.profile_users?.username || 'unknown'}</p>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{comment.comment_text}</p>
                              </div>

                              {canDeleteComment && (
                                <button
                                  onClick={() => initiateDeleteComment(comment.id, comment.user_id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full flex-shrink-0"
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
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                      <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">No comments yet</p>
                      <p className="text-gray-400 text-xs mt-1">Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={handleLike}
                      className="hover:scale-110 transition-all active:scale-95"
                      title={currentUser ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
                    >
                      <Heart 
                        size={28} 
                        strokeWidth={1.8}
                        fill={isLiked ? '#ed4956' : 'none'}
                        className={isLiked ? 'text-[#ed4956]' : 'text-gray-700'}
                      />
                    </button>

                    <button 
                      className="hover:scale-110 transition-all active:scale-95"
                      title="Comment"
                    >
                      <MessageCircle size={28} strokeWidth={1.8} className="text-gray-700" />
                    </button>

                    <button 
                      onClick={handleShareClick}
                      className="hover:scale-110 transition-all active:scale-95"
                      title="Share"
                    >
                      <Share2 size={28} strokeWidth={1.8} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-3 space-y-1">
                  <p className="font-bold text-sm text-gray-900">
                    {likeCount === 0 ? 'Be the first to like this' : `${likeCount.toLocaleString()} ${likeCount === 1 ? 'like' : 'likes'}`}
                  </p>
                  {shareCount > 0 && (
                    <p className="text-xs text-gray-600">
                      {shareCount} {shareCount === 1 ? 'share' : 'shares'}
                    </p>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="border-t border-gray-200 px-5 py-4 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={handleCommentKeyPress}
                  placeholder={currentUser ? "Add a comment..." : "Sign in to comment"}
                  className="flex-1 text-sm outline-none bg-gray-50 px-4 py-2.5 rounded-full text-gray-900 placeholder-gray-400 focus:bg-gray-100 transition-colors"
                  disabled={isSubmitting || !currentUser}
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmitting || !currentUser}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    commentText.trim() && !isSubmitting && currentUser
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={confirmDeletePost}
        message="Are you sure you want to delete this post?"
        type="post"
      />

      <DeleteConfirmationModal
        isOpen={showDeleteCommentModal}
        onClose={() => {
          setShowDeleteCommentModal(false);
          setCommentToDelete(null);
        }}
        onConfirm={confirmDeleteComment}
        message="Are you sure you want to delete this comment?"
        type="comment"
      />
    </>
  );
}