// app/messages/components/TypingDebugPanel.jsx
// Add this temporarily to debug typing indicators

import React, { useState, useEffect } from 'react';
import { Bug, CheckCircle, XCircle } from 'lucide-react';

const TypingDebugPanel = ({ typingUsers, typingHandler, currentUser }) => {
    const [logs, setLogs] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), { message, type, timestamp }]);
    };

    useEffect(() => {
        // Monitor typing users changes
        if (typingUsers.length > 0) {
            addLog(`${typingUsers.length} user(s) typing`, 'success');
        }
    }, [typingUsers]);

    const testStartTyping = () => {
        if (typingHandler) {
            addLog('Testing START typing...', 'info');
            typingHandler.startTyping();
        } else {
            addLog('No typing handler available!', 'error');
        }
    };

    const testStopTyping = () => {
        if (typingHandler) {
            addLog('Testing STOP typing...', 'info');
            typingHandler.stopTyping();
        } else {
            addLog('No typing handler available!', 'error');
        }
    };

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 p-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full shadow-lg z-50"
                title="Show typing debug panel"
            >
                <Bug className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-slate-900 border-2 border-yellow-500 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-yellow-500 text-black px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    <span className="font-bold text-sm">Typing Debug</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="hover:bg-yellow-600 rounded px-2 py-1 text-xs"
                >
                    Hide
                </button>
            </div>

            {/* Status */}
            <div className="p-3 bg-slate-800 border-b border-slate-700">
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Handler:</span>
                        <span className={typingHandler ? 'text-green-400' : 'text-red-400'}>
                            {typingHandler ? '✓ Ready' : '✗ Not Ready'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Typing Users:</span>
                        <span className="text-white font-semibold">
                            {typingUsers.length}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Current User:</span>
                        <span className="text-white truncate max-w-[150px]">
                            {currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0] || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Test Buttons */}
            <div className="p-3 bg-slate-800 border-b border-slate-700">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={testStartTyping}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold"
                    >
                        Start Typing
                    </button>
                    <button
                        onClick={testStopTyping}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold"
                    >
                        Stop Typing
                    </button>
                </div>
            </div>

            {/* Typing Users Display */}
            {typingUsers.length > 0 && (
                <div className="p-3 bg-purple-500/20 border-b border-purple-500/30">
                    <p className="text-xs text-purple-300 font-semibold mb-2">Currently Typing:</p>
                    {typingUsers.map((user, idx) => (
                        <div key={idx} className="text-xs text-white flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[0, 1, 2].map(i => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                            <span>{user.username}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Logs */}
            <div className="p-3 bg-slate-900 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-400 font-semibold mb-2">Activity Log:</p>
                {logs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No activity yet</p>
                ) : (
                    <div className="space-y-1">
                        {logs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className="text-gray-500 flex-shrink-0">
                                    {log.timestamp}
                                </span>
                                <span className={
                                    log.type === 'success' ? 'text-green-400' :
                                    log.type === 'error' ? 'text-red-400' :
                                    'text-white'
                                }>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear Button */}
            <div className="p-2 bg-slate-800 border-t border-slate-700">
                <button
                    onClick={() => setLogs([])}
                    className="w-full px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                >
                    Clear Logs
                </button>
            </div>
        </div>
    );
};

export default TypingDebugPanel;

// ===== HOW TO USE =====
// 1. Import in ChatWindow.jsx:
//    import TypingDebugPanel from './TypingDebugPanel';
//
// 2. Add before the closing </div> in ChatWindow:
//    <TypingDebugPanel 
//        typingUsers={typingUsers}
//        typingHandler={typingHandlerRef.current}
//        currentUser={currentUser}
//    />
//
// 3. Test by:
//    - Click the yellow bug button
//    - Click "Start Typing" - other users should see typing indicator
//    - Click "Stop Typing" - indicator should disappear
//    - Type in message box - should auto-start typing
//    - Send message - should auto-stop typing
//
// 4. Remove after testing is complete!