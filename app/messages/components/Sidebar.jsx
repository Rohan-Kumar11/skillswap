// app/messages/components/Sidebar.jsx
// ✅ FIXED - Proper online status display

import React, { useState } from 'react';
import { Search, Settings, Users, Zap, Award, Star } from 'lucide-react';
import { SafeAvatar } from '../../components/SafeAvatar';
import MessageHelpers from './MessageHelpers';

const Sidebar = ({ conversations, activeSection, selectedChat, onSectionChange, onChatSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { key: 'request', label: 'Requests', color: 'orange', icon: Users },
        { key: 'common', label: 'Common', color: 'blue', icon: Users },
        { key: 'swap', label: 'Swap', color: 'purple', icon: Zap }
    ];

    const filteredChats = conversations[activeSection].filter(chat =>
        chat.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-purple-500/20 flex flex-col h-full">
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

                {/* Search */}
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
                    const Icon = section.icon;
                    return (
                        <button
                            key={section.key}
                            onClick={() => {
                                onSectionChange(section.key);
                                onChatSelect(null);
                            }}
                            className={`flex-1 py-3 px-2 text-sm font-medium transition-all relative ${
                                activeSection === section.key ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <Icon className="w-4 h-4" />
                                <span>{section.label}</span>
                            </div>
                            {count > 0 && (
                                <span className={`absolute top-1 right-2 px-1.5 py-0.5 text-xs rounded-full font-bold ${
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
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                            <Users className="w-10 h-10 text-purple-400" />
                        </div>
                        <p className="text-gray-400 text-sm">No conversations yet</p>
                        <p className="text-gray-500 text-xs mt-2">
                            {activeSection === 'request' && 'Connection requests will appear here'}
                            {activeSection === 'common' && 'Start chatting with someone'}
                            {activeSection === 'swap' && 'Professional swaps will appear here'}
                        </p>
                    </div>
                ) : (
                    filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onChatSelect(chat.id)}
                            className={`p-4 cursor-pointer transition-all border-b border-purple-500/10 ${
                                selectedChat === chat.id
                                    ? 'bg-purple-500/20 border-l-4 border-l-purple-500'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            <div className="flex gap-3">
                                {/* Avatar with online indicator */}
                                <SafeAvatar
                                    user={{
                                        username: chat.user.name,
                                        full_name: chat.user.fullName,
                                        profile_pic: chat.user.profilePic
                                    }}
                                    size="md"
                                    online={chat.user.online}
                                    showBadge={activeSection === 'swap'}
                                    badgeIcon={activeSection === 'swap' ? <Zap className="w-3 h-3 text-white" /> : null}
                                    ringColor="ring-purple-500/30"
                                />

                                {/* Chat Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold truncate text-white">{chat.user.name}</h3>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                {MessageHelpers.formatTime(chat.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    {/* ✅ IMPROVED: Status display with better formatting */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-xs font-medium ${
                                            chat.user.online 
                                                ? 'text-green-400' 
                                                : 'text-gray-400'
                                        }`}>
                                            {chat.user.statusText || (chat.user.online ? '🟢 Online' : 'Offline')}
                                        </p>
                                    </div>

                                    {/* Section-specific content */}
                                    {activeSection === 'request' ? (
                                        <div className="space-y-1">
                                            <p className="text-xs text-green-400 truncate">
                                                ✓ {chat.user.skillsOffered?.join(', ') || 'No skills'}
                                            </p>
                                            <p className="text-xs text-blue-400 truncate">
                                                → {chat.user.skillsWanted?.join(', ') || 'No wants'}
                                            </p>
                                        </div>
                                    ) : activeSection === 'swap' && chat.agreement ? (
                                        <div className="flex items-center gap-2">
                                            <Award className="w-3 h-3 text-yellow-400" />
                                            <p className="text-xs text-gray-400">
                                                {chat.agreement.progress}/{chat.agreement.hours} hours
                                            </p>
                                        </div>
                                    ) : chat.lastMessage ? (
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-400 truncate flex-1">
                                                {chat.lastMessage.sender === 'me' && 'You: '}
                                                {chat.lastMessage.text}
                                            </p>
                                            {chat.lastMessage.hasKeywords && activeSection === 'common' && (
                                                <Star className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                                    )}

                                    {/* Unread badge */}
                                    {chat.unreadCount > 0 && (
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-500 rounded-full font-semibold">
                                            {chat.unreadCount} new
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Sidebar;