// lib/calls/SignalingService.js
// 📡 FIXED - Handles both outgoing and incoming calls correctly

import { supabase } from '@/lib/supabaseClient';

/**
 * Call Database Service - FIXED for both call directions
 */
export class CallDatabaseService {
  /**
   * Create new call record - Works for both outgoing and incoming calls
   */
  static async createCall(conversationId, callerId, receiverId, callType) {
    try {
      console.log('💾 Creating call record...', {
        conversationId,
        callerId,
        receiverId,
        callType
      });

      // Verify auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No active session:', sessionError);
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('✅ Auth session valid:', session.user.id);

      // ⭐ FIX: Verify the authenticated user is either the caller OR receiver
      // (not just the caller, since incoming calls have the OTHER person as caller)
      const isUserInCall = 
        callerId === session.user.id || 
        receiverId === session.user.id;

      if (!isUserInCall) {
        console.error('❌ User ID mismatch:', {
          callerId,
          receiverId,
          authenticated: session.user.id
        });
        throw new Error('User must be either caller or receiver');
      }

      console.log('✅ User validation passed:', {
        authenticatedUser: session.user.id,
        isOutgoing: callerId === session.user.id,
        isIncoming: receiverId === session.user.id
      });

      // Insert call record
      const { data, error } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          caller_id: callerId,
          receiver_id: receiverId,
          call_type: callType,
          status: 'calling'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error:', error);
        
        // Provide helpful error messages
        if (error.code === '42501') {
          throw new Error('Permission denied. Please check your account permissions.');
        } else if (error.code === '23503') {
          throw new Error('Invalid user or conversation ID.');
        } else {
          throw new Error(error.message || 'Failed to create call record');
        }
      }

      console.log('✅ Call record created:', data.id);
      return data;
      
    } catch (error) {
      console.error('❌ Create call error:', error);
      throw error;
    }
  }

  /**
   * Update call status
   */
  static async updateCallStatus(callId, status, extraData = {}) {
    try {
      const updateData = { status, ...extraData };
      
      if (status === 'active' && !extraData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      
      if (['ended', 'missed', 'declined', 'failed'].includes(status)) {
        updateData.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', callId);

      if (error) {
        console.error('❌ Update call status error:', error);
        throw error;
      }

      console.log(`✅ Call status updated: ${status}`);
      return true;
      
    } catch (error) {
      console.error('❌ Update call status error:', error);
      return false;
    }
  }

  /**
   * Get call history for conversation
   */
  static async getCallHistory(conversationId, limit = 20) {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_call_history', {
          p_conversation_id: conversationId,
          p_limit: limit
        });

      if (error) throw error;

      return data || [];
      
    } catch (error) {
      console.error('❌ Get call history error:', error);
      return [];
    }
  }

  /**
   * Get missed calls count
   */
  static async getMissedCallsCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_missed_calls_count', {
          p_user_id: userId
        });

      if (error) throw error;

      return data || 0;
      
    } catch (error) {
      console.error('❌ Get missed calls count error:', error);
      return 0;
    }
  }

  /**
   * Mark missed calls as seen
   */
  static async markMissedCallsAsSeen(userId, conversationId) {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('receiver_id', userId)
        .eq('conversation_id', conversationId)
        .eq('status', 'missed');

      if (error) throw error;

      console.log('✅ Missed calls marked as seen');
      return true;
      
    } catch (error) {
      console.error('❌ Mark missed calls error:', error);
      return false;
    }
  }

  /**
   * Clean up old signals
   */
  static async cleanupOldSignals() {
    try {
      const { error } = await supabase
        .rpc('cleanup_old_call_signals');

      if (error) throw error;

      console.log('✅ Old signals cleaned up');
      return true;
      
    } catch (error) {
      console.error('❌ Cleanup signals error:', error);
      return false;
    }
  }
}

/**
 * Signaling Service
 */
export class SignalingService {
  constructor(callId, localUserId) {
    this.callId = callId;
    this.localUserId = localUserId;
    this.channel = null;
    this.callbacks = {};
    
    console.log('📡 Signaling service initialized:', { callId, localUserId });
  }

  async initialize() {
    try {
      console.log('📡 Setting up signaling channel...');
      
      const channelName = `call:${this.callId}`;
      
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: this.localUserId }
        }
      });

      this.channel
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          this.handleSignal(payload);
        })
        .on('broadcast', { event: 'call-end' }, ({ payload }) => {
          if (this.callbacks.onCallEnd) {
            this.callbacks.onCallEnd(payload);
          }
        })
        .on('broadcast', { event: 'call-decline' }, ({ payload }) => {
          if (this.callbacks.onCallDecline) {
            this.callbacks.onCallDecline(payload);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Signaling channel ready');
            await this.subscribeToDatabaseSignals();
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel subscription failed');
          }
        });

      return this.channel;
      
    } catch (error) {
      console.error('❌ Signaling initialization error:', error);
      throw error;
    }
  }

  async subscribeToDatabaseSignals() {
    const dbChannel = supabase
      .channel(`call-signals-db:${this.callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `call_id=eq.${this.callId}`
        },
        (payload) => {
          const signal = payload.new;
          
          if (signal.to_user_id === this.localUserId) {
            console.log('📨 Database signal received:', signal.signal_type);
            this.handleSignal({
              type: signal.signal_type,
              data: signal.signal_data,
              from: signal.from_user_id
            });
          }
        }
      )
      .subscribe();

    console.log('✅ Database signal subscription active');
  }

  handleSignal(payload) {
    const { type, data, from } = payload;
    
    if (from === this.localUserId) return;

    console.log(`📨 Signal received: ${type} from ${from}`);

    switch (type) {
      case 'offer':
        if (this.callbacks.onOffer) {
          this.callbacks.onOffer(data, from);
        }
        break;
        
      case 'answer':
        if (this.callbacks.onAnswer) {
          this.callbacks.onAnswer(data, from);
        }
        break;
        
      case 'ice-candidate':
        if (this.callbacks.onIceCandidate) {
          this.callbacks.onIceCandidate(data, from);
        }
        break;
        
      default:
        console.warn('⚠️ Unknown signal type:', type);
    }
  }

  async sendSignal(type, data, toUserId) {
    try {
      console.log(`📤 Sending signal: ${type} to ${toUserId}`);

      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type,
            data,
            from: this.localUserId,
            timestamp: Date.now()
          }
        });
      }

      const { error } = await supabase
        .from('call_signals')
        .insert({
          call_id: this.callId,
          from_user_id: this.localUserId,
          to_user_id: toUserId,
          signal_type: type,
          signal_data: data
        });

      if (error) {
        console.error('❌ Database signal write error:', error);
      } else {
        console.log('✅ Signal sent successfully');
      }

      return true;
      
    } catch (error) {
      console.error(`❌ Send signal error (${type}):`, error);
      return false;
    }
  }

  async sendOffer(offer, toUserId) {
    return await this.sendSignal('offer', offer, toUserId);
  }

  async sendAnswer(answer, toUserId) {
    return await this.sendSignal('answer', answer, toUserId);
  }

  async sendIceCandidate(candidate, toUserId) {
    return await this.sendSignal('ice-candidate', candidate, toUserId);
  }

  async endCall() {
    try {
      console.log('📞 Sending call end signal...');

      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'call-end',
          payload: {
            from: this.localUserId,
            timestamp: Date.now()
          }
        });
      }

      await supabase
        .from('call_signals')
        .insert({
          call_id: this.callId,
          from_user_id: this.localUserId,
          to_user_id: null,
          signal_type: 'end',
          signal_data: { reason: 'user_ended' }
        });

      console.log('✅ Call end signal sent');
      return true;
      
    } catch (error) {
      console.error('❌ End call signal error:', error);
      return false;
    }
  }

  async declineCall(toUserId) {
    try {
      console.log('❌ Sending call decline signal...');

      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'call-decline',
          payload: {
            from: this.localUserId,
            timestamp: Date.now()
          }
        });
      }

      await supabase
        .from('call_signals')
        .insert({
          call_id: this.callId,
          from_user_id: this.localUserId,
          to_user_id: toUserId,
          signal_type: 'decline',
          signal_data: { reason: 'user_declined' }
        });

      console.log('✅ Decline signal sent');
      return true;
      
    } catch (error) {
      console.error('❌ Decline signal error:', error);
      return false;
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  cleanup() {
    console.log('🧹 Cleaning up signaling...');
    
    if (this.channel) {
      this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    this.callbacks = {};
    console.log('✅ Signaling cleanup complete');
  }
}

export default SignalingService;