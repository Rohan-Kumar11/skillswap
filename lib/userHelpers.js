// =====================================================
// 2. lib/userHelpers.js - COMPLETELY REPLACE
// =====================================================
import { supabase } from './supabaseClient';

/**
 * Get the currently logged-in user from Supabase Auth
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Get the current user's profile from the database
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profile_user')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Initialize user session - gets user from Supabase Auth and fetches their profile
 */
export async function initializeUserSession() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('No authenticated user');
      return null;
    }

    const profile = await getUserProfile(user.id);
    
    return { user, profile };
  } catch (error) {
    console.error('Error initializing user session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Sign out user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

/**
 * Get user's stories from database
 */
export async function getUserStories(userId) {
  try {
    // Note: You don't have a stories table in your schema
    // If you need this, add it to your database first
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserStories:', error);
    return [];
  }
}

/**
 * Get user's posts from database
 */
export async function getUserPosts(userId) {
  try {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    return [];
  }
}
