// app/messages/components/OnlineStatusHelpers.js
// ✅ Centralized online status management with heartbeat

import { supabase } from '@/lib/supabaseClient';

const OnlineStatusHelpers = {
    /**
     * Check if a user is currently online
     * A user is considered online if their last_seen_at is within the last 5 minutes
     */
    isUserOnline(lastSeenAt) {
        if (!lastSeenAt) return false;
        
        const lastSeen = new Date(lastSeenAt);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        const isOnline = lastSeen > fiveMinutesAgo;
        
        console.log('🟢 Status check:', {
            lastSeenAt,
            lastSeen: lastSeen.toISOString(),
            fiveMinutesAgo: fiveMinutesAgo.toISOString(),
            isOnline
        });
        
        return isOnline;
    },

    /**
     * Update current user's last_seen_at timestamp
     */
    async updateUserPresence(userId) {
        if (!userId) return;
        
        try {
            const now = new Date().toISOString();
            
            const { error } = await supabase
                .from('profile_user')
                .update({ last_seen_at: now })
                .eq('id', userId);

            if (error) {
                console.error('❌ Error updating presence:', error);
            } else {
                console.log('✅ Presence updated:', now);
            }
        } catch (err) {
            console.error('❌ Exception updating presence:', err);
        }
    },

    /**
     * Start heartbeat to keep user online
     * Updates last_seen_at every 2 minutes
     */
    startHeartbeat(userId) {
        if (!userId) {
            console.warn('⚠️ No userId provided for heartbeat');
            return null;
        }

        console.log('💓 Starting heartbeat for user:', userId);

        // Update immediately
        this.updateUserPresence(userId);

        // Update every 2 minutes
        const intervalId = setInterval(() => {
            console.log('💓 Heartbeat tick');
            this.updateUserPresence(userId);
        }, 2 * 60 * 1000); // 2 minutes

        return intervalId;
    },

    /**
     * Stop heartbeat
     */
    stopHeartbeat(intervalId) {
        if (intervalId) {
            console.log('🛑 Stopping heartbeat');
            clearInterval(intervalId);
        }
    },

    /**
     * Subscribe to user's online status changes
     */
    subscribeToUserStatus(userId, onStatusChange) {
        if (!userId) {
            console.warn('⚠️ No userId provided for status subscription');
            return null;
        }

        console.log('📡 Subscribing to status for user:', userId);

        const channel = supabase
            .channel(`user_status:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profile_user',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    console.log('📡 User status updated:', payload.new.last_seen_at);
                    const isOnline = this.isUserOnline(payload.new.last_seen_at);
                    onStatusChange(isOnline);
                }
            )
            .subscribe();

        return channel;
    },

    /**
     * Get formatted status text
     */
    getStatusText(lastSeenAt) {
        if (!lastSeenAt) return 'Offline';
        
        const isOnline = this.isUserOnline(lastSeenAt);
        
        if (isOnline) {
            return '🟢 Online';
        }

        // Calculate time ago
        const lastSeen = new Date(lastSeenAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSeen) / (60 * 1000));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return `Active ${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `Active ${diffHours}h ago`;
        } else if (diffDays === 1) {
            return 'Active yesterday';
        } else if (diffDays < 7) {
            return `Active ${diffDays}d ago`;
        } else {
            return 'Offline';
        }
    },

    /**
     * Format last seen time
     */
    formatLastSeen(lastSeenAt) {
        if (!lastSeenAt) return 'Never';
        
        const date = new Date(lastSeenAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (60 * 1000));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
};

export default OnlineStatusHelpers;