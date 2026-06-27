// app/messages/components/MessageInput.jsx
// ✅ FIXED - Users can send normal messages during cooldown, only swap keywords blocked

import React, { useRef, useEffect, useState } from 'react';
import { Send, Smile, Paperclip, X, Edit2, Reply, AlertTriangle } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUploadModal from './FileUploadModal';
import MessageHelpers from './MessageHelpers';

const MessageInput = ({
    message,
    setMessage,
    handleSend,
    currentChat,
    activeSection,
    cooldownInfo,
    isBlocked,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    onFileUploaded,
    typingHandler
}) => {
    const textareaRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [swapKeywordWarning, setSwapKeywordWarning] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [message]);

    // Focus on textarea when editing or replying
    useEffect(() => {
        if ((editingMessage || replyingTo) && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [editingMessage, replyingTo]);

    // ⭐ NEW: Check for swap keywords in real-time
    useEffect(() => {
        if (isBlocked && message.trim() && activeSection === 'common') {
            const hasKeywords = MessageHelpers.hasSwapKeywords(message);
            setSwapKeywordWarning(hasKeywords);
        } else {
            setSwapKeywordWarning(false);
        }
    }, [message, isBlocked, activeSection]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessage(value);

        // Typing indicator
        if (typingHandler && value.trim()) {
            typingHandler.startTyping();
        } else if (typingHandler && !value.trim()) {
            typingHandler.stopTyping();
        }
    };

    // Insert emoji at cursor position
    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = message;
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        const newText = before + emoji + after;
        setMessage(newText);

        // Set cursor position after emoji
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setMessage('');
        if (typingHandler) {
            typingHandler.stopTyping();
        }
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    // ⭐ NEW: Check if message contains swap keywords
    const messageHasSwapKeywords = message.trim() && MessageHelpers.hasSwapKeywords(message);
    
    // ⭐ NEW: Determine if send should be blocked
    const shouldBlockSend = isBlocked && messageHasSwapKeywords && activeSection === 'common';

    return (
        <>
            <div className="border-t border-purple-500/20 bg-slate-900/50 backdrop-blur-xl p-4 flex-shrink-0">
                {/* ⭐ IMPROVED: Cooldown Warning - Only shows for swap keywords */}
                {cooldownInfo && swapKeywordWarning && (
                    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-300 font-semibold mb-1">
                                    ⚠️ {cooldownInfo.message}
                                </p>
                                {cooldownInfo.remainingHours && (
                                    <p className="text-xs text-yellow-400">
                                        Try again in {cooldownInfo.remainingHours} hours
                                    </p>
                                )}
                                <p className="text-xs text-yellow-200 mt-2">
                                    💡 You can still send normal messages without swap keywords
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Editing Indicator */}
                {editingMessage && (
                    <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-300">
                                Editing message
                            </span>
                        </div>
                        <button
                            onClick={cancelEditing}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Reply Indicator */}
                {replyingTo && (
                    <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Reply className="w-4 h-4 text-purple-400" />
                            <div>
                                <p className="text-xs text-purple-400">
                                    Replying to {replyingTo.senderName || 'message'}
                                </p>
                                <p className="text-sm text-purple-300 truncate max-w-xs">
                                    {replyingTo.text}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={cancelReply}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-end gap-2">
                    {/* Emoji Button */}
                    <button
                        ref={emojiButtonRef}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2.5 rounded-lg transition-all flex-shrink-0 self-end mb-1 ${
                            showEmojiPicker 
                                ? 'bg-purple-500 text-white' 
                                : 'hover:bg-slate-700/50 text-gray-400 hover:text-gray-300'
                        }`}
                        title="Emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                editingMessage 
                                    ? "Edit your message..."
                                    : "Type a message..."
                            }
                            className={`w-full bg-slate-800/50 text-white px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 placeholder-gray-500 transition-all ${
                                shouldBlockSend 
                                    ? 'focus:ring-yellow-500/50 border border-yellow-500/30' 
                                    : 'focus:ring-purple-500/50'
                            }`}
                            rows={1}
                            style={{
                                maxHeight: '120px',
                                minHeight: '44px'
                            }}
                        />
                        
                        {/* ⭐ NEW: Inline warning for swap keywords */}
                        {swapKeywordWarning && (
                            <div className="absolute -bottom-6 left-0 right-0 flex items-center gap-1 text-xs text-yellow-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Swap keywords detected - message blocked</span>
                            </div>
                        )}
                    </div>

                    {/* File Upload Button */}
                    <button
                        onClick={() => setShowFileModal(true)}
                        className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-all flex-shrink-0 self-end mb-1 text-gray-400 hover:text-gray-300"
                        title="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || shouldBlockSend}
                        className={`p-3 rounded-xl transition-all flex-shrink-0 self-end mb-1 ${
                            message.trim() && !shouldBlockSend
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                        }`}
                        title={
                            shouldBlockSend 
                                ? "Swap requests blocked - remove swap keywords to send" 
                                : editingMessage 
                                ? "Save changes" 
                                : "Send message"
                        }
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Helper Text */}
                {!cooldownInfo && activeSection === 'common' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        💡 Use words like "swap", "exchange", or "trade" to request a professional swap
                    </p>
                )}
                
                {/* ⭐ NEW: Cooldown info text */}
                {cooldownInfo && !swapKeywordWarning && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        ℹ️ You can send normal messages - swap requests are temporarily blocked
                    </p>
                )}
            </div>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
                <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                    buttonRef={emojiButtonRef}
                />
            )}

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showFileModal}
                onClose={() => setShowFileModal(false)}
                onFileUploaded={onFileUploaded}
                conversationId={currentChat?.id}
            />
        </>
    );
};

export default MessageInput;