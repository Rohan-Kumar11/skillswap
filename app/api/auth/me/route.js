// =====================================================
// 5. api/auth/me/route.js - COMPLETELY REPLACE
// =====================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request) {
  try {
    const cookieStore = cookies();

    // Create Supabase client with cookies for server-side
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          }
        }
      }
    );

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated',
          user: null 
        },
        { status: 401 }
      );
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profile_user')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Profile not found',
          user: null 
        },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        email: profile.email,
        mobile: profile.mobile,
        bio: profile.bio,
        profile_pic: profile.profile_pic,
        cover_pic: profile.cover_pic,
        points: profile.points,
        rating: profile.rating,
        total_reviews: profile.total_reviews,
        location: {
          city: profile.city,
          state: profile.state,
          country: profile.country,
          latitude: profile.latitude,
          longitude: profile.longitude
        },
        skills: profile.skills || [],
        skills_offered: profile.skills_offered || [],
        skills_wanted: profile.skills_wanted || [],
        is_verified: profile.is_verified,
        created_at: profile.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error fetching current user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        user: null
      },
      { status: 500 }
    );
  }
}
