// app/api/explore/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user's skills_wanted
    const { data: userData, error: userError } = await supabase
      .from('profile_user')
      .select('skills_wanted')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const userSkillsWanted = userData?.skills_wanted || [];

    // If user has no skills_wanted, show all posts with captions
    if (userSkillsWanted.length === 0) {
      const { data: allPosts, error: postsError } = await supabase
        .from('post')
        .select(`
          *,
          profile_user!inner (
            id,
            username,
            full_name,
            profile_pic,
            gender
          )
        `)
        .eq('visibility', 'public')
        .eq('is_archived', false)
        .neq('user_id', userId)
        .not('caption', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;

      const formattedPosts = (allPosts || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        caption: post.caption,
        content: post.content,
        image_url: post.image_url,
        media_urls: post.media_urls,
        media_type: post.media_type,
        video_thumbnail: post.video_thumbnail,
        hashtags: post.hashtags,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        views_count: post.views_count || 0,
        created_at: post.created_at,
        music_url: post.music_url,
        music_title: post.music_title,
        music_artist: post.music_artist,
        user: {
          id: post.profile_user.id,
          username: post.profile_user.username,
          full_name: post.profile_user.full_name,
          profile_pic: post.profile_user.profile_pic,
          gender: post.profile_user.gender
        },
        relevanceScore: 0,
        isRelevant: false
      }));

      return NextResponse.json({
        success: true,
        count: formattedPosts.length,
        hasMore: formattedPosts.length === limit,
        data: formattedPosts,
        userInterests: []
      });
    }

    // User HAS skills_wanted - only show matching posts
    // Get all posts with captions (we'll filter client-side for better matching)
    const { data: posts, error: postsError } = await supabase
      .from('post')
      .select(`
        *,
        profile_user!inner (
          id,
          username,
          full_name,
          profile_pic,
          gender
        )
      `)
      .eq('visibility', 'public')
      .eq('is_archived', false)
      .neq('user_id', userId)
      .not('caption', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500); // Get more for filtering

    if (postsError) throw postsError;

    // Filter and score posts based on skills_wanted matching
    const matchingPosts = [];

    for (const post of posts || []) {
      let relevanceScore = 0;
      let matchedSkills = [];

      // Check if any skill_wanted matches the caption
      for (const skill of userSkillsWanted) {
        const skillLower = skill.toLowerCase().trim();
        const captionLower = (post.caption || '').toLowerCase();

        // Exact word match (higher score)
        const wordBoundaryRegex = new RegExp(`\\b${skillLower}\\b`, 'i');
        if (wordBoundaryRegex.test(captionLower)) {
          relevanceScore += 20;
          matchedSkills.push(skill);
          continue;
        }

        // Partial match (lower score)
        if (captionLower.includes(skillLower)) {
          relevanceScore += 10;
          matchedSkills.push(skill);
          continue;
        }

        // Check hashtags for exact match
        if (post.hashtags && Array.isArray(post.hashtags)) {
          for (const hashtag of post.hashtags) {
            if (hashtag.toLowerCase().includes(skillLower)) {
              relevanceScore += 15;
              matchedSkills.push(skill);
              break;
            }
          }
        }

        // Check content if available
        if (post.content) {
          const contentLower = post.content.toLowerCase();
          if (wordBoundaryRegex.test(contentLower)) {
            relevanceScore += 8;
            matchedSkills.push(skill);
          } else if (contentLower.includes(skillLower)) {
            relevanceScore += 5;
            matchedSkills.push(skill);
          }
        }
      }

      // Only include posts that have at least one match
      if (relevanceScore > 0) {
        // Add engagement and recency scores
        const engagementScore = 
          (post.likes_count || 0) * 2 + 
          (post.comments_count || 0) * 3 + 
          (post.views_count || 0) * 0.1;

        const daysSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 30 - daysSincePost);

        matchingPosts.push({
          ...post,
          relevanceScore,
          engagementScore,
          recencyScore,
          matchedSkills: [...new Set(matchedSkills)], // Remove duplicates
          totalScore: relevanceScore * 3 + engagementScore + recencyScore
        });
      }
    }

    // Sort by total score (relevance first, then engagement, then recency)
    matchingPosts.sort((a, b) => b.totalScore - a.totalScore);

    // Apply pagination
    const paginatedPosts = matchingPosts.slice(offset, offset + limit);

    // Format response
    const formattedPosts = paginatedPosts.map(post => ({
      id: post.id,
      user_id: post.user_id,
      caption: post.caption,
      content: post.content,
      image_url: post.image_url,
      media_urls: post.media_urls,
      media_type: post.media_type,
      video_thumbnail: post.video_thumbnail,
      hashtags: post.hashtags,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      views_count: post.views_count || 0,
      created_at: post.created_at,
      music_url: post.music_url,
      music_title: post.music_title,
      music_artist: post.music_artist,
      user: {
        id: post.profile_user.id,
        username: post.profile_user.username,
        full_name: post.profile_user.full_name,
        profile_pic: post.profile_user.profile_pic,
        gender: post.profile_user.gender
      },
      relevanceScore: post.relevanceScore,
      matchedSkills: post.matchedSkills,
      isRelevant: true
    }));

    return NextResponse.json({
      success: true,
      count: formattedPosts.length,
      total: matchingPosts.length,
      hasMore: matchingPosts.length > offset + limit,
      data: formattedPosts,
      userInterests: userSkillsWanted
    });

  } catch (error) {
    console.error('❌ Explore API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch explore posts',
        message: error.message
      },
      { status: 500 }
    );
  }
}