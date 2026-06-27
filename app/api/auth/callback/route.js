// app/auth/callback/route.js - WITH OTP PASSWORD RESET SUPPORT
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const next = requestUrl.searchParams.get('next') || '/';

  console.log('🔄 Auth callback triggered:', { 
    code: !!code, 
    type, 
    token_hash: !!token_hash 
  });

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Error exchanging code:', error);
        return NextResponse.redirect(
          new URL('/?error=confirmation_failed', requestUrl.origin)
        );
      }

      console.log('✅ Code exchanged successfully for user:', data.user?.id);

      // Handle different callback types
      if (type === 'recovery') {
        // Password reset callback - user clicked email link
        console.log('🔑 Password recovery flow detected');
        return NextResponse.redirect(
          new URL('/auth/reset-password', requestUrl.origin)
        );
      }

      // Regular email confirmation - check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profile_user')
        .select('skills_offered, skills_wanted')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error checking profile:', profileError);
      }

      // Determine where to redirect based on profile completeness
      if (!profile || !profile.skills_offered || profile.skills_offered.length === 0) {
        console.log('📝 New/incomplete profile, redirecting to onboarding');
        return NextResponse.redirect(
          new URL('/onboarding/interests?mode=new', requestUrl.origin)
        );
      }

      // Existing complete profile
      console.log('✅ Complete profile found, redirecting to profile page');
      return NextResponse.redirect(
        new URL('/profile', requestUrl.origin)
      );

    } catch (error) {
      console.error('❌ Callback error:', error);
      return NextResponse.redirect(
        new URL('/?error=callback_error', requestUrl.origin)
      );
    }
  }

  // No code provided
  console.log('⚠️ No code provided, redirecting to home');
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}