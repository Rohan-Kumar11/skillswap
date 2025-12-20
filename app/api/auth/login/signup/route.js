// =====================================================
// 4. api/auth/login/route.js - COMPLETELY REPLACE
// =====================================================
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    
    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Supabase Auth only works with email, so we need to get email from username if provided
    let email = identifier;

    // Check if identifier is username (not email)
    if (!identifier.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profile_user')
        .select('email')
        .eq('username', identifier)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      email = profile.email;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Auth login error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profile_user')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      profile: profile
    }, { status: 200 });

  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
