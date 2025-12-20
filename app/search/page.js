"use client";
// app/search/page.js - UPDATED FOR SUPABASE AUTH
import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, Star, Users, Award, X, SlidersHorizontal, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';


export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    country: '',
    skills: [],
    minRating: null,
    maxRating: null,
    radius: 20
  });

  const availableSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Design',
    'Photography', 'Writing', 'Marketing', 'Cooking', 'Teaching',
    'Music', 'Video Editing', 'Yoga', 'Fitness', 'Language Exchange'
  ];

  // ✅ Get current user from Supabase Auth
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, showing all users');
        }
      );
    }
  }, []);

  // Search function - now uses profile_user table
  const searchUsers = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('profile_user')
        .select('*');

      // Exclude current user
      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      // Only show active users
      query = query.eq('is_active', true);

      // Text search
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
      }

      // Location filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.ilike('state', `%${filters.state}%`);
      }
      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`);
      }

      // Rating filters
      if (filters.minRating !== null) {
        query = query.gte('rating', filters.minRating);
      }
      if (filters.maxRating !== null) {
        query = query.lte('rating', filters.maxRating);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Client-side filtering for skills and distance
      let filteredUsers = data || [];

      // Filter by skills
      if (filters.skills.length > 0) {
        filteredUsers = filteredUsers.filter(user => {
          if (!user.skills || !Array.isArray(user.skills)) return false;
          return filters.skills.every(filterSkill =>
            user.skills.some(userSkill =>
              userSkill.toLowerCase().includes(filterSkill.toLowerCase())
            )
          );
        });
      }

      // Calculate distance and add metadata
      filteredUsers = filteredUsers.map(user => {
        let distance = null;
        if (userLocation && user.latitude && user.longitude) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.latitude,
            user.longitude
          );
        }

        return {
          ...user,
          distance,
          skill_match_count: 0, // You can implement skill matching logic here
          swaps: 0, // Add if you have this field
          points: user.points || 0
        };
      });

      // Filter by radius
      if (userLocation && filters.radius) {
        filteredUsers = filteredUsers.filter(user =>
          !user.distance || user.distance <= filters.radius
        );
      }

      // Sort by distance
      filteredUsers.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      setUsers(filteredUsers);
      if (initialLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, userLocation, currentUserId, initialLoad]);

  // Initial load and search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, searchUsers]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      country: '',
      skills: [],
      minRating: null,
      maxRating: null,
      radius: 20
    });
  };

  const toggleSkill = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev, skill]
    }));
  };

  const hasActiveFilters = filters.city || filters.state || filters.country ||
    filters.skills.length > 0 || filters.minRating || filters.maxRating;

  const hasActiveSearch = searchQuery.trim() || hasActiveFilters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 md:ml-20 lg:ml-64 xl:ml-72">
      <div className="h-16 md:hidden" />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 md:top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Discover Users
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, username, bio, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm ${hasActiveFilters || showFilters
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {filters.skills.length + (filters.city ? 1 : 0) + (filters.state ? 1 : 0) +
                    (filters.country ? 1 : 0) + (filters.minRating ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Advanced Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Location Filters */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Radius Slider */}
              {userLocation && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Search Radius: {filters.radius} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={filters.radius}
                    onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Rating Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.minRating || ''}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Max rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.maxRating || ''}
                    onChange={(e) => setFilters({ ...filters, maxRating: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Skills ({filters.skills.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.skills.includes(skill)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">
              {initialLoad ? 'Finding users near you...' : 'Searching...'}
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-32">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No users found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search query or filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-700 font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Found {users.length} user{users.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden group hover:-translate-y-1"
                >
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={user.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                          alt={user.full_name}
                          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                        />
                        {user.rating >= 4.5 && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 truncate text-lg">
                          {user.full_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          @{user.username}
                        </p>
                        {user.distance && (
                          <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mt-2">
                            <MapPin className="w-3 h-3" />
                            {user.distance.toFixed(1)} km away
                          </div>
                        )}
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-gray-600 mt-4 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    {user.skills && user.skills.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {user.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 4 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                              +{user.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {(user.city || user.state || user.country) && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {[user.city, user.state, user.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4 grid grid-cols-2 gap-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-700">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-lg">{user.points}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Points</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-700">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg">{user.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Rating</p>
                    </div>
                  </div>


                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/profile/${user.username}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg group-hover:scale-105"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}