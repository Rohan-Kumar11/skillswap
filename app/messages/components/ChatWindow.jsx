// app/messages/components/ChatWindow.jsx
// ✅ COMPLETE FIX - With MessageHelpers import

import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Star, Loader, Phone, Video } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SafeAvatar } from '../../components/SafeAvatar';
import { useToast } from '../../components/Toast';
import SupabaseHelpers from './SupabaseHelpers';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import DateSeparator from './DateSeparator';    
import { DateHelpers } from './MessageHelpers';
import MessageHelpers from './MessageHelpers'; // ⭐ ADDED THIS IMPORT
import InlineSwapActions from './InlineSwapActions';
import SwapRequestBadge from './SwapRequestBadge';
import TypingHelpers from './TypingHelpers';
import CallSystem from './calls/CallSystem';
import { CallHistoryModal, MissedCallBadge } from './calls/CallHistoryModal';
import { CallDatabaseService } from '@/lib/calls/SignalingService';
import { MoreOptionsMenu, ShareModal } from './HeaderActions';
import ProfilePictureModal from './ProfilePictureModal';
import UserProfilePage from './UserProfilePage';
const ChatWindow = ({
    currentChat,
    currentUser,
    activeSection,
    pendingSwapRequest,
    onSendMessage,
    onAcceptRequest,
    onDeclineRequest,
    onAcceptSwapRequest,
    onDeclineSwapRequest,
    onShowSwapModal,
    declining = false,
    onRefreshConversations
}) => {
    // Message States
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [swapActionLoading, setSwapActionLoading] = useState(false);
    const [cooldownInfo, setCooldownInfo] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    
    // Header Actions States
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Call System States
    const [showCallUI, setShowCallUI] = useState(false);
    const [callType, setCallType] = useState(null);
    const [showCallHistory, setShowCallHistory] = useState(false);
    const [missedCallsCount, setMissedCallsCount] = useState(0);
    
    // SWAP Features States
    const [showScheduler, setShowScheduler] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    
    const [showProfilePicModal, setShowProfilePicModal] = useState(false);
const [showUserProfilePage, setShowUserProfilePage] = useState(false);
    // Refs
    const typingHandlerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);
    const moreButtonRef = useRef(null);
    const toast = useToast();

    // Load messages and mark as read with parent refresh
    useEffect(() => {
        if (currentChat && currentUser) {
            loadMessages();
            
            // Mark as read and trigger parent refresh
            const markAndRefresh = async () => {
                await SupabaseHelpers.markAsRead(currentChat.id, currentUser.id);
                
                // Notify parent to refresh conversations list
                if (onRefreshConversations) {
                    setTimeout(() => {
                        onRefreshConversations();
                    }, 300);
                }
            };
            
            markAndRefresh();
            
            const channel = TypingHelpers.subscribeToTyping(
                currentChat.id,
                currentUser.id,
                (users) => setTypingUsers(users)
            );
            
            const handler = TypingHelpers.createTypingHandler(
                channel,
                currentUser.user_metadata?.username || 
                currentUser.email?.split('@')[0] || 
                'User'
            );
            
            typingHandlerRef.current = handler;
            
            return () => {
                if (typingHandlerRef.current) {
                    typingHandlerRef.current.cleanup();
                }
                TypingHelpers.stopTyping(channel);
                channel.unsubscribe();
                typingHandlerRef.current = null;
            };
        }
    }, [currentChat?.id, currentUser?.id]);

    // Load missed calls count
    useEffect(() => {
        if (currentChat && currentUser) {
            loadMissedCallsCount();
        }
    }, [currentChat?.id, currentUser?.id]);

    const loadMissedCallsCount = async () => {
        try {
            const count = await CallDatabaseService.getMissedCallsCount(currentUser.id);
            setMissedCallsCount(count);
        } catch (error) {
            console.error('Error loading missed calls count:', error);
        }
    };

    // Check swap cooldown
    useEffect(() => {
        if (currentChat && currentUser && activeSection === 'common') {
            checkSwapCooldown();
        } else {
            setCooldownInfo(null);
            setIsBlocked(false);
        }
    }, [currentChat?.id, activeSection]);

    const checkSwapCooldown = async () => {
        if (!currentChat || !currentUser) return;
        try {
            const cooldown = await SupabaseHelpers.checkSwapCooldown(
                currentChat.id,
                currentUser.id
            );
            if (!cooldown.canRequest) {
                setCooldownInfo({
                    message: cooldown.message,
                    remainingHours: cooldown.remainingHours,
                    permanentBlock: cooldown.permanentBlock
                });
                setIsBlocked(true);
            } else {
                setCooldownInfo(null);
                setIsBlocked(false);
            }
        } catch (err) {
            console.error('Error checking cooldown:', err);
        }
    };

    // Subscribe to message changes and trigger parent refresh
    useEffect(() => {
        if (!currentChat || !currentUser) return;

        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        const channel = supabase
            .channel(`messages_${currentChat.id}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${currentChat.id}`
                },
                async (payload) => {
                    console.log('📨 DB Change:', payload.eventType);
                    
                    // Reload messages
                    await loadMessages();
                    
                    // If new message from other user, mark as read and refresh parent
                    if (payload.eventType === 'INSERT' && 
                        payload.new.sender_id !== currentUser.id) {
                        console.log('📖 Auto-marking as read');
                        await SupabaseHelpers.markAsRead(currentChat.id, currentUser.id);
                        
                        // Trigger parent refresh
                        if (onRefreshConversations) {
                            setTimeout(() => {
                                onRefreshConversations();
                            }, 300);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);
            });

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [currentChat?.id, currentUser?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        if (!currentChat || !currentUser) return;
        try {
            const msgs = await SupabaseHelpers.getMessages(currentChat.id, currentUser.id);
            setMessages(msgs);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    const handleEditMessage = async (msg) => {
        console.log('✏️ Edit message:', msg.id);
        
        const messageTime = new Date(msg.timestamp).getTime();
        const elapsed = Date.now() - messageTime;
        
        if (elapsed > 15 * 60 * 1000) {
            toast.error('Edit time expired (15 min limit)');
            return;
        }

        if (msg.deletedAt) {
            toast.error('Cannot edit deleted messages');
            return;
        }

        setEditingMessage(msg);
        setMessage(msg.text);
        
        if (typingHandlerRef.current) {
            typingHandlerRef.current.stopTyping();
        }
    };

    const handleDeleteMessage = async (msg) => {
        if (msg.deletedAt) {
            toast.error('Already deleted');
            return;
        }

        if (!window.confirm('Delete this message for everyone?')) {
            return;
        }

        console.log('🗑️ Starting delete for:', msg.id);

        try {
            const result = await SupabaseHelpers.deleteMessage(msg.id, currentUser.id);

            if (!result.success) {
                throw new Error(result.error);
            }

            console.log('✅ Delete successful');
            toast.success('Message deleted');
            
            await loadMessages();

        } catch (err) {
            console.error('❌ Delete failed:', err);
            toast.error(err.message || 'Failed to delete message');
        }
    };

    const handleReplyMessage = (msg) => {
        if (msg.deletedAt) {
            toast.error('Cannot reply to deleted messages');
            return;
        }
        console.log('💬 Reply to:', msg.id);
        setReplyingTo(msg);
    };

    const handleFileUploaded = async (fileData) => {
        console.log('📎 File uploaded, creating message:', fileData);
        
        try {
            let messageContent = '';
            if (fileData.isImage) {
                messageContent = '📷 Image';
            } else if (fileData.isVideo) {
                messageContent = '🎥 Video';
            } else {
                messageContent = `📎 ${fileData.name}`;
            }

            if (fileData.caption) {
                messageContent = fileData.caption;
            }

            console.log('📝 Inserting message with file data...');

            const messageId = crypto.randomUUID();

            const { data: message, error } = await supabase
                .from('messages')
                .insert({
                    id: messageId,
                    conversation_id: currentChat.id,
                    sender_id: currentUser.id,
                    content: messageContent,
                    file_url: fileData.url,
                    file_name: fileData.name,
                    file_type: fileData.type,
                    file_size: fileData.size,
                    has_swap_keywords: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating message:', error);
                toast.error('Failed to send file: ' + error.message);
                throw error;
            }

            console.log('✅ File message created:', message.id);

            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', currentChat.id);

            await loadMessages();
            
            // Trigger parent refresh
            if (onRefreshConversations) {
                onRefreshConversations();
            }
            
            toast.success('File sent successfully!');
            
        } catch (err) {
            console.error('❌ File upload error:', err);
            toast.error('Failed to send file');
        }
    };

    // ⭐ FIXED: handleSend with proper MessageHelpers usage
    const handleSend = async () => {
        if (!message.trim()) return;

        // ⭐ Check if message contains swap keywords
        const messageHasSwapKeywords = MessageHelpers.hasSwapKeywords(message);
        
        // ⭐ Only block if cooldown is active AND message has swap keywords
        if (isBlocked && messageHasSwapKeywords && activeSection === 'common') {
            toast.error('Swap requests blocked. Please remove swap keywords or wait for cooldown to end.');
            return;
        }

        if (typingHandlerRef.current) {
            typingHandlerRef.current.stopTyping();
        }

        if (editingMessage) {
            console.log('✏️ Starting edit for:', editingMessage.id);
            
            const messageContent = message.trim();
            
            try {
                const result = await SupabaseHelpers.editMessage(
                    editingMessage.id, 
                    messageContent, 
                    currentUser.id
                );

                if (!result.success) {
                    throw new Error(result.error);
                }

                console.log('✅ Edit successful');
                toast.success('Message updated');
                
                setEditingMessage(null);
                setMessage('');
                
                await loadMessages();

            } catch (err) {
                console.error('❌ Edit failed:', err);
                toast.error(err.message || 'Failed to update message');
            }
            return;
        }

        const messageContent = message.trim();
        const replyToId = replyingTo?.id || null;

        console.log('📤 Sending new message');

        try {
            const result = await SupabaseHelpers.sendMessage(
                currentChat.id,
                currentUser.id,
                messageContent,
                replyToId
            );
            
            if (result) {
                if (result.blocked) {
                    toast.error(result.message || 'Request blocked');
                } else {
                    setMessage('');
                    setReplyingTo(null);
                    
                    // Trigger parent refresh
                    if (onRefreshConversations) {
                        onRefreshConversations();
                    }
                }
            }
        } catch (err) {
            console.error('❌ Send error:', err);
            toast.error('Failed to send message');
        }
    };

    const handleAcceptSwap = async (requestId) => {
        setSwapActionLoading(true);
        try {
            await onAcceptSwapRequest(requestId);
        } finally {
            setSwapActionLoading(false);
        }
    };

    const handleDeclineSwap = async (requestId) => {
        if (!window.confirm('Decline swap request?')) return;
        setSwapActionLoading(true);
        try {
            await onDeclineSwapRequest(requestId);
        } finally {
            setSwapActionLoading(false);
        }
    };

    // Call Handlers
    const handleVoiceCall = () => {
        console.log('📞 Starting voice call');
        setCallType('voice');
        setShowCallUI(true);
    };

    const handleVideoCall = () => {
        console.log('📹 Starting video call');
        setCallType('video');
        setShowCallUI(true);
    };

    const handleCloseCall = () => {
        console.log('📞 Closing call');
        setShowCallUI(false);
        setCallType(null);
        loadMissedCallsCount();
        toast.info('Call ended');
    };

    const handleViewCallHistory = () => {
        console.log('📊 Opening call history');
        setShowCallHistory(true);
        if (missedCallsCount > 0) {
            CallDatabaseService.markMissedCallsAsSeen(currentUser.id, currentChat.id)
                .then(() => {
                    setMissedCallsCount(0);
                });
        }
    };

    // SWAP Feature Handlers
    const handleSchedule = () => {
        console.log('📅 Opening scheduler...');
        setShowScheduler(true);
        setShowMoreMenu(false);
    };

    const handleProgress = () => {
        console.log('📊 Opening progress dashboard...');
        setShowProgress(true);
        setShowMoreMenu(false);
    };

    const handleShare = () => {
        console.log('🔗 Opening share modal...');
        setShowShareModal(true);
        setShowMoreMenu(false);
    };

    // Empty state
    if (!currentChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900/30">
                <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Users className="w-16 h-16 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        SkillSwap Messages
                    </h2>
                    <p className="text-gray-400">Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col bg-slate-900/30 h-full overflow-hidden">
{/* Header */}
<div className="p-4 bg-slate-900/50 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between flex-shrink-0">
    {/* Left: User Info */}
    <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* ✅ Clickable Avatar */}
        <div 
            onClick={() => setShowProfilePicModal(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
        >
            <SafeAvatar
                user={{
                    username: currentChat.user.name,
                    full_name: currentChat.user.fullName,
                    profile_pic: currentChat.user.profilePic
                }}
                size="md"
                online={currentChat.user.online}
                showBadge={activeSection === 'swap'}
                badgeIcon={activeSection === 'swap' ? <Star className="w-3 h-3" /> : null}
            />
        </div>

        <div className="min-w-0 flex-1">
            {/* ✅ Clickable Username */}
            <h2 
                className="font-semibold text-white flex items-center gap-2 truncate cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => setShowUserProfilePage(true)}
            >
                <span className="truncate">@{currentChat.user.name}</span>
                {activeSection === 'swap' && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30 whitespace-nowrap flex-shrink-0">
                        Professional Swap
                    </span>
                )}
            </h2>
            
            {/* Status */}
            <div className="flex items-center gap-2">
                <p className={`text-xs font-medium ${
                    currentChat.user.online 
                        ? 'text-green-400' 
                        : 'text-gray-400'
                }`}>
                    {currentChat.user.statusText || (currentChat.user.online ? '🟢 Online' : 'Offline')}
                </p>
                
                {missedCallsCount > 0 && (
                    <MissedCallBadge 
                        count={missedCallsCount}
                        onClick={handleViewCallHistory}
                    />
                )}
            </div>
        </div>
    </div>

    {/* Right: Call Buttons & More */}
    <div className="flex items-center gap-2 flex-shrink-0">
        <button
            onClick={handleVoiceCall}
            className="p-2.5 hover:bg-purple-500/10 rounded-full transition-all group"
            title="Voice call"
        >
            <Phone className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
        </button>

        <button
            onClick={handleVideoCall}
            className="p-2.5 hover:bg-purple-500/10 rounded-full transition-all group"
            title="Video call"
        >
            <Video className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
        </button>

        <button
            ref={moreButtonRef}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2.5 rounded-full transition-all ${
                showMoreMenu 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'hover:bg-purple-500/10 text-purple-400'
            }`}
            title="More options"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </button>
    </div>
</div>

                {/* Messages Area - Fixed overflow */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader className="w-8 h-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <MessagesList 
                            messages={messages}
                            activeSection={activeSection}
                            pendingSwapRequest={pendingSwapRequest}
                            currentChat={currentChat}
                            currentUser={currentUser}
                            handleAcceptSwap={handleAcceptSwap}
                            handleDeclineSwap={handleDeclineSwap}
                            swapActionLoading={swapActionLoading}
                            onShowSwapModal={onShowSwapModal}
                            typingUsers={typingUsers}
                            messagesEndRef={messagesEndRef}
                            onEditMessage={handleEditMessage}
                            onDeleteMessage={handleDeleteMessage}
                            onReplyMessage={handleReplyMessage}
                        />
                    )}
                </div>

                {/* Message Input */}
                <MessageInput
                    message={message}
                    setMessage={setMessage}
                    handleSend={handleSend}
                    currentChat={currentChat}
                    activeSection={activeSection}
                    cooldownInfo={cooldownInfo}
                    isBlocked={isBlocked}
                    editingMessage={editingMessage}
                    setEditingMessage={setEditingMessage}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    onFileUploaded={handleFileUploaded}
                    typingHandler={typingHandlerRef.current}
                />

                {/* More Options Menu */}
                {showMoreMenu && (
                    <MoreOptionsMenu
                        isOpen={showMoreMenu}
                        onClose={() => setShowMoreMenu(false)}
                        recipientName={currentChat.user.name}
                        conversationId={currentChat.id}
                        onShare={handleShare}
                        onSchedule={handleSchedule}
                        onProgress={handleProgress}
                        onViewCallHistory={handleViewCallHistory}
                        activeSection={activeSection}
                        buttonRef={moreButtonRef}
                    />
                )}

                {/* Share Modal */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    recipientName={currentChat.user.name}
                    conversationId={currentChat.id}
                />
            </div>

            {/* Call System */}
            {showCallUI && (
                <CallSystem
                    conversationId={currentChat.id}
                    currentUser={currentUser}
                    otherUser={{
                        id: currentChat.user.id,
                        username: currentChat.user.name,
                        profile_pic: currentChat.user.profilePic
                    }}
                    callType={callType}
                    isIncoming={false}
                    onClose={handleCloseCall}
                />
            )}

            {/* Call History Modal */}
            {showCallHistory && (
                <CallHistoryModal
                    isOpen={showCallHistory}
                    onClose={() => setShowCallHistory(false)}
                    conversationId={currentChat.id}
                    otherUser={{
                        id: currentChat.user.id,
                        username: currentChat.user.name,
                        profile_pic: currentChat.user.profilePic
                    }}
                />
            )}
       
        {/* Profile Picture Modal */}
        <ProfilePictureModal
            isOpen={showProfilePicModal}
            onClose={() => setShowProfilePicModal(false)}
            user={{
                name: currentChat.user.name,
                fullName: currentChat.user.fullName,
                profilePic: currentChat.user.profilePic
            }}
        />

        {/* User Profile Page */}
        <UserProfilePage
            isOpen={showUserProfilePage}
            onClose={() => setShowUserProfilePage(false)}
            userId={currentChat.user.id}
            currentUserId={currentUser.id}
            conversationId={currentChat.id}
        />
    </>
);
};

// Messages List Component
const MessagesList = ({
    messages,
    activeSection,
    pendingSwapRequest,
    currentChat,
    currentUser,
    handleAcceptSwap,
    handleDeclineSwap,
    swapActionLoading,
    onShowSwapModal,
    typingUsers,
    messagesEndRef,
    onEditMessage,
    onDeleteMessage,
    onReplyMessage
}) => {
    const messagesWithSeparators = DateHelpers.insertDateSeparators(messages);

    return (
        <>
            {/* Swap Request Badge */}
            {activeSection === 'common' && pendingSwapRequest && pendingSwapRequest.isReceiver && (
                <SwapRequestBadge request={pendingSwapRequest} onClick={onShowSwapModal} />
            )}

            {/* Messages */}
            {messagesWithSeparators.map((item) => {
                if (item.type === 'date-separator') {
                    return (
                        <DateSeparator 
                            key={item.id}
                            date={item.date}
                        />
                    );
                }

                const msg = item;
                const shouldShowSwapActions = 
                    msg.hasKeywords && 
                    msg.sender === 'them' && 
                    activeSection === 'common' && 
                    pendingSwapRequest && 
                    pendingSwapRequest.isReceiver;

                const shouldShowWaiting =
                    msg.hasKeywords &&
                    msg.sender === 'me' &&
                    activeSection === 'common' &&
                    pendingSwapRequest &&
                    pendingSwapRequest.isSender;

                return (
                    <div key={msg.id}>
                        <MessageBubble
                            msg={msg}
                            currentUser={currentUser}
                            currentChat={currentChat}
                            onEdit={onEditMessage}
                            onDelete={onDeleteMessage}
                            onReply={onReplyMessage}
                        />

                        {shouldShowSwapActions && (
                            <div className="flex justify-start mt-2">
                                <InlineSwapActions
                                    request={pendingSwapRequest}
                                    onAccept={handleAcceptSwap}
                                    onDecline={handleDeclineSwap}
                                    loading={swapActionLoading}
                                />
                            </div>
                        )}

                        {shouldShowWaiting && (
                            <div className="flex justify-end mt-2">
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 max-w-md">
                                    <Loader className="w-4 h-4 text-purple-400 animate-spin inline mr-2" />
                                    <span className="text-sm text-purple-300">
                                        Waiting for @{currentChat.user.name}...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="flex justify-start mb-2">
                    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
                        <p className="text-xs text-gray-400 mb-1">
                            {typingUsers[0].username} is typing...
                        </p>
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </>
    );
};

export default ChatWindow;