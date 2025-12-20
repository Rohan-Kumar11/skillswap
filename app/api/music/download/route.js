// app/api/music/download/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { previewUrl, title, artist } = await request.json();

    // Download the music preview
    const response = await fetch(previewUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${title}-${artist}.mp3"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading music:', error);
    return NextResponse.json(
      { error: 'Failed to download music' },
      { status: 500 }
    );
  }
}

// Alternative: Direct upload to Supabase
export async function PUT(request) {
  try {
    const { previewUrl, title, artist, userId } = await request.json();

    // Download the music
    const response = await fetch(previewUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend
    );

    const fileName = `${userId}/music-${Date.now()}.mp3`;
    const { data, error } = await supabase.storage
      .from('post-music')
      .upload(fileName, buffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('post-music')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      title,
      artist
    });
  } catch (error) {
    console.error('ErAror uploading music:', error);
    return NextResponse.json(
      { error: 'Failed to upload music' },
      { status: 500 }
    );
  }
}