// ============================================
// PART 1: IMPORTS, SUPABASE CLIENT, AND HELPERS
// ============================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Send, Paperclip, Mic, Video, Phone, MoreVertical,
    Smile, Check, Calendar, Award, X, Users, Star,
    Search, Settings, ArrowRight, Loader, AlertCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// SUPABASE HELPERS
// ============================================
const SupabaseHelpers = {
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
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
            
            // Get last message
            const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, created_at, sender_id, has_swap_keywords')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get unread count using helper function
            const unreadCount = await this.getUnreadCount(conv.id, userId);

            const conversation = {
                id: conv.id,
                user: {
                    id: otherUser.id,
                    name: otherUser.full_name || otherUser.username,
                    avatar: otherUser.profile_pic || '👤',
                    skillsOffered: otherUser.skills_offered || [],
                    skillsWanted: otherUser.skills_wanted || [],
                    online: otherUser.last_seen_at ? 
                        (new Date() - new Date(otherUser.last_seen_at) < 300000) : false,
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

    async getMessages(conversationId, userId) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(username, profile_pic)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        // Get read receipts for all messages
        const messageIds = data.map(m => m.id);
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

        return data.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === userId ? 'me' : 'them',
            timestamp: msg.created_at,
            read: msg.sender_id === userId && 
                  readReceiptsMap[msg.id]?.some(uid => uid !== msg.sender_id),
            hasKeywords: msg.has_swap_keywords
        }));
    },

    async sendMessage(conversationId, userId, content) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content: content
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return null;
        }

        return data;
    },

    async markAsRead(conversationId, userId) {
        const { error } = await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: conversationId,
            p_user_id: userId
        });

        if (error) {
            console.error('Error marking as read:', error);
        }
    },

    async upgradeToSwap(conversationId) {
        const { error } = await supabase
            .from('conversations')
            .update({
                type: 'swap',
                agreement_created: true,
                agreement_hours: 10,
                agreement_progress: 0,
                agreement_start_date: new Date().toISOString()
            })
            .eq('id', conversationId);

        if (error) {
            console.error('Error upgrading to swap:', error);
            return false;
        }

        return true;
    },

    async updateConversationType(conversationId, newType) {
        const { error } = await supabase
            .from('conversations')
            .update({ type: newType })
            .eq('id', conversationId);

        if (error) {
            console.error('Error updating conversation type:', error);
            return false;
        }

        return true;
    },

    subscribeToMessages(conversationId, callback) {
        const subscription = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, callback)
            .subscribe();

        return subscription;
    },

    subscribeToConversations(userId, callback) {
        const subscription = supabase
            .channel(`conversations:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations'
            }, callback)
            .subscribe();

        return subscription;
    }
};

// ============================================
// MESSAGE HELPERS
// ============================================
const MessageHelpers = {
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    getUnreadCount(conversations) {
        return conversations.reduce((count, chat) => count + (chat.unreadCount || 0), 0);
    }
};

// ============================================
// UPGRADE MODAL COMPONENT
// ============================================
const UpgradeModal = ({ onUpgrade, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 md:p-8 max-w-md w-full border border-purple-500/30">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <ArrowRight className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Upgrade to Professional Swap?
                    </h3>
                    <p className="text-gray-400 text-sm">
                        This conversation contains skill exchange keywords. Move it to the Swap section!
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    {[
                        { icon: Calendar, title: 'Session Scheduling', desc: 'Built-in calendar with reminders' },
                        { icon: Award, title: 'Progress Tracking', desc: 'Track hours and agreements' },
                        { icon: Video, title: 'Pro Video Calls', desc: 'HD video with screen sharing' }
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20">
                            <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                                <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Not Now
                    </button>
                    <button
                        onClick={onUpgrade}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Upgrade
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// END OF PART 1
// Continue to Part 2 for ChatWindow, Sidebar, and Main Container
// ============================================
// ============================================
// PART 2: REACT COMPONENTS (ChatWindow, Sidebar, Main Container)
// ============================================
// This continues from Part 1

// ============================================
// CHAT WINDOW COMPONENT
// ============================================
const ChatWindow = ({ currentChat, currentUser, activeSection, onSendMessage, onAcceptRequest, onDeclineRequest }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (currentChat && currentUser) {
            loadMessages();
            SupabaseHelpers.markAsRead(currentChat.id, currentUser.id);
        }
    }, [currentChat?.id]);

    useEffect(() => {
        if (!currentChat || !currentUser) return;

        const subscription = SupabaseHelpers.subscribeToMessages(
            currentChat.id,
            (payload) => {
                const newMessage = {
                    id: payload.new.id,
                    text: payload.new.content,
                    sender: payload.new.sender_id === currentUser.id ? 'me' : 'them',
                    timestamp: payload.new.created_at,
                    read: false,
                    hasKeywords: payload.new.has_swap_keywords
                };
                setMessages(prev => [...prev, newMessage]);
                
                if (payload.new.sender_id !== currentUser.id) {
                    SupabaseHelpers.markAsRead(currentChat.id, currentUser.id);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [currentChat?.id, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        setLoading(true);
        const msgs = await SupabaseHelpers.getMessages(currentChat.id, currentUser.id);
        setMessages(msgs);
        setLoading(false);
    };

    const handleSend = async () => {
        if (!message.trim()) return;
        
        const sent = await onSendMessage(message);
        if (sent) {
            setMessage('');
        }
    };

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
        <div className="flex-1 flex flex-col bg-slate-900/30">
            {/* Chat Header */}
            <div className="p-4 bg-slate-900/50 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                            {currentChat.user.avatar}
                        </div>
                        {currentChat.user.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">{currentChat.user.name}</h2>
                        <p className="text-xs text-gray-400">
                            {currentChat.user.online ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {activeSection !== 'request' && (
                        <>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                                <Phone className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                                <Video className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader className="w-8 h-8 animate-spin text-purple-400" />
                    </div>
                ) : activeSection === 'request' ? (
                    <div className="max-w-2xl mx-auto mt-8">
                        <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl p-6 border border-orange-500/30">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-3xl">
                                    {currentChat.user.avatar}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2 text-white">{currentChat.user.name}</h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-green-400">✓ Offers: {currentChat.user.skillsOffered.join(', ')}</p>
                                        <p className="text-blue-400">→ Wants: {currentChat.user.skillsWanted.join(', ')}</p>
                                    </div>
                                </div>
                            </div>
                            {currentChat.lastMessage && (
                                <div className="bg-black/20 rounded-lg p-4 mb-4">
                                    <p className="text-white">{currentChat.lastMessage.text}</p>
                                    <p className="text-xs text-gray-400 mt-2">{MessageHelpers.formatTime(currentChat.lastMessage.timestamp)}</p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onAcceptRequest(currentChat.id)}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Accept
                                </button>
                                <button
                                    onClick={() => onDeclineRequest(currentChat.id)}
                                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeSection === 'swap' && currentChat.agreement && (
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30 mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                    <span className="font-semibold text-white">Professional Exchange Active</span>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-300">
                                    <div>
                                        <span className="text-gray-400">Progress:</span>
                                        <span className="ml-2 font-semibold">{currentChat.agreement.progress}/{currentChat.agreement.hours} hours</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-md px-4 py-2 rounded-2xl ${
                                        msg.sender === 'me'
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                            : 'bg-slate-800 text-white'
                                    } ${msg.hasKeywords ? 'ring-2 ring-purple-400' : ''}`}
                                >
                                    <p>{msg.text}</p>
                                    {msg.hasKeywords && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-purple-300">
                                            <Star className="w-3 h-3" />
                                            <span>Swap keyword detected</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-xs opacity-70">{MessageHelpers.formatTime(msg.timestamp)}</span>
                                        {msg.sender === 'me' && (
                                            <div className="flex">
                                                <Check className={`w-3 h-3 ${msg.read ? 'text-blue-400' : 'text-gray-400'}`} />
                                                {msg.read && <Check className="w-3 h-3 text-blue-400 -ml-2" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 px-4 py-3 rounded-2xl">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <span
                                                key={i}
                                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            {activeSection !== 'request' && (
                <div className="p-4 bg-slate-900/50 backdrop-blur-xl border-t border-purple-500/20">
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                            <Smile className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg focus:outline-none focus:border-purple-500/50 transition-colors text-white placeholder-gray-500"
                        />
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                            <Mic className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar = ({ conversations, activeSection, selectedChat, onSectionChange, onChatSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { key: 'request', label: 'Requests', color: 'orange' },
        { key: 'common', label: 'Common', color: 'blue' },
        { key: 'swap', label: 'Swap', color: 'purple' }
    ];

    const filteredChats = conversations[activeSection].filter(chat =>
        chat.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-purple-500/20 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Messages
                    </h1>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg focus:outline-none focus:border-purple-500/50 text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-purple-500/20">
                {sections.map(section => {
                    const count = MessageHelpers.getUnreadCount(conversations[section.key]);
                    return (
                        <button
                            key={section.key}
                            onClick={() => {
                                onSectionChange(section.key);
                                onChatSelect(null);
                            }}
                            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                                activeSection === section.key ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {section.label}
                            {count > 0 && (
                                <span className={`absolute top-1 right-2 px-1.5 py-0.5 text-xs rounded-full ${
                                    section.color === 'orange' ? 'bg-orange-500' :
                                    section.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}>
                                    {count}
                                </span>
                            )}
                            {activeSection === section.key && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                                    section.color === 'orange' ? 'bg-orange-500' :
                                    section.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                                }`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                    <div
                        key={chat.id}
                        onClick={() => onChatSelect(chat.id)}
                        className={`p-4 cursor-pointer transition-all border-b border-purple-500/10 ${
                            selectedChat === chat.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
                        }`}
                    >
                        <div className="flex gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                    {chat.user.avatar}
                                </div>
                                {chat.user.online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold truncate text-white">{chat.user.name}</h3>
                                    {chat.lastMessage && (
                                        <span className="text-xs text-gray-400">{MessageHelpers.formatTime(chat.lastMessage.timestamp)}</span>
                                    )}
                                </div>
                                {activeSection === 'request' ? (
                                    <p className="text-sm text-gray-400 truncate">
                                        Offers: {chat.user.skillsOffered.join(', ')}
                                    </p>
                                ) : chat.lastMessage ? (
                                    <p className="text-sm text-gray-400 truncate">{chat.lastMessage.text}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No messages yet</p>
                                )}
                                {chat.unreadCount > 0 && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                                        {chat.unreadCount} new
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN MESSAGE CONTAINER
// ============================================
const MessageContainer = () => {
    const [activeSection, setActiveSection] = useState('common');
    const [selectedChat, setSelectedChat] = useState(null);
    const [conversations, setConversations] = useState({ request: [], common: [], swap: [] });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [pendingUpgrade, setPendingUpgrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const subscription = SupabaseHelpers.subscribeToConversations(
            currentUser.id,
            () => {
                loadConversations();
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUser]);

    const initializeData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const user = await SupabaseHelpers.getCurrentUser();
            setCurrentUser(user);
            
            const convs = await SupabaseHelpers.getConversations(user.id);
            setConversations(convs);
        } catch (err) {
            console.error('Error initializing:', err);
            setError('Failed to load messages. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const loadConversations = async () => {
        if (!currentUser) return;
        const convs = await SupabaseHelpers.getConversations(currentUser.id);
        setConversations(convs);
    };

    const handleSendMessage = async (message) => {
        if (!message.trim() || !selectedChat || !currentUser) return false;

        const sent = await SupabaseHelpers.sendMessage(selectedChat, currentUser.id, message);
        
        if (sent && sent.has_swap_keywords && activeSection === 'common') {
            setTimeout(() => {
                setPendingUpgrade({ chatId: selectedChat, section: activeSection });
                setShowUpgradeModal(true);
            }, 500);
        }

        return !!sent;
    };

    const acceptRequest = async (requestId) => {
        const success = await SupabaseHelpers.updateConversationType(requestId, 'common');
        if (success) {
            await loadConversations();
            setActiveSection('common');
            setSelectedChat(requestId);
        }
    };

    const declineRequest = async (requestId) => {
        // In a real app, you might want to delete the conversation or mark it as declined
        // For now, we'll just remove it from the UI
        setConversations(prev => ({
            ...prev,
            request: prev.request.filter(r => r.id !== requestId)
        }));
        setSelectedChat(null);
    };

    const upgradeToSwap = async () => {
        if (!pendingUpgrade) return;

        const success = await SupabaseHelpers.upgradeToSwap(pendingUpgrade.chatId);
        
        if (success) {
            await loadConversations();
            setActiveSection('swap');
            setSelectedChat(pendingUpgrade.chatId);
        }

        setShowUpgradeModal(false);
        setPendingUpgrade(null);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <Loader className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
                    <p className="text-white">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-white mb-4">{error}</p>
                    <button
                        onClick={initializeData}
                        className="px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    
        return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white ml-64">
            <Sidebar
                conversations={conversations}
                activeSection={activeSection}
                selectedChat={selectedChat}
                onSectionChange={setActiveSection}
                onChatSelect={setSelectedChat}
            />

            <ChatWindow
                currentChat={conversations[activeSection].find(c => c.id === selectedChat)}
                currentUser={currentUser}
                activeSection={activeSection}
                onSendMessage={handleSendMessage}
                onAcceptRequest={acceptRequest}
                onDeclineRequest={declineRequest}
            />

            {showUpgradeModal && (
                <UpgradeModal
                    onUpgrade={upgradeToSwap}
                    onClose={() => {
                        setShowUpgradeModal(false);
                        setPendingUpgrade(null);
                    }}
                />
            )}
        </div>
    );
};

// ============================================
// EXPORT
// ============================================
export default MessageContainer;
