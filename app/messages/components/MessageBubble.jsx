// app/messages/components/MessageBubble.jsx
// ✅ FIXED - Fully responsive with proper text wrapping and no horizontal scroll

import React from 'react';
import { Check, Star, File, CornerDownRight } from 'lucide-react';
import MessageActions from './MessageActions';
import MessageHelpers from './MessageHelpers';

const MessageBubble = ({ 
    msg, 
    currentUser,
    currentChat,
    onEdit, 
    onDelete, 
    onReply 
}) => {
    const isMyMessage = msg.sender === 'me';
    const isDeleted = msg.deletedAt;
    const otherUsername = currentChat?.user?.name || 'User';
    
    return (
        <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group mb-3 px-2`}>
            <div className={`flex gap-2 items-end max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Message Actions Dropdown */}
                <MessageActions
                    message={msg}
                    currentUserId={currentUser.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                />
                
                {/* Message Bubble */}
                <div
                    className={`px-3 py-2 rounded-2xl relative break-words ${
                        isMyMessage
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                            : 'bg-slate-800 text-white rounded-bl-md'
                    } ${msg.hasKeywords ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-slate-900' : ''} ${
                        isDeleted ? 'opacity-60' : ''
                    }`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                    {/* Reply Preview */}
                    {msg.replyTo && (
                        <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                            isMyMessage 
                                ? 'bg-white/10 border-white/30' 
                                : 'bg-white/5 border-purple-500/50'
                        }`}>
                            <div className="flex items-center gap-1 mb-1">
                                <CornerDownRight className="w-3 h-3 opacity-60 flex-shrink-0" />
                                <p className="text-xs opacity-80 font-semibold truncate">
                                    {msg.replyTo.sender === 'me' ? 'You' : `@${otherUsername}`}
                                </p>
                            </div>
                            <p className={`text-xs opacity-70 line-clamp-2 ${
                                msg.replyTo.isDeleted ? 'italic' : ''
                            }`}
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                            >
                                {msg.replyTo.isDeleted && '🚫 '}
                                {msg.replyTo.fileName ? `📎 ${msg.replyTo.fileName}` : msg.replyTo.text}
                            </p>
                        </div>
                    )}

                    {/* Message Content */}
                    <div className="whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {isDeleted ? (
                            <span className="flex items-center gap-2">
                                <span className="opacity-50">🚫</span>
                                <span className="italic">This message was deleted</span>
                            </span>
                        ) : (
                            msg.text
                        )}
                    </div>

                    {/* File Attachment */}
                    {msg.fileUrl && !isDeleted && (
                        <div className="mt-2 max-w-full">
                            {msg.fileType?.startsWith('image/') ? (
                                <div className="rounded-lg overflow-hidden">
                                    <img
                                        src={msg.fileUrl}
                                        alt={msg.fileName}
                                        loading="lazy"
                                        className="max-w-full h-auto max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                                        onClick={() => window.open(msg.fileUrl, '_blank')}
                                    />
                                </div>
                            ) : msg.fileType?.startsWith('video/') ? (
                                <div className="rounded-lg overflow-hidden">
                                    <video
                                        src={msg.fileUrl}
                                        controls
                                        className="max-w-full h-auto max-h-[300px] rounded-lg"
                                    >
                                        Your browser doesn't support video playback.
                                    </video>
                                </div>
                            ) : (
                                <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors ${
                                        isMyMessage ? 'bg-white/10' : 'bg-white/5'
                                    }`}
                                >
                                    <File className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span className="text-sm truncate flex-1 min-w-0">
                                        {msg.fileName}
                                    </span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* Swap Keywords Badge */}
                    {msg.hasKeywords && !isDeleted && (
                        <div className={`mt-2 inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 ${
                            isMyMessage
                                ? 'text-blue-200 bg-blue-500/30'
                                : 'text-purple-200 bg-purple-500/30'
                        }`}>
                            <Star className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">Swap keywords detected</span>
                        </div>
                    )}

                    {/* Message Footer (Time + Status) */}
                    <div className="flex items-center justify-end gap-1 mt-1 flex-wrap">
                        {/* Edited indicator */}
                        {msg.editedAt && !isDeleted && (
                            <span className="text-xs opacity-60 whitespace-nowrap">edited</span>
                        )}
                        
                        {/* Timestamp */}
                        <span className="text-xs opacity-70 whitespace-nowrap">
                            {MessageHelpers.formatTime(msg.timestamp)}
                        </span>
                        
                        {/* Read receipts (for own messages only) */}
                        {isMyMessage && !isDeleted && (
                            <div className="flex flex-shrink-0">
                                <Check 
                                    className={`w-3 h-3 ${
                                        msg.read ? 'text-blue-400' : 'text-gray-400'
                                    }`} 
                                />
                                {msg.read && (
                                    <Check className="w-3 h-3 text-blue-400 -ml-2" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;