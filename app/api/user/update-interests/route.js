
// =====================================================
// 9. api/user/update-interests/route.js - UPDATE
// =====================================================
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
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
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { interests } = await request.json();

    if (!interests || !Array.isArray(interests)) {
      return NextResponse.json(
        { success: false, error: 'Interests must be an array' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating interests for user:', user.id);
    console.log('📝 New interests:', interests);

    // Update skills_wanted field (or create a new interests field)
    const { data, error } = await supabase
      .from('profile_user')
      .update({ skills_wanted: interests })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }

    console.log('✅ Interests updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Interests updated successfully',
      data: {
        id: data.id,
        interests: data.skills_wanted
      }
    });

  } catch (error) {
    console.error('❌ Error updating interests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update interests',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('profile_user')
      .select('id, skills_wanted')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        interests: data.skills_wanted || []
      }
    });

  } catch (error) {
    console.error('❌ Error fetching interests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch interests',
        message: error.message
      },
      { status: 500 }
    );
  }
}