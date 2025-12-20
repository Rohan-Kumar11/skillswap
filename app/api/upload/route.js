import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = cookies();
    
    // Create authenticated Supabase client
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

    const form = await req.formData();
    const file = form.get("file");
    const bucket = form.get("bucket");
    const userId = user.id; // Use authenticated user ID

    if (!file || !bucket) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Make filename with extension
    const ext = (file.name && file.name.split(".").pop()) || "jpg";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    
    return NextResponse.json({ 
      success: true, 
      url: data.publicUrl,
      path: fileName 
    });
    
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}