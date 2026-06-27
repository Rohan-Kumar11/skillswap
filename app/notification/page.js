"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, UserPlus, Calendar, CheckCircle, X, Repeat, AtSign, Trash2, Check, Play } from 'lucide-react';
import { getAvatarUrl } from '@/app/utils/avatarUtils';

export default function NotificationsPage() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToNotifications();
      return () => unsubscribe && unsubscribe();
    }
  }, [currentUser]);

  const loadUserAndNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      await loadNotifications(user.id);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadNotifications = async (userId) => {
    setLoading(true);
    try {
      const { data: notificationsData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (notifError) throw notifError;

      if (!notificationsData || notificationsData.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const actorIds = [...new Set(notificationsData.filter(n => n.actor_id).map(n => n.actor_id))];
      const postIds = [...new Set(notificationsData.filter(n => n.post_id).map(n => n.post_id))];

      let actorsMap = {};
      if (actorIds.length > 0) {
        const { data: actorsData } = await supabase
          .from('profile_user')
          .select('id, username, profile_pic, full_name, gender')
          .in('id', actorIds);
        
        if (actorsData) {
          actorsData.forEach(actor => {
            actorsMap[actor.id] = actor;
          });
        }
      }

      let postsMap = {};
      if (postIds.length > 0) {
        const { data: postsData } = await supabase
          .from('post')
          .select('id, image_url, media_urls, caption, media_type, video_thumbnail, user_id')
          .in('id', postIds);
        
        if (postsData) {
          postsData.forEach(post => {
            postsMap[post.id] = post;
          });
        }
      }

      const enrichedNotifications = notificationsData.map(notification => ({
        ...notification,
        actor: notification.actor_id ? actorsMap[notification.actor_id] : null,
        post: notification.post_id ? postsMap[notification.post_id] : null
      }));

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser?.id}`
        },
        async (payload) => {
          const notification = payload.new;
          
          if (notification.actor_id) {
            const { data: actor } = await supabase
              .from('profile_user')
              .select('id, username, profile_pic, full_name, gender')
              .eq('id', notification.actor_id)
              .single();
            notification.actor = actor;
          }
          
          if (notification.post_id) {
            const { data: post } = await supabase
              .from('post')
              .select('id, image_url, media_urls, caption, media_type, video_thumbnail, user_id')
              .eq('id', notification.post_id)
              .single();
            notification.post = post;
          }
          
          setNotifications((prev) => [notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e?.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelected = async () => {
    try {
      const idsToDelete = Array.from(selectedItems);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !selectedItems.has(n.id)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (isSelectionMode) {
      toggleSelection(notification.id);
      return;
    }

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigation based on notification type
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'mention' || notification.type === 'reply') {
      // Get the post owner's username from the post
      if (notification.post?.user_id) {
        const { data: postOwner } = await supabase
          .from('profile_user')
          .select('username')
          .eq('id', notification.post.user_id)
          .single();
        
        if (postOwner?.username) {
          // Navigate to profile with post ID in query param
          router.push(`/profile/${postOwner.username}?post=${notification.post_id}`);
        }
      }
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.actor?.username}`);
    } else if (notification.type === 'swap_request' || notification.type === 'swap_accepted' || notification.type === 'swap_declined' || notification.type === 'swap_completed') {
      router.push('/messages');
    } else if (notification.type === 'message_request') {
      router.push('/messages/requests');
    } else if (notification.type === 'session_scheduled' || notification.type === 'session_reminder') {
      router.push('/sessions');
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getNotificationIcon = (type) => {
    const iconClasses = "w-3.5 h-3.5 text-white";
    
    const iconMap = {
      like: { 
        Icon: Heart, 
        gradient: 'from-pink-500 via-rose-500 to-red-500',
        fill: true
      },
      comment: { 
        Icon: MessageCircle, 
        gradient: 'from-blue-500 via-cyan-500 to-teal-500'
      },
      reply: { 
        Icon: MessageCircle, 
        gradient: 'from-blue-500 via-cyan-500 to-teal-500'
      },
      follow: { 
        Icon: UserPlus, 
        gradient: 'from-purple-500 via-violet-500 to-fuchsia-500'
      },
      swap_request: { 
        Icon: Repeat, 
        gradient: 'from-emerald-500 via-green-500 to-teal-500'
      },
      swap_accepted: { 
        Icon: CheckCircle, 
        gradient: 'from-green-500 via-emerald-500 to-teal-500'
      },
      swap_declined: { 
        Icon: X, 
        gradient: 'from-red-500 via-rose-500 to-pink-500'
      },
      swap_completed: { 
        Icon: CheckCircle, 
        gradient: 'from-emerald-500 via-green-500 to-teal-500'
      },
      session_scheduled: { 
        Icon: Calendar, 
        gradient: 'from-orange-500 via-amber-500 to-yellow-500'
      },
      session_reminder: { 
        Icon: Calendar, 
        gradient: 'from-orange-500 via-amber-500 to-yellow-500'
      },
      mention: { 
        Icon: AtSign, 
        gradient: 'from-indigo-500 via-purple-500 to-pink-500'
      }
    };

    const config = iconMap[type] || { Icon: CheckCircle, gradient: 'from-gray-400 to-gray-500' };
    const { Icon, gradient, fill } = config;

    return (
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
        <Icon className={iconClasses} fill={fill ? "white" : "none"} />
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(n => new Date(n.created_at) >= today);
    } else if (filter === 'this_week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(n => new Date(n.created_at) >= weekAgo);
    }

    return filtered;
  };

  const getPostThumbnail = (post) => {
    if (!post) return null;
    
    // For video posts, use video_thumbnail
    if (post.media_type === 'video' && post.video_thumbnail) {
      return post.video_thumbnail;
    }
    
    // For other media types, use media_urls or image_url
    if (post.media_urls && post.media_urls.length > 0) {
      return post.media_urls[0];
    }
    
    return post.image_url;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = filterNotifications();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedItems(new Set());
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={deleteSelected}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-red-500/25"
                    >
                      Delete ({selectedItems.size})
                    </button>
                  )}
                </>
              ) : (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-xl transition-all flex items-center gap-2"
                    >
                      <Check size={16} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    title="Delete notifications"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'All', emoji: '📬' },
              { id: 'unread', label: 'Unread', count: unreadCount, emoji: '🔔' },
              { id: 'today', label: 'Today', emoji: '📅' },
              { id: 'this_week', label: 'This week', emoji: '📆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all transform hover:scale-105 ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="mr-1.5">{tab.emoji}</span>
                {tab.label}
                {tab.count > 0 && filter !== tab.id && (
                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Heart size={48} className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {filter === 'unread' ? 'All caught up! 🎉' : 'No notifications yet'}
            </h3>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              {filter === 'unread' 
                ? 'You\'re all up to date. Check back later for new activity.'
                : 'When people interact with your content, notifications will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const thumbnailUrl = getPostThumbnail(notification.post);
              
              return (
                <div
                  key={notification.id}
                  className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 ${
                    !notification.is_read ? 'ring-2 ring-purple-400/30 bg-gradient-to-r from-purple-50/50 to-pink-50/50' : ''
                  } ${selectedItems.has(notification.id) ? 'ring-2 ring-purple-600' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <div className="flex items-center pt-2">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedItems.has(notification.id) 
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-600' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {selectedItems.has(notification.id) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Avatar with Badge */}
                    <div className="relative flex-shrink-0">
                      {notification.actor ? (
                        <div className="relative">
                          <img
                            src={getAvatarUrl(notification.actor)}
                            alt={notification.actor.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                            onError={(e) => e.target.src = '/default-avatar.png'}
                          />
                          {/* Badge positioned to bottom right with more spacing */}
                          <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                      ) : (
                        getNotificationIcon(notification.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm leading-relaxed">
                        {notification.actor && (
                          <span className="font-bold text-gray-900 hover:text-purple-600 transition-colors">
                            {notification.actor.username}
                          </span>
                        )}{' '}
                        <span className="text-gray-600">{notification.message}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs font-medium text-gray-400">
                          {formatTimestamp(notification.created_at)}
                        </p>
                        {!notification.is_read && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-white">New</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Thumbnail or Action */}
                    {thumbnailUrl ? (
                      <div className="flex-shrink-0 relative">
                        <img
                          src={thumbnailUrl}
                          alt="Post"
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-100 shadow-md transform group-hover:scale-105 transition-transform"
                        />
                        {/* Video indicator */}
                        {notification.post?.media_type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                            <Play size={20} className="text-white" fill="white" />
                          </div>
                        )}
                      </div>
                    ) : notification.type === 'follow' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implement follow back functionality here
                          console.log('Follow back:', notification.actor?.username);
                        }}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 transform hover:scale-105"
                      >
                        Follow
                      </button>
                    ) : null}

                    {/* Delete Button */}
                    {!isSelectionMode && (
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110"
                      >
                        <X size={18} className="text-red-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {filteredNotifications.length >= 100 && (
          <div className="text-center py-8">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 transform hover:scale-105">
              Load older notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}