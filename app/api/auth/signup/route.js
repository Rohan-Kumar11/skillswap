// =====================================================
// 3. api/auth/signup/route.js - COMPLETELY REPLACE
// =====================================================
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { full_name, username, email, mobile, password } = await request.json();

    if (!full_name || !username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          username,
          mobile: mobile || ""
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // The trigger will automatically create the profile_user record
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the created profile
    const { data: profile, error: profileError } = await supabase
      .from('profile_user')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
      profile: profile
    }, { status: 200 });

  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
