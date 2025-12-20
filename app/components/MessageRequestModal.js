"use client";

import { useState } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function MessageRequestModal({ isOpen, onClose, targetUser, currentUserId }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendRequest = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('message_requests')
        .select('id, status')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', targetUser.id)
        .single();

      if (existing) {
        if (existing.status === 'pending') {
          setError('You already have a pending request to this user');
          setIsLoading(false);
          return;
        } else if (existing.status === 'accepted') {
          setError('You already have an active conversation with this user');
          setIsLoading(false);
          return;
        }
      }

      // Send message request
      const { error: requestError } = await supabase
        .from('message_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUser.id,
          message: message.trim(),
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUser.id,
          type: 'message_request',
          title: 'New Message Request',
          message: `${targetUser.username || 'Someone'} wants to connect with you`,
          reference_id: currentUserId,
          is_read: false
        });

      // Success
      alert('Message request sent successfully! 🎉');
      onClose();
      setMessage('');
    } catch (err) {
      console.error('Error sending message request:', err);
      setError('Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Send Message Request</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
            <img
              src={targetUser?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.username}`}
              alt={targetUser?.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900">{targetUser?.full_name}</h3>
              <p className="text-gray-600">@{targetUser?.username}</p>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Introduce yourself
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd like to connect with you..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-900"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSendRequest}
              disabled={isLoading || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}