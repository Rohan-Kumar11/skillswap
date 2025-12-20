// app/api/search-profile_user/route.js - DEBUGGING VERSION
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  console.log('🔍 ===== SEARCH API CALLED =====');
  
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const country = searchParams.get('country') || '';
    const skills = searchParams.get('skills') ? searchParams.get('skills').split(',') : [];
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : null;
    const maxRating = searchParams.get('maxRating') ? parseFloat(searchParams.get('maxRating')) : null;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null;
    const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')) : null;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')) : 20;
    const userId = searchParams.get('userId') || null;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100);

    console.log('📊 Search params:', { 
      search, city, state, country, skills, 
      minRating, maxRating, lat, lon, radius, userId, limit 
    });

    // Get current user's data first if userId provided
    let currentUserData = null;
    let currentUserInterests = [];
    let userLat = lat;
    let userLon = lon;

    if (userId) {
      console.log('👤 Fetching current user data for:', userId);
      
      try {
        const { data: currentUser, error: userError } = await supabase
          .from('profile_user')
          .select('interests, latitude, longitude')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.warn('⚠️ User fetch error:', userError.message);
        } else if (currentUser) {
          console.log('✅ Current user found:', {
            interests: currentUser.interests,
            lat: currentUser.latitude,
            lon: currentUser.longitude
          });
          
          currentUserData = currentUser;
          currentUserInterests = Array.isArray(currentUser.interests) ? currentUser.interests : [];
          
          if (userLat === null && currentUser.latitude) {
            userLat = currentUser.latitude;
          }
          if (userLon === null && currentUser.longitude) {
            userLon = currentUser.longitude;
          }
        }
      } catch (err) {
        console.error('❌ Error fetching current user:', err);
      }
    }

    console.log('🎯 Final search coordinates:', { userLat, userLon });
    console.log('🎨 User interests:', currentUserInterests);

    // Start building query
    let query = supabase
      .from('profile_user')
      .select('id, full_name, username, email, mobile, bio, profile_pic, cover_pic, swaps, points, rating, city, state, country, latitude, longitude, skills, interests');

    console.log('🔨 Building query...');

    // Exclude current user - IMPORTANT
    if (userId) {
      query = query.neq('id', userId);
      console.log('🚫 Excluding user:', userId);
    }

    // Text search with improved matching
    if (search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
      console.log('🔍 Text search for:', searchTerm);
    }

    // Location filters
    if (city) {
      query = query.ilike('city', `%${city}%`);
      console.log('📍 City filter:', city);
    }
    if (state) {
      query = query.ilike('state', `%${state}%`);
      console.log('📍 State filter:', state);
    }
    if (country) {
      query = query.ilike('country', `%${country}%`);
      console.log('📍 Country filter:', country);
    }

    // Rating filters
    if (minRating !== null) {
      query = query.gte('rating', minRating);
      console.log('⭐ Min rating:', minRating);
    }
    if (maxRating !== null) {
      query = query.lte('rating', maxRating);
      console.log('⭐ Max rating:', maxRating);
    }

    // Execute query
    console.log('🚀 Executing query...');
    const { data, error } = await query.limit(500);

    if (error) {
      console.error('❌ Supabase query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log('✅ Query successful! Found', data?.length || 0, 'profile_user');

    if (!data || data.length === 0) {
      console.log('📭 No profile_user found in database');
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
        filters_applied: {
          search: search || null,
          location: city || state || country ? { city, state, country } : null,
          skills: skills.length > 0 ? skills : null,
          rating: minRating || maxRating ? { min: minRating, max: maxRating } : null,
          radius: userLat && userLon ? radius : null
        }
      });
    }

    // Calculate distance and relevance for each user
    console.log('📐 Calculating distances and relevance scores...');
    const profile_userWithMetrics = data.map((user, index) => {
      let distance = null;
      let withinRadius = true;
      
      // Calculate distance if coordinates available
      if (userLat !== null && userLon !== null && user.latitude && user.longitude) {
        try {
          distance = calculateDistance(userLat, userLon, user.latitude, user.longitude);
          withinRadius = distance <= radius;
        } catch (err) {
          console.error(`Error calculating distance for user ${user.id}:`, err);
        }
      }

      // Calculate skill matches with current user's interests
      let skillMatchCount = 0;
      if (currentUserInterests.length > 0 && user.skills && Array.isArray(user.skills)) {
        try {
          skillMatchCount = user.skills.filter(skill => 
            currentUserInterests.some(interest => 
              interest.toLowerCase() === skill.toLowerCase()
            )
          ).length;
        } catch (err) {
          console.error(`Error matching skills for user ${user.id}:`, err);
        }
      }

      // Check if skills filter matches
      let skillsFilterMatch = true;
      if (skills.length > 0) {
        if (user.skills && Array.isArray(user.skills)) {
          skillsFilterMatch = skills.every(filterSkill =>
            user.skills.some(profile_userkill => 
              profile_userkill.toLowerCase().includes(filterSkill.toLowerCase())
            )
          );
        } else {
          skillsFilterMatch = false;
        }
      }

      // Calculate relevance score
      let relevanceScore = 0;
      
      try {
        if (distance !== null) {
          relevanceScore += Math.max(0, 100 - distance);
        }
        relevanceScore += skillMatchCount * 50;
        relevanceScore += (user.rating || 0) * 20;
        relevanceScore += Math.min((user.swaps || 0) * 2, 50);
      } catch (err) {
        console.error(`Error calculating relevance for user ${user.id}:`, err);
      }

      return {
        ...user,
        distance,
        skill_match_count: skillMatchCount,
        relevance_score: relevanceScore,
        within_radius: withinRadius,
        skills_filter_match: skillsFilterMatch
      };
    });

    console.log('✅ Processed', profile_userWithMetrics.length, 'profile_user with metrics');

    // Smart filtering based on search state
    let filteredprofile_user = profile_userWithMetrics;

    const hasActiveSearch = search.trim() || city || state || country || skills.length > 0 || minRating !== null || maxRating !== null;

    console.log('🎯 Has active search?', hasActiveSearch);

    if (!hasActiveSearch) {
      console.log('🏠 INITIAL LOAD MODE - Filtering for nearby profile_user with matching interests');
      filteredprofile_user = profile_userWithMetrics.filter(user => {
        if (userLat !== null && userLon !== null) {
          if (!user.within_radius) return false;
        }
        
        if (currentUserInterests.length > 0) {
          return user.skill_match_count > 0;
        }
        
        return true;
      });
      console.log('✅ Initial filter result:', filteredprofile_user.length, 'profile_user');
    } else {
      console.log('🔎 ACTIVE SEARCH MODE - Applying filters');
      filteredprofile_user = profile_userWithMetrics.filter(user => {
        if (userLat !== null && userLon !== null) {
          if (!user.within_radius) return false;
        }
        
        if (skills.length > 0 && !user.skills_filter_match) {
          return false;
        }
        
        return true;
      });
      console.log('✅ Active search filter result:', filteredprofile_user.length, 'profile_user');
    }

    // Sort by relevance score
    filteredprofile_user.sort((a, b) => b.relevance_score - a.relevance_score);
    console.log('✅ Sorted by relevance');

    // Limit results
    filteredprofile_user = filteredprofile_user.slice(0, limit);
    console.log('✅ Limited to', filteredprofile_user.length, 'profile_user');

    // Format the response
    const profile_user = filteredprofile_user.map(user => ({
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      bio: user.bio,
      profile_pic: user.profile_pic,
      cover_pic: user.cover_pic,
      swaps: user.swaps || 0,
      points: user.points || 0,
      rating: user.rating || 0,
      skills: user.skills || [],
      location: {
        city: user.city,
        state: user.state,
        country: user.country
      },
      distance: user.distance ? parseFloat(user.distance.toFixed(2)) : null,
      skill_match_count: user.skill_match_count,
      relevance_score: parseFloat(user.relevance_score.toFixed(2))
    }));

    console.log('🎉 SUCCESS! Returning', profile_user.length, 'profile_user');

    return NextResponse.json({
      success: true,
      count: profile_user.length,
      data: profile_user,
      filters_applied: {
        search: search || null,
        location: city || state || country ? { city, state, country } : null,
        skills: skills.length > 0 ? skills : null,
        rating: minRating || maxRating ? { min: minRating, max: maxRating } : null,
        radius: userLat && userLon ? radius : null
      }
    });

  } catch (error) {
    console.error('❌ ===== SEARCH API ERROR =====');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}