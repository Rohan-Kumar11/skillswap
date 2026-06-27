// app/messages/components/EmojiPicker.jsx
// WhatsApp-style emoji picker with categories and search

import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Smile, Users, Zap, Coffee, Plane, Lightbulb, Hash, Flag, X } from 'lucide-react';

const EmojiPicker = ({ onEmojiSelect, onClose, buttonRef }) => {
    const [activeCategory, setActiveCategory] = useState('smileys');
    const [searchQuery, setSearchQuery] = useState('');
    const [recentEmojis, setRecentEmojis] = useState([]);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const pickerRef = useRef(null);

    // Emoji categories
    const categories = [
        { id: 'recent', label: 'Recent', icon: Clock },
        { id: 'smileys', label: 'Smileys', icon: Smile },
        { id: 'people', label: 'People', icon: Users },
        { id: 'animals', label: 'Animals', icon: Zap },
        { id: 'food', label: 'Food', icon: Coffee },
        { id: 'travel', label: 'Travel', icon: Plane },
        { id: 'objects', label: 'Objects', icon: Lightbulb },
        { id: 'symbols', label: 'Symbols', icon: Hash },
        { id: 'flags', label: 'Flags', icon: Flag },
    ];

    // Emoji data (subset - in production, use full emoji dataset)
    const emojiData = {
        smileys: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
            '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
            '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
            '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
            '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
            '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
        ],
        people: [
            '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
            '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
            '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
            '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷',
        ],
        animals: [
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
            '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
            '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
            '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
        ],
        food: [
            '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
            '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
            '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞',
            '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖',
        ],
        travel: [
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
            '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔',
            '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝',
            '✈️', '🛫', '🛬', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥',
        ],
        objects: [
            '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹',
            '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽',
            '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛',
            '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡',
        ],
        symbols: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
            '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
            '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
        ],
        flags: [
            '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏴‍☠️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱',
            '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼',
            '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿',
        ],
    };

    // Load recent emojis from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentEmojis');
        if (stored) {
            try {
                setRecentEmojis(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recent emojis');
            }
        }
    }, []);

    // Calculate position relative to button
    useEffect(() => {
        if (buttonRef?.current && pickerRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const pickerHeight = 400;
            const pickerWidth = 350;
            
            // Position above button, aligned to left
            setPosition({
                bottom: window.innerHeight - buttonRect.top + 8,
                left: buttonRect.left,
            });
        }
    }, [buttonRef]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target) &&
                buttonRef?.current && !buttonRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, buttonRef]);

    const handleEmojiClick = (emoji) => {
        // Add to recent
        const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 30);
        setRecentEmojis(newRecent);
        localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
        
        // Send to parent
        onEmojiSelect(emoji);
    };

    // Filter emojis based on search
    const getFilteredEmojis = () => {
        if (activeCategory === 'recent') {
            return searchQuery ? recentEmojis : recentEmojis;
        }
        
        const emojis = emojiData[activeCategory] || [];
        return searchQuery ? emojis : emojis;
    };

    const filteredEmojis = getFilteredEmojis();

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[998]" onClick={onClose} />
            
            {/* Picker */}
            <div
                ref={pickerRef}
                className="fixed w-[350px] h-[400px] bg-slate-800 border border-purple-500/30 rounded-xl shadow-2xl z-[999] flex flex-col overflow-hidden"
                style={{
                    bottom: `${position.bottom}px`,
                    left: `${position.left}px`,
                }}
            >
                {/* Search */}
                <div className="p-3 border-b border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search emoji..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-700 overflow-x-auto">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                    activeCategory === cat.id
                                        ? 'bg-purple-500 text-white'
                                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                                }`}
                                title={cat.label}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>

                {/* Emoji Grid */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredEmojis.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <Smile className="w-12 h-12 text-gray-600 mb-2" />
                            <p className="text-gray-400 text-sm">
                                {activeCategory === 'recent' 
                                    ? 'No recent emojis yet' 
                                    : 'No emojis found'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-8 gap-1">
                            {filteredEmojis.map((emoji, idx) => (
                                <button
                                    key={`${emoji}-${idx}`}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-700 rounded-lg transition-all hover:scale-125"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EmojiPicker;