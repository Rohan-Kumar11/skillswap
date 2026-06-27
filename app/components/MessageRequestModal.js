"use client";

import { useState } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SafeAvatar } from './SafeAvatar';
import { useToast } from './Toast';

export default function MessageRequestModal({ isOpen, onClose, targetUser, currentUserId }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleSendRequest = async () => {
    if (!message.trim()) {
      setError('Please write a message');
      return;
    }

    if (message.length > 500) {
      setError('Message is too long (max 500 characters)');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('You must be logged in to send requests');
        setSending(false);
        return;
      }

      if (currentUserId !== user.id) {
        console.warn('⚠️ currentUserId mismatch!');
      }

      console.log('=== SENDING REQUEST ===');
      console.log('Authenticated User:', user.id);
      console.log('Target User:', targetUser.id);

      const { data: existingConvs, error: searchError } = await supabase
        .from('conversations')
        .select('id, type')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${currentUserId})`);

      if (searchError) {
        console.error('Error searching conversations:', searchError);
        throw new Error('Failed to check existing conversations');
      }

      let conversationId;

      if (existingConvs && existingConvs.length > 0) {
        conversationId = existingConvs[0].id;
        console.log('Using existing conversation:', conversationId);

        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);

      } else {
        console.log('Creating new conversation...');
        
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: targetUser.id,
            type: 'request',
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          throw new Error('Failed to create conversation');
        }

        conversationId = newConv.id;
        console.log('Created new conversation:', conversationId);
      }

      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: message.trim(),
          has_swap_keywords: false
        })
        .select()
        .single();

      if (msgError) {
        console.error('Error sending message:', msgError);
        throw new Error('Failed to send message');
      }

      console.log('Message sent successfully:', messageData.id);

      toast.success('Request sent successfully! Check the Messages page.');
      setMessage('');
      onClose();

    } catch (error) {
      console.error('=== ERROR SENDING REQUEST ===', error);
      toast.error(error.message || 'Failed to send request. Please try again.');
      
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Send Request</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect with @{targetUser.username}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={sending}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* User Info with Safe Avatar */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <SafeAvatar 
              user={targetUser} 
              size="lg" 
              ringColor="ring-white"
            />
            <div>
              <h3 className="font-bold text-gray-800">{targetUser.full_name}</h3>
              <p className="text-sm text-gray-600">@{targetUser.username}</p>
            </div>
          </div>

          {/* Skills Display */}
          {targetUser.skills && targetUser.skills.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Their Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {targetUser.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              placeholder="Hi! I'd love to connect and exchange skills..."
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              disabled={sending}
            />
            <p className={`text-xs mt-1 ${message.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
              {message.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSendRequest}
              disabled={sending || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
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