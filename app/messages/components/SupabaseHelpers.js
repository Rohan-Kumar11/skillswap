// app/messages/components/SupabaseHelpers.js
// ✅ FIXED - Proper online status detection

import { supabase } from '@/lib/supabaseClient';
import MessageHelpers from './MessageHelpers';
import OnlineStatusHelpers from './OnlineStatusHelpers';
import { getAvatarUrl, getDisplayAvatar } from '../../utils/avatarUtils';

const SupabaseHelpers = {
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    getAvatarUrl(user) {
        return getAvatarUrl(user);
    },

    getDisplayAvatar(user) {
        return getDisplayAvatar(user);
    },

    async getConversations(userId) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                user1:user1_id(id, username, full_name, profile_pic, last_seen_at, skills_offered, skills_wanted, bio),
                user2:user2_id(id, username, full_name, profile_pic, last_seen_at, skills_offered, skills_wanted, bio)
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return { request: [], common: [], swap: [] };
        }

        const grouped = { request: [], common: [], swap: [] };

        for (const conv of data) {
            const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;

            const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, created_at, sender_id, has_swap_keywords')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const unreadCount = await this.getUnreadCount(conv.id, userId);

            // ✅ FIXED: Use OnlineStatusHelpers for accurate status
            const isOnline = OnlineStatusHelpers.isUserOnline(otherUser.last_seen_at);

            const conversation = {
                id: conv.id,
                type: conv.type,
                user1_id: conv.user1_id,
                user2_id: conv.user2_id,
                user: {
                    id: otherUser.id,
                    name: otherUser.username,
                    fullName: otherUser.full_name,
                    avatar: this.getDisplayAvatar(otherUser),
                    avatarUrl: this.getAvatarUrl(otherUser),
                    profilePic: otherUser.profile_pic,
                    skillsOffered: otherUser.skills_offered || [],
                    skillsWanted: otherUser.skills_wanted || [],
                    online: isOnline, // ✅ FIXED
                    lastSeenAt: otherUser.last_seen_at,
                    statusText: OnlineStatusHelpers.getStatusText(otherUser.last_seen_at),
                    bio: otherUser.bio
                },
                lastMessage: lastMsg ? {
                    text: lastMsg.content,
                    timestamp: lastMsg.created_at,
                    sender: lastMsg.sender_id === userId ? 'me' : 'them',
                    hasKeywords: lastMsg.has_swap_keywords
                } : null,
                unreadCount,
                timestamp: conv.last_message_at,
                agreement: conv.agreement_created ? {
                    created: true,
                    hours: conv.agreement_hours,
                    progress: conv.agreement_progress
                } : null
            };

            if (grouped[conv.type]) {
                grouped[conv.type].push(conversation);
            }
        }

        return grouped;
    },

    async getUnreadCount(conversationId, userId) {
        const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);

        let unreadCount = 0;
        if (unreadMessages && unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(m => m.id);
            const { data: readReceipts } = await supabase
                .from('message_read_receipts')
                .select('message_id')
                .in('message_id', messageIds)
                .eq('user_id', userId);

            const readMessageIds = new Set(readReceipts?.map(r => r.message_id) || []);
            unreadCount = messageIds.filter(id => !readMessageIds.has(id)).length;
        }
        return unreadCount;
    },

    async getMessages(conversationId, userId, limit = 50, offset = 0) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(username, profile_pic),
                replied_message:reply_to_message_id(
                    id,
                    content,
                    sender_id,
                    deleted_at,
                    file_name
                )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        const reversedData = data.reverse();

        const messageIds = reversedData.map(m => m.id);
        const { data: readReceipts } = await supabase
            .from('message_read_receipts')
            .select('message_id, user_id')
            .in('message_id', messageIds);

        const readReceiptsMap = {};
        readReceipts?.forEach(r => {
            if (!readReceiptsMap[r.message_id]) {
                readReceiptsMap[r.message_id] = [];
            }
            readReceiptsMap[r.message_id].push(r.user_id);
        });

        return reversedData.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === userId ? 'me' : 'them',
            senderId: msg.sender_id,
            timestamp: msg.created_at,
            read: msg.sender_id === userId &&
                readReceiptsMap[msg.id]?.some(uid => uid !== msg.sender_id),
            hasKeywords: msg.has_swap_keywords,
            fileUrl: msg.file_url,
            fileName: msg.file_name,
            fileType: msg.file_type,
            fileSize: msg.file_size,
            editedAt: msg.edited_at,
            deletedAt: msg.deleted_at,
            replyTo: msg.replied_message ? {
                id: msg.replied_message.id,
                text: msg.replied_message.deleted_at 
                    ? 'This message was deleted' 
                    : msg.replied_message.content,
                sender: msg.replied_message.sender_id === userId ? 'me' : 'them',
                isDeleted: !!msg.replied_message.deleted_at,
                fileName: msg.replied_message.file_name
            } : null
        }));
    },

    async sendMessage(conversationId, userId, content, replyToMessageId = null) {
        console.log('=== SENDING MESSAGE ===');
        console.log('Conversation:', conversationId);
        console.log('User:', userId);
        console.log('Content:', content);
        console.log('Reply to:', replyToMessageId);

        const hasKeywords = MessageHelpers.hasSwapKeywords(content);
        console.log('Has keywords:', hasKeywords);

        const messageData = {
            conversation_id: conversationId,
            sender_id: userId,
            content: content,
            has_swap_keywords: hasKeywords
        };

        if (replyToMessageId) {
            messageData.reply_to_message_id = replyToMessageId;
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

        if (error) {
            console.error('❌ Error sending message:', error);
            return null;
        }

        console.log('✅ Message created:', message.id);

        await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

        if (hasKeywords) {
            console.log('🔥 Keywords detected - creating swap request...');
            
            const swapRequest = await this.createSwapUpgradeRequest(
                conversationId,
                userId,
                message.id
            );

            if (swapRequest && swapRequest.blocked) {
                console.log('⚠️ Swap request blocked:', swapRequest.reason);
                return {
                    ...message,
                    blocked: true,
                    reason: swapRequest.reason,
                    message: swapRequest.message
                };
            }

            if (swapRequest) {
                console.log('✅ Swap request created:', swapRequest.id);
            }
        }

        return message;
    },

    async createSwapUpgradeRequest(conversationId, senderId, messageId) {
        console.log('=== CREATE SWAP REQUEST (WITH LIMITS) ===');
        console.log('Conv:', conversationId, 'Sender:', senderId, 'Msg:', messageId);

        try {
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('user1_id, user2_id, type')
                .eq('id', conversationId)
                .single();

            if (convError || !conv) {
                console.error('❌ Conv fetch error:', convError);
                return null;
            }

            if (conv.type !== 'common') {
                console.log('⚠️ Not common type:', conv.type);
                return null;
            }

            const receiverId = conv.user1_id === senderId ? conv.user2_id : conv.user1_id;
            console.log('Receiver:', receiverId);

            const { data: existing } = await supabase
                .from('swap_upgrade_requests')
                .select('id, status')
                .eq('conversation_id', conversationId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existing) {
                console.log('⚠️ Pending request exists:', existing.id);
                return existing;
            }

            const cooldownCheck = await this.checkSwapCooldown(conversationId, senderId);
            
            if (!cooldownCheck.canRequest) {
                console.log('⚠️ Cooldown active:', cooldownCheck.message);
                return {
                    id: null,
                    blocked: true,
                    reason: 'cooldown',
                    message: cooldownCheck.message,
                    cooldownUntil: cooldownCheck.cooldownUntil,
                    remainingHours: cooldownCheck.remainingHours,
                    permanentBlock: cooldownCheck.permanentBlock
                };
            }

            const { count } = await supabase
                .from('swap_upgrade_requests')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId)
                .eq('requester_id', senderId);

            if (count >= 5) {
                console.log('⚠️ Max attempts reached:', count);
                return {
                    id: null,
                    blocked: true,
                    reason: 'max_attempts',
                    message: 'Maximum swap request attempts (5) reached for this conversation'
                };
            }

            const { data: newRequest, error: createError } = await supabase
                .from('swap_upgrade_requests')
                .insert({
                    conversation_id: conversationId,
                    requester_id: senderId,
                    receiver_id: receiverId,
                    message_id: messageId,
                    status: 'pending',
                    attempt_number: (count || 0) + 1
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Create error:', createError);
                return null;
            }

            console.log('✅ New request created:', newRequest.id);
            return newRequest;

        } catch (err) {
            console.error('❌ Exception:', err);
            return null;
        }
    },

    async getPendingSwapRequest(conversationId, userId) {
        console.log('=== GET PENDING SWAP REQUEST ===');
        
        try {
            const { data: allRequests, error } = await supabase
                .from('swap_upgrade_requests')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error || !allRequests || allRequests.length === 0) {
                return null;
            }

            const request = allRequests[0];
            const isReceiver = request.receiver_id === userId;
            const isSender = request.requester_id === userId;

            const { data: requester } = await supabase
                .from('users')
                .select('username, full_name')
                .eq('id', request.requester_id)
                .single();

            return {
                id: request.id,
                conversationId: request.conversation_id,
                requesterId: request.requester_id,
                receiverId: request.receiver_id,
                messageId: request.message_id,
                requesterName: requester?.username || requester?.full_name || 'User',
                messagePreview: 'Wants to upgrade to Professional Swap',
                createdAt: request.created_at,
                isReceiver,
                isSender
            };

        } catch (err) {
            console.error('❌ Exception:', err);
            return null;
        }
    },

    async checkSwapCooldown(conversationId, senderId) {
        try {
            const { data: conv } = await supabase
                .from('conversations')
                .select('user1_id, user2_id')
                .eq('id', conversationId)
                .single();

            if (!conv) {
                return { canRequest: false, message: 'Conversation not found' };
            }

            const receiverId = conv.user1_id === senderId 
                ? conv.user2_id 
                : conv.user1_id;

            const { data: declinedRequests } = await supabase
                .from('swap_upgrade_requests')
                .select('declined_at, attempt_number')
                .eq('conversation_id', conversationId)
                .eq('requester_id', senderId)
                .eq('status', 'declined')
                .order('declined_at', { ascending: false });

            if (!declinedRequests || declinedRequests.length === 0) {
                return { canRequest: true, receiverId };
            }

            const declineCount = declinedRequests.length;

            if (declineCount >= 5) {
                return {
                    canRequest: false,
                    message: 'You cannot send more swap requests to this user',
                    receiverId,
                    permanentBlock: true
                };
            }

            const lastDecline = declinedRequests[0];
            const cooldownHours = [1, 6, 24, 168][declineCount - 1] || 168;
            const cooldownMs = cooldownHours * 60 * 60 * 1000;
            const cooldownUntil = new Date(
                new Date(lastDecline.declined_at).getTime() + cooldownMs
            );

            if (new Date() < cooldownUntil) {
                const remainingHours = Math.ceil(
                    (cooldownUntil - new Date()) / (60 * 60 * 1000)
                );
                
                return {
                    canRequest: false,
                    message: `Please wait ${remainingHours} hours before sending another swap request`,
                    cooldownUntil,
                    remainingHours,
                    receiverId
                };
            }

            return { canRequest: true, receiverId };

        } catch (err) {
            console.error('❌ Cooldown check error:', err);
            return { canRequest: true };
        }
    },

    async respondToSwapRequest(requestId, userId, accept) {
        console.log('=== RESPOND TO SWAP REQUEST ===');

        try {
            const { data: request, error: fetchError } = await supabase
                .from('swap_upgrade_requests')
                .select('*, conversation_id')
                .eq('id', requestId)
                .single();

            if (fetchError || !request) {
                throw new Error('Swap request not found');
            }

            if (request.receiver_id !== userId) {
                throw new Error('You are not authorized to respond to this request');
            }

            if (request.status !== 'pending') {
                throw new Error('This request has already been ' + request.status);
            }

            if (accept) {
                const { error: updateRequestError } = await supabase
                    .from('swap_upgrade_requests')
                    .update({ 
                        status: 'accepted',
                        responded_at: new Date().toISOString()
                    })
                    .eq('id', requestId);

                if (updateRequestError) throw updateRequestError;

                const { error: updateConvError } = await supabase
                    .from('conversations')
                    .update({ 
                        type: 'swap',
                        agreement_created: true,
                        agreement_hours: 10,
                        agreement_progress: 0
                    })
                    .eq('id', request.conversation_id);

                if (updateConvError) throw updateConvError;

                console.log('✅ Swap accepted');
                return { success: true, data: { accepted: true } };

            } else {
                const { error: updateRequestError } = await supabase
                    .from('swap_upgrade_requests')
                    .update({ 
                        status: 'declined',
                        responded_at: new Date().toISOString(),
                        declined_at: new Date().toISOString()
                    })
                    .eq('id', requestId);

                if (updateRequestError) throw updateRequestError;

                console.log('✅ Swap declined');
                return { success: true, data: { accepted: false } };
            }
        } catch (err) {
            console.error('❌ Exception:', err);
            return { 
                success: false, 
                error: { message: err.message }
            };
        }
    },

    async updateConversationType(conversationId, newType) {
        const { error } = await supabase
            .from('conversations')
            .update({ type: newType })
            .eq('id', conversationId);

        return !error;
    },

    async declineConnectionRequest(conversationId, userId) {
        console.log('=== DECLINE CONNECTION REQUEST ===');

        try {
            const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId);

            if (messagesError) throw messagesError;

            await supabase
                .from('swap_upgrade_requests')
                .delete()
                .eq('conversation_id', conversationId);

            const { error: conversationError } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            if (conversationError) throw conversationError;

            console.log('✅ Request declined permanently');
            return { success: true };

        } catch (err) {
            console.error('❌ Exception:', err);
            return { 
                success: false, 
                error: { message: err.message }
            };
        }
    },

    async editMessage(messageId, newContent, userId) {
        console.log('✏️ Editing message:', messageId, 'by user:', userId);

        try {
            const { data: message, error: fetchError } = await supabase
                .from('messages')
                .select('id, sender_id, created_at, deleted_at')
                .eq('id', messageId)
                .single();

            if (fetchError || !message) {
                console.error('❌ Fetch error:', fetchError);
                throw new Error('Message not found');
            }

            if (message.sender_id !== userId) {
                console.error('❌ Not authorized');
                throw new Error('You can only edit your own messages');
            }

            if (message.deleted_at) {
                throw new Error('Cannot edit deleted messages');
            }

            const elapsed = Date.now() - new Date(message.created_at).getTime();
            if (elapsed > 15 * 60 * 1000) {
                throw new Error('Edit time expired (15 min limit)');
            }

            const now = new Date().toISOString();

            const { data: updated, error: updateError } = await supabase
                .from('messages')
                .update({ 
                    content: newContent.trim(),
                    edited_at: now,
                    is_edited: true
                })
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Update error:', updateError);
                throw new Error(updateError.message);
            }

            console.log('✅ Message edited successfully');
            return { success: true, data: updated };

        } catch (err) {
            console.error('❌ Edit failed:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteMessage(messageId, userId) {
        console.log('🗑️ Deleting message:', messageId, 'by user:', userId);

        try {
            const { data: message, error: fetchError } = await supabase
                .from('messages')
                .select('id, sender_id, deleted_at')
                .eq('id', messageId)
                .single();

            if (fetchError || !message) {
                console.error('❌ Fetch error:', fetchError);
                throw new Error('Message not found');
            }

            if (message.sender_id !== userId) {
                console.error('❌ Not authorized');
                throw new Error('You can only delete your own messages');
            }

            if (message.deleted_at) {
                throw new Error('Message already deleted');
            }

            const now = new Date().toISOString();

            const { data: deleted, error: deleteError } = await supabase
                .from('messages')
                .update({ 
                    content: 'This message was deleted',
                    deleted_at: now,
                    file_url: null,
                    file_name: null,
                    file_type: null,
                    file_size: null,
                    is_edited: false
                })
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select()
                .single();

            if (deleteError) {
                console.error('❌ Delete error:', deleteError);
                throw new Error(deleteError.message);
            }

            console.log('✅ Message deleted successfully');
            return { success: true, data: deleted };

        } catch (err) {
            console.error('❌ Delete failed:', err);
            return { success: false, error: err.message };
        }
    },

    async markAsRead(conversationId, userId) {
        try {
            const { error: rpcError } = await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId,
                p_user_id: userId
            });

            if (rpcError) {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', userId);

                if (messages && messages.length > 0) {
                    await supabase
                        .from('message_read_receipts')
                        .upsert(
                            messages.map(m => ({
                                message_id: m.id,
                                user_id: userId,
                                read_at: new Date().toISOString()
                            })),
                            { onConflict: 'message_id,user_id' }
                        );
                }
            }
        } catch (err) {
            console.error('❌ Error marking as read:', err);
        }
    },

    subscribeToMessages(conversationId, callback) {
        return supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, callback)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, callback)
            .subscribe();
    },

    subscribeToSwapRequests(userId, callback) {
        return supabase
            .channel(`swap_requests:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'swap_upgrade_requests',
                filter: `receiver_id=eq.${userId}`
            }, callback)
            .subscribe();
    },

    subscribeToConversations(userId, callback) {
        return supabase
            .channel(`conversations:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations'
            }, callback)
            .subscribe();
    }
};

export default SupabaseHelpers;