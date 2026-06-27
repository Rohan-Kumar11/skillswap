"use client";
// explore/page.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ExplorePostViewer from './components/ExplorePostViewer';
import { 
  Compass, Heart, MessageCircle, Play, 
  Sparkles, Loader, Target 
} from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userInterests, setUserInterests] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    fetchCurrentUser();
  }, []);

  // Load explore posts
  useEffect(() => {
    if (currentUser) {
      loadExplorePosts();
    }
  }, [currentUser]);

  const loadExplorePosts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/explore?userId=${currentUser.id}&limit=50&offset=0`
      );

      const data = await response.json();

      if (data.success) {
        setPosts(data.data);
        setUserInterests(data.userInterests || []);
        setHasMore(data.hasMore);
        setOffset(50);
      }
    } catch (error) {
      console.error('Error loading explore posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const response = await fetch(
        `/api/explore?userId=${currentUser.id}&limit=50&offset=${offset}`
      );

      const data = await response.json();

      if (data.success) {
        setPosts(prev => [...prev, ...data.data]);
        setHasMore(data.hasMore);
        setOffset(prev => prev + 50);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 500
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, hasMore, loadingMore]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const getMediaUrl = (post) => {
    if (post.media_urls && post.media_urls.length > 0) {
      return post.media_urls[0];
    }
    return post.image_url;
  };

  const isVideo = (post) => {
    return post.media_type === 'video' || 
      (post.media_urls && post.media_urls[0]?.includes('/post-videos/'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 md:ml-20 lg:ml-64 xl:ml-72 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600 text-lg font-medium">
            Discovering posts matching your interests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 md:ml-20 lg:ml-64 xl:ml-72">
      <div className="h-16 md:hidden" />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 md:top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Explore
                </h1>
                <p className="text-sm text-gray-600">
                  Discover content from the community
                </p>
              </div>
            </div>

            {userInterests.length > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl border border-purple-200">
                <Target className="w-5 h-5 text-purple-600" />
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Matching: </span>
                  <span className="text-purple-600 font-medium">
                    {userInterests.slice(0, 3).join(', ')}
                    {userInterests.length > 3 && ` +${userInterests.length - 3}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {posts.length === 0 ? (
          <div className="text-center py-32">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              {userInterests.length > 0 ? (
                <Target className="w-12 h-12 text-purple-600" />
              ) : (
                <Compass className="w-12 h-12 text-purple-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {userInterests.length > 0 
                ? 'No matching posts found'
                : 'No posts yet'
              }
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {userInterests.length > 0 
                ? `We couldn't find posts matching your interests: ${userInterests.slice(0, 3).join(', ')}${userInterests.length > 3 ? '...' : ''}. Try updating your profile or check back later!`
                : 'Set your skills_wanted in your profile to see personalized content, or create the first post!'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/profile/edit')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Update Profile
              </button>
              <button
                onClick={() => router.push('/create')}
                className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all"
              >
                Create Post
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer group relative"
                >
                  {/* Media */}
                  <div className="relative w-full h-full">
                    {isVideo(post) ? (
                      <>
                        <img
                          src={post.video_thumbnail || getMediaUrl(post)}
                          alt={post.caption || 'Post'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={getMediaUrl(post)}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2 text-white">
                        <Heart className="w-6 h-6 fill-white" />
                        <span className="font-bold text-lg">
                          {post.likes_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <MessageCircle className="w-6 h-6 fill-white" />
                        <span className="font-bold text-lg">
                          {post.comments_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Match indicator */}
                    {post.isRelevant && post.matchedSkills && post.matchedSkills.length > 0 && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {post.matchedSkills.length === 1 
                          ? post.matchedSkills[0]
                          : `${post.matchedSkills.length} matches`
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loading More */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            )}

            {/* End Message */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 font-medium">
                  You've seen all matching posts! 🎉
                </p>
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Update your interests to discover more →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <ExplorePostViewer
          viewerOpen={!!selectedPost}
          selectedPostIndex={posts.findIndex(p => p.id === selectedPost.id)}
          posts={posts}
          onClose={() => setSelectedPost(null)}
          prev={() => {
            const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
            if (currentIndex > 0) {
              setSelectedPost(posts[currentIndex - 1]);
            }
          }}
          next={() => {
            const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
            if (currentIndex < posts.length - 1) {
              setSelectedPost(posts[currentIndex + 1]);
            }
          }}
          userInterests={userInterests}
        />
      )}
    </div>
  );
}