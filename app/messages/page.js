// app/messages/page.js
// ✅ FIXED - With online status heartbeat

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '../components/Toast';

// Import components
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SwapRequestModal from './components/SwapRequestModal';
import SupabaseHelpers from './components/SupabaseHelpers';
import OnlineStatusHelpers from './components/OnlineStatusHelpers';
import MessageHelpers from './components/MessageHelpers';

// Call System Import
import CallSystem from './components/calls/CallSystem';

export default function MessageContainer() {
    const [activeSection, setActiveSection] = useState('common');
    const [selectedChat, setSelectedChat] = useState(null);
    const [conversations, setConversations] = useState({ request: [], common: [], swap: [] });
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [currentSwapRequest, setCurrentSwapRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);
    const [declining, setDeclining] = useState(false);
    
    // Incoming Call State
    const [incomingCall, setIncomingCall] = useState(null);
    
    // ✅ NEW: Heartbeat ref
    const heartbeatIntervalRef = useRef(null);
    
    const toast = useToast();

    // ✅ Initialize and start heartbeat
    useEffect(() => {
        initializeData();
    }, []);

    // ✅ Start/stop heartbeat when user changes
    useEffect(() => {
        if (currentUser) {
            console.log('💓 Starting heartbeat for user:', currentUser.id);
            heartbeatIntervalRef.current = OnlineStatusHelpers.startHeartbeat(currentUser.id);
        }

        return () => {
            if (heartbeatIntervalRef.current) {
                console.log('🛑 Stopping heartbeat');
                OnlineStatusHelpers.stopHeartbeat(heartbeatIntervalRef.current);
            }
        };
    }, [currentUser?.id]);

    // ✅ Update presence on page visibility change
    useEffect(() => {
        if (!currentUser) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('👀 Page visible - updating presence');
                OnlineStatusHelpers.updateUserPresence(currentUser.id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUser?.id]);

    // Auto-refresh conversations when selectedChat changes
    useEffect(() => {
        if (currentUser && selectedChat) {
            console.log('📊 Chat selected, marking as read and refreshing...');
            
            SupabaseHelpers.markAsRead(selectedChat, currentUser.id);
            
            setTimeout(() => {
                loadConversations();
            }, 500);
        }
    }, [selectedChat, currentUser?.id]);

    // Subscribe to incoming calls
    useEffect(() => {
        if (!currentUser) return;

        console.log('📞 Setting up incoming call listener for user:', currentUser.id);

        const channel = supabase
            .channel(`user-calls:${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${currentUser.id}`
                },
                async (payload) => {
                    const call = payload.new;
                    
                    console.log('📞 Incoming call detected:', call);
                    
                    if (call.status === 'calling' || call.status === 'ringing') {
                        console.log('📞 Processing incoming call from:', call.caller_id);
                        
                        const { data: caller, error: callerError } = await supabase
                            .from('profile_user')
                            .select('id, username, profile_pic')
                            .eq('id', call.caller_id)
                            .single();

                        if (callerError) {
                            console.error('Error fetching caller info:', callerError);
                            return;
                        }

                        const { data: conversation, error: convError } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('id', call.conversation_id)
                            .single();

                        if (convError) {
                            console.error('Error fetching conversation:', convError);
                            return;
                        }

                        console.log('✅ Showing incoming call from:', caller.username);

                        setIncomingCall({
                            callId: call.id,
                            conversationId: call.conversation_id,
                            caller: {
                                id: caller.id,
                                username: caller.username,
                                profile_pic: caller.profile_pic
                            },
                            callType: call.call_type
                        });

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(`Incoming ${call.call_type} call`, {
                                body: `${caller.username} is calling you`,
                                icon: caller.profile_pic || '/default-avatar.png'
                            });
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const call = payload.new;
                    
                    if (call.status !== 'calling' && call.status !== 'ringing') {
                        console.log('📞 Call status changed to:', call.status);
                        if (incomingCall && incomingCall.callId === call.id) {
                            setIncomingCall(null);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Incoming call channel status:', status);
            });

        return () => {
            console.log('🛑 Cleaning up incoming call listener');
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!currentUser) return;

        console.log('📡 Setting up realtime subscriptions');

        const convSubscription = SupabaseHelpers.subscribeToConversations(
            currentUser.id,
            () => {
                console.log('📢 Conversation updated - refreshing list');
                loadConversations();
            }
        );

        const messageChannel = supabase
            .channel(`user-messages:${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('📨 New message detected:', payload.new);
                    
                    if (payload.new.conversation_id === selectedChat && 
                        payload.new.sender_id !== currentUser.id) {
                        console.log('📖 Auto-marking new message as read');
                        SupabaseHelpers.markAsRead(selectedChat, currentUser.id);
                    }
                    
                    setTimeout(() => {
                        loadConversations();
                    }, 300);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    console.log('📝 Message updated - refreshing list');
                    setTimeout(() => {
                        loadConversations();
                    }, 300);
                }
            )
            .subscribe((status) => {
                console.log('📡 Message subscription status:', status);
            });

        const swapSubscription = SupabaseHelpers.subscribeToSwapRequests(
            currentUser.id,
            async (payload) => {
                console.log('📢 New swap request:', payload);

                if (selectedChat === payload.new.conversation_id) {
                    await loadSwapRequestForChat(selectedChat);
                }
                
                loadConversations();
            }
        );

        // ✅ Subscribe to profile_user table for online status updates
        const statusChannel = supabase
            .channel(`all-user-status`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profile_user'
                },
                () => {
                    console.log('🟢 User status updated - refreshing conversations');
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            console.log('🛑 Cleaning up subscriptions');
            convSubscription.unsubscribe();
            messageChannel.unsubscribe();
            swapSubscription.unsubscribe();
            statusChannel.unsubscribe();
        };
    }, [currentUser?.id, selectedChat]);

    // Load swap request when chat changes
    useEffect(() => {
        if (currentUser && selectedChat && activeSection === 'common') {
            console.log('🔍 Loading swap request for chat:', selectedChat);
            loadSwapRequestForChat(selectedChat);
        } else if (activeSection !== 'common') {
            setCurrentSwapRequest(null);
        }
    }, [currentUser?.id, selectedChat, activeSection]);

    const initializeData = async () => {
        try {
            setLoading(true);
            setError(null);

            const user = await SupabaseHelpers.getCurrentUser();
            setCurrentUser(user);
            console.log('✅ User loaded:', user.id);

            // ✅ Update presence immediately
            await OnlineStatusHelpers.updateUserPresence(user.id);

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('🔔 Notification permission:', permission);
            }

            const convs = await SupabaseHelpers.getConversations(user.id);
            setConversations(convs);
            console.log('✅ Conversations loaded:', {
                request: convs.request.length,
                common: convs.common.length,
                swap: convs.swap.length
            });

        } catch (err) {
            console.error('❌ Init error:', err);
            setError('Failed to load messages. Please refresh the page.');
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const loadConversations = async () => {
        if (!currentUser) return;
        
        console.log('🔄 Reloading conversations...');
        const convs = await SupabaseHelpers.getConversations(currentUser.id);
        setConversations(convs);
        console.log('✅ Conversations refreshed');
    };

    const loadSwapRequestForChat = async (chatId) => {
        if (!currentUser || !chatId) return;

        console.log('🔍 Checking swap request for chat:', chatId);
        const request = await SupabaseHelpers.getPendingSwapRequest(chatId, currentUser.id);

        if (request) {
            console.log('✅ Swap request found:', request.id);
            setCurrentSwapRequest(request);
        } else {
            console.log('⚠️ No swap request found');
            setCurrentSwapRequest(null);
        }
    };

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || !selectedChat || !currentUser) return false;

        console.log('📤 Sending message:', messageText);
        const sent = await SupabaseHelpers.sendMessage(selectedChat, currentUser.id, messageText);

        if (sent) {
            if (sent.blocked) {
                toast.error(sent.message || 'Swap request blocked');
                return true;
            }
            
            await loadConversations();

            if (MessageHelpers.hasSwapKeywords(messageText) && activeSection === 'common') {
                console.log('🔥 Keyword message sent, checking for swap request...');

                setTimeout(async () => {
                    await loadSwapRequestForChat(selectedChat);
                }, 2000);
            }

            return true;
        }

        return false;
    };

    const handleAcceptRequest = async (requestId) => {
        console.log('✅ Accepting request:', requestId);
        const success = await SupabaseHelpers.updateConversationType(requestId, 'common');

        if (success) {
            await loadConversations();
            setActiveSection('common');
            setSelectedChat(requestId);
            toast.success('Request accepted! Moved to Common section');
        } else {
            toast.error('Failed to accept request');
        }
    };

    const handleDeclineRequest = async (requestId) => {
        if (!window.confirm('Decline this connection request? This will permanently delete the conversation.')) {
            return;
        }

        console.log('❌ Declining request:', requestId);
        setDeclining(true);

        try {
            const result = await SupabaseHelpers.declineConnectionRequest(requestId, currentUser.id);

            if (result.success) {
                console.log('✅ Request declined and deleted permanently');
                
                setConversations(prev => ({
                    ...prev,
                    request: prev.request.filter(r => r.id !== requestId)
                }));
                
                setSelectedChat(null);
                toast.success('Request declined and deleted permanently');

            } else {
                throw new Error(result.error?.message || 'Failed to decline request');
            }

        } catch (err) {
            console.error('❌ Error declining request:', err);
            toast.error(err.message || 'Failed to decline request');
        } finally {
            setDeclining(false);
        }
    };

    const handleAcceptSwapRequest = async (requestId) => {
        if (!currentUser || !requestId) return;

        console.log('✅ Accepting swap request:', requestId);

        try {
            const result = await SupabaseHelpers.respondToSwapRequest(requestId, currentUser.id, true);

            if (result.success) {
                console.log('✅ Swap accepted successfully');

                setCurrentSwapRequest(null);
                setShowSwapModal(false);

                await loadConversations();

                const updatedConvs = await SupabaseHelpers.getConversations(currentUser.id);
                const swapConv = updatedConvs.swap.find(c =>
                    c.id === selectedChat ||
                    (currentSwapRequest && c.id === currentSwapRequest.conversationId)
                );

                setActiveSection('swap');
                if (swapConv) {
                    setSelectedChat(swapConv.id);
                }

                toast.success('Swap request accepted! Moved to Swap section');

            } else {
                throw new Error(result.error?.message || 'Failed to accept swap');
            }

        } catch (err) {
            console.error('❌ Error accepting swap:', err);
            toast.error(err.message || 'Failed to accept swap request');
        }
    };

    const handleDeclineSwapRequest = async (requestId) => {
        if (!currentUser || !requestId) return;

        console.log('❌ Declining swap request:', requestId);

        try {
            const result = await SupabaseHelpers.respondToSwapRequest(requestId, currentUser.id, false);

            if (result.success) {
                console.log('✅ Swap declined successfully');

                setCurrentSwapRequest(null);
                setShowSwapModal(false);

                await handleSendMessage("I've declined the swap request. Let's continue chatting here!");

                await loadConversations();

                toast.info('Swap request declined. Staying in Common section');

            } else {
                throw new Error(result.error?.message || 'Failed to decline swap');
            }

        } catch (err) {
            console.error('❌ Error declining swap:', err);
            toast.error(err.message || 'Failed to decline swap request');
        }
    };

    const handleIncomingCallClose = () => {
        console.log('📞 Incoming call closed');
        setIncomingCall(null);
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <Loader className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
                    <p className="text-white text-lg">Loading messages...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-white mb-4 text-lg">{error}</p>
                    <button
                        onClick={initializeData}
                        className="px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors font-semibold"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentChatData = conversations[activeSection].find(c => c.id === selectedChat);

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white ml-64">
            {/* Sidebar */}
            <Sidebar
                conversations={conversations}
                activeSection={activeSection}
                selectedChat={selectedChat}
                onSectionChange={(section) => {
                    setActiveSection(section);
                    setSelectedChat(null);
                    setCurrentSwapRequest(null);
                }}
                onChatSelect={(chatId) => {
                    setSelectedChat(chatId);
                }}
            />

            {/* Chat Window */}
            <ChatWindow
                currentChat={currentChatData}
                currentUser={currentUser}
                activeSection={activeSection}
                pendingSwapRequest={currentSwapRequest}
                onSendMessage={handleSendMessage}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onAcceptSwapRequest={handleAcceptSwapRequest}
                onDeclineSwapRequest={handleDeclineSwapRequest}
                onShowSwapModal={() => {
                    if (currentSwapRequest) {
                        setShowSwapModal(true);
                    }
                }}
                declining={declining}
                onRefreshConversations={loadConversations}
            />

            {/* Swap Request Modal */}
            {showSwapModal && currentSwapRequest && (
                <SwapRequestModal
                    request={currentSwapRequest}
                    onAccept={handleAcceptSwapRequest}
                    onDecline={handleDeclineSwapRequest}
                    onClose={() => setShowSwapModal(false)}
                    loading={false}
                />
            )}

            {/* Incoming Call Overlay */}
            {incomingCall && currentUser && (
                <CallSystem
                    conversationId={incomingCall.conversationId}
                    currentUser={currentUser}
                    otherUser={incomingCall.caller}
                    callType={incomingCall.callType}
                    isIncoming={true}
                    onClose={handleIncomingCallClose}
                />
            )}
        </div>
    );
}