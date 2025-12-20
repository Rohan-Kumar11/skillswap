"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/app/components/Sidebar';
import MessageRequestModal from '@/app/components/MessageRequestModal';
import PostViewer from '@/app/profile/components/PostViewer';
import {
  MapPin, Star, MessageSquare, UserPlus, Loader, Users,
  Code, Palette, Brush, Camera, Film, Pen, Megaphone,
  Binary, Terminal, Coffee, Wrench, Cpu, Mic, Share2
} from 'lucide-react';

export default function OtherUserProfile() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [existingConversation, setExistingConversation] = useState(null);
  const [messageRequest, setMessageRequest] = useState(null);

  // Post viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);

  // Post interaction states
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [postCommentCounts, setPostCommentCounts] = useState({});
  const [isLiking, setIsLiking] = useState(false);

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

  // Load post interactions when posts and user are ready
  useEffect(() => {
    if (posts.length > 0 && currentUser) {
      loadPostInteractions();
    }
  }, [posts, currentUser]);

  const loadPostInteractions = async () => {
    try {
      if (!currentUser) return;

      // Load user's likes
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', posts.map(p => p.id));

      if (likesData) {
        setLikedPosts(new Set(likesData.map(like => like.post_id)));
      }

      // Load counts for all posts
      const likeCounts = {};
      const commentCounts = {};

      for (const post of posts) {
        const { count: likeCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        likeCounts[post.id] = likeCount || 0;
        commentCounts[post.id] = commentCount || 0;
      }

      setPostLikeCounts(likeCounts);
      setPostCommentCounts(commentCounts);

    } catch (error) {
      console.error('Error loading post interactions:', error);
    }
  };

  const handleShare = async (post, e) => {
    if (e) e.stopPropagation();
    
    try {
      const shareUrl = `${window.location.origin}/profile/${profile.username}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${profile.full_name}'s post`,
          text: post.caption || 'Check out this post!',
          url: shareUrl
        });
        
        // Record the share
        if (currentUser) {
          await supabase
            .from('post_shares')
            .insert({
              post_id: post.id,
              user_id: currentUser.id,
              shared_to: 'external'
            });
        }
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        
        // Record the share
        if (currentUser) {
          await supabase
            .from('post_shares')
            .insert({
              post_id: post.id,
              user_id: currentUser.id,
              shared_to: 'copied'
            });
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);

        // Check if viewing own profile
        if (profile && profile.id === user.id) {
          router.push('/profile');
        }
      } else {
        router.push('/');
      }
    };

    fetchCurrentUser();
  }, [profile, router]);

  // Load profile data
  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  // Check for existing conversation or request
  useEffect(() => {
    if (currentUser && profile) {
      checkExistingConversation();
      checkMessageRequest();
    }
  }, [currentUser, profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profile_user')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (error) {
      console.error('Error loading profile:', error);
      alert('User not found');
      router.push('/search');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingConversation = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, type')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUser.id})`)
        .single();

      if (data) {
        setExistingConversation(data);
      }
    } catch (error) {
      setExistingConversation(null);
    }
  };

  const checkMessageRequest = async () => {
    try {
      const { data } = await supabase
        .from('message_requests')
        .select('*')
        .eq('sender_id', currentUser.id)
        .eq('receiver_id', profile.id)
        .single();

      if (data) {
        setMessageRequest(data);
      }
    } catch (error) {
      setMessageRequest(null);
    }
  };

  const handleMessageClick = () => {
    if (existingConversation) {
      router.push('/messages');
    } else {
      setMessageModalOpen(true);
    }
  };

  const openViewer = (index) => {
    setSelectedPostIndex(index);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e9eaec]">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600 text-lg">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-[#e9eaec]">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 mb-4">User not found</p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#e9eaec]">
      <Sidebar />

      <div className="ml-64 flex-1 p-8 pb-20">
        {/* COVER IMAGE */}
        <div className="w-full h-40 bg-gray-400 rounded-2xl mb-6 relative overflow-hidden">
          {profile.cover_pic && (
            <img
              src={profile.cover_pic}
              className="absolute inset-0 w-full h-full object-cover"
              alt="cover"
            />
          )}
          {!profile.cover_pic && (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
          )}
        </div>

        {/* PROFILE HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gray-300 overflow-hidden border-4 border-white">
                <img
                  src={profile.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </div>
              {profile.rating >= 4.5 && (
                <div className="absolute bottom-1 right-1 bg-yellow-400 rounded-full p-1.5">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl text-black font-semibold">{profile.full_name}</h1>
              <p className="text-gray-700">@{profile.username}</p>

              {(profile.city || profile.state || profile.country) && (
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  <MapPin size={16} />
                  <span className="text-sm">
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {profile.skills?.length > 0 && (
                <div className="mt-3">
                  <h2 className="font-semibold text-lg text-black mb-1">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => {
                      const Icon = SKILL_ICONS[skill] || Users;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-[#263247] text-white rounded-full text-sm shadow"
                        >
                          <Icon size={16} />
                          {skill}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.bio && (
                <p className="text-gray-800 mt-4 max-w-2xl">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleMessageClick}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              {existingConversation ? (
                <>
                  <MessageSquare size={20} />
                  Message
                </>
              ) : messageRequest?.status === 'pending' ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Request Sent
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Connect
                </>
              )}
            </button>

            <button 
              onClick={(e) => handleShare({ caption: profile.bio }, e)}
              className="p-3 bg-white hover:bg-gray-100 rounded-xl transition-all shadow"
            >
              <Share2 size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="flex gap-12 mt-6 text-center text-black mb-8">
          <div>
            <p className="text-xl font-semibold">{posts.length}</p>
            <p>posts</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{profile.points || 0}</p>
            <p>points</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{profile.rating?.toFixed(1) || '0.0'}</p>
            <p>rating</p>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-10 w-[98%]">
          <div className="bg-white rounded-xl shadow-md flex">
            {["posts", "achievements", "reviews", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium capitalize ${
                  activeTab === tab
                    ? "bg-[#263247] text-white rounded-xl m-1"
                    : "text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {activeTab === 'posts' ? (
          <div className="mt-6">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-600 text-lg">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {posts.map((post, index) => {
                  const isLiked = likedPosts.has(post.id);
                  const likeCount = postLikeCounts[post.id] || 0;
                  const commentCount = postCommentCounts[post.id] || 0;

                  return (
                    <div
                      key={post.id}
                      className="aspect-square bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group relative"
                      onClick={() => openViewer(index)}
                    >
                      <div className="w-full h-full">
                        <img
                          src={post.image_url}
                          alt={post.caption || 'Post'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Simple overlay showing stats - NO BUTTONS */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold">❤️ {likeCount}</span>
                            <span className="text-sm font-bold">💬 {commentCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Video badge */}
                      {post.media_type === 'video' && (
                        <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                          VIDEO
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-2xl p-8 shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-6">About</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                <p className="text-gray-900 text-lg">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Username</p>
                <p className="text-gray-900 text-lg">@{profile.username}</p>
              </div>
              {profile.bio && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Bio</p>
                  <p className="text-gray-900">{profile.bio}</p>
                </div>
              )}
              {(profile.city || profile.state || profile.country) && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900">
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Member Since</p>
                <p className="text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message Request Modal */}
        {messageModalOpen && (
          <MessageRequestModal
            isOpen={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            targetUser={profile}
            currentUserId={currentUser?.id}
          />
        )}

        {/* Post Viewer */}
        {viewerOpen && (
          <PostViewer
            viewerOpen={viewerOpen}
            selectedPostIndex={selectedPostIndex}
            posts={posts}
            profile={profile}
            currentUser={currentUser}
            onClose={() => setViewerOpen(false)}
            prev={() => setSelectedPostIndex(Math.max(0, selectedPostIndex - 1))}
            next={() => setSelectedPostIndex(Math.min(posts.length - 1, selectedPostIndex + 1))}
            onPostDeleted={() => loadProfile()}
          />
        )}
      </div>
    </div>
  );
}