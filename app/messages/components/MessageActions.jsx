// app/messages/components/MessageActions.jsx
// ✅ WhatsApp-style message actions with proper dropdown

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Copy, Reply, Forward, Star } from 'lucide-react';

const MessageActions = ({ message, currentUserId, onEdit, onDelete, onReply }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // Can only edit/delete own messages
    const isMyMessage = message.senderId === currentUserId;
    const canEdit = isMyMessage && 
                    !message.deletedAt &&
                    (Date.now() - new Date(message.timestamp).getTime() < 15 * 60 * 1000); // 15 min
    const canDelete = isMyMessage && !message.deletedAt;

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setShowMenu(false);
    };

    const handleEdit = () => {
        if (canEdit) {
            onEdit(message);
        }
        setShowMenu(false);
    };

    const handleDelete = () => {
        if (canDelete) {
            onDelete(message);
        }
        setShowMenu(false);
    };

    const handleReply = () => {
        onReply(message);
        setShowMenu(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1 rounded transition-all ${
                    showMenu 
                        ? 'bg-white/20 opacity-100' 
                        : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'
                }`}
            >
                <MoreVertical className="w-4 h-4 text-white" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className={`absolute ${
                    message.sender === 'me' ? 'right-full mr-2' : 'left-full ml-2'
                } top-0 bg-slate-800 border border-purple-500/30 rounded-lg shadow-2xl py-1 z-50 min-w-[180px] animate-fadeIn`}>
                    
                    {/* Reply */}
                    <button
                        onClick={handleReply}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-white transition-colors"
                    >
                        <Reply className="w-4 h-4 text-blue-400" />
                        <span>Reply</span>
                    </button>

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-white transition-colors"
                    >
                        <Copy className="w-4 h-4 text-gray-400" />
                        <span>Copy text</span>
                    </button>

                    {/* Edit (only for own messages within 15 min) */}
                    {canEdit && (
                        <>
                            <div className="border-t border-purple-500/20 my-1" />
                            <button
                                onClick={handleEdit}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-blue-400 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                        </>
                    )}

                    {/* Delete (only for own messages) */}
                    {canDelete && (
                        <>
                            <div className="border-t border-purple-500/20 my-1" />
                            <button
                                onClick={handleDelete}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/20 flex items-center gap-3 text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </>
                    )}

                    {/* Info text */}
                    {isMyMessage && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-purple-500/20 mt-1">
                            {canEdit ? 'Edit within 15 minutes' : 'Edit time expired'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageActions;

// Add this CSS to your global styles or Tailwind config
const styles = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.15s ease-out;
}
`;

