// app/auth/callback/route.js - FIXED VERSION
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  console.log('🔄 Auth callback triggered with code:', code ? 'present' : 'missing');

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Error exchanging code:', error);
        return NextResponse.redirect(new URL('/?error=confirmation_failed', requestUrl.origin));
      }

      console.log('✅ Code exchanged successfully for user:', data.user?.id);

      // Check if profile exists to determine if user is new
      const { data: profile, error: profileError } = await supabase
        .from('profile_user')
        .select('skills_offered, skills_wanted')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error checking profile:', profileError);
      }

      // If no profile or profile is incomplete (no skills set), go to onboarding
      if (!profile || !profile.skills_offered || profile.skills_offered.length === 0) {
        console.log('📝 New user detected, redirecting to onboarding');
        return NextResponse.redirect(new URL('/onboarding/interests?mode=new', requestUrl.origin));
      }

      // Existing user with complete profile, go to profile page
      console.log('✅ Existing user, redirecting to profile');
      return NextResponse.redirect(new URL('/profile', requestUrl.origin));

    } catch (error) {
      console.error('❌ Callback error:', error);
      return NextResponse.redirect(new URL('/?error=callback_error', requestUrl.origin));
    }
  }

  // No code provided
  console.log('⚠️ No code provided, redirecting to home');
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}