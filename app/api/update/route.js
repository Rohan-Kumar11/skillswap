// =====================================================
// 8. api/update/route.js - UPDATE
// =====================================================
import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = cookies();
    
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

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, username, bio, profile_pic, cover_pic } = body;

    const { data, error } = await supabase
      .from("profile_user")
      .update({ full_name, username, bio, profile_pic, cover_pic })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data });
    
  } catch (err) {
    console.error("update profile error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

