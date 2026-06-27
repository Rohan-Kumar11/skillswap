// app/messages/components/TypingHelpers.js
// ✅ FIXED - Real-time typing indicators like WhatsApp/Instagram

import { supabase } from '@/lib/supabaseClient';

const TypingHelpers = {
    /**
     * Subscribe to typing indicators for a conversation
     * @param {string} conversationId - The conversation ID
     * @param {string} currentUserId - Current user's ID
     * @param {function} onTypingChange - Callback with typing users array
     * @returns {object} Subscription object
     */
    subscribeToTyping(conversationId, currentUserId, onTypingChange) {
        console.log('🔔 Subscribing to typing indicators:', conversationId);

        const channel = supabase.channel(`typing:${conversationId}`, {
            config: {
                presence: {
                    key: currentUserId
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const typingUsers = [];

                // Get all users currently typing (except current user)
                Object.keys(state).forEach(userId => {
                    if (userId !== currentUserId) {
                        const presences = state[userId];
                        if (presences && presences.length > 0) {
                            const latest = presences[0];
                            
                            // Only show if actively typing AND timestamp is recent (< 5 seconds)
                            if (latest.typing) {
                                const typingTime = new Date(latest.timestamp).getTime();
                                const now = Date.now();
                                const elapsed = now - typingTime;
                                
                                if (elapsed < 5000) { // Only show if within 5 seconds
                                    typingUsers.push({
                                        userId,
                                        username: latest.username
                                    });
                                }
                            }
                        }
                    }
                });

                console.log('👤 Typing users:', typingUsers);
                onTypingChange(typingUsers);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('✅ User joined presence:', key);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('❌ User left presence:', key);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to typing indicators');
                }
            });

        return channel;
    },

    /**
     * Broadcast typing status
     * @param {object} channel - Supabase channel
     * @param {boolean} isTyping - Whether user is typing
     * @param {string} username - User's username
     */
    async broadcastTyping(channel, isTyping, username) {
        if (!channel) {
            console.warn('⚠️ No channel available for typing broadcast');
            return;
        }

        try {
            await channel.track({
                typing: isTyping,
                username: username,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📡 Broadcast typing=${isTyping} for ${username}`);
        } catch (error) {
            console.error('❌ Error broadcasting typing:', error);
        }
    },

    /**
     * Create a debounced typing handler (like WhatsApp/Instagram)
     * - Shows "typing..." immediately when user starts typing
     * - Stops showing after 3 seconds of inactivity
     * - Stops immediately when message is sent
     * 
     * @param {object} channel - Supabase channel
     * @param {string} username - User's username
     * @param {number} delay - Delay in ms (default 3000)
     * @returns {object} Handler object with start/stop methods
     */
    createTypingHandler(channel, username, delay = 3000) {
        let typingTimeout = null;
        let isCurrentlyTyping = false;

        const handler = {
            // Start typing indicator
            startTyping: () => {
                console.log('⌨️ User started typing');

                // Immediately show typing if not already showing
                if (!isCurrentlyTyping) {
                    isCurrentlyTyping = true;
                    this.broadcastTyping(channel, true, username);
                }

                // Clear existing timeout
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }

                // Auto-stop after delay of inactivity
                typingTimeout = setTimeout(() => {
                    console.log('⏰ Typing timeout - auto stop');
                    handler.stopTyping();
                }, delay);
            },

            // Stop typing indicator (called on send or timeout)
            stopTyping: () => {
                console.log('🛑 User stopped typing');

                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                    typingTimeout = null;
                }

                if (isCurrentlyTyping) {
                    isCurrentlyTyping = false;
                    this.broadcastTyping(channel, false, username);
                }
            },

            // Clean up (called on unmount)
            cleanup: () => {
                console.log('🧹 Cleaning up typing handler');
                handler.stopTyping();
            }
        };

        return handler;
    },

    /**
     * Stop typing broadcast (cleanup)
     * @param {object} channel - Supabase channel
     */
    async stopTyping(channel) {
        if (!channel) return;
        
        try {
            await channel.untrack();
            console.log('✅ Untracked typing presence');
        } catch (error) {
            console.error('❌ Error untracking:', error);
        }
    }
};

export default TypingHelpers;