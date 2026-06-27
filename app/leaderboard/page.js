// pages/LeaderboardPage.jsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LeaderboardHeader } from '@/app/components/leaderboard/LeaderboardHeader';
import { StatsOverview } from '@/app/components/leaderboard/StatsOverview';
import { SearchAndFilters } from '@/app/components/leaderboard/SearchAndFilters';
import { HallOfFame } from '@/app/components/leaderboard/HallOfFame';
import { RankingsList } from '@/app/components/leaderboard/RankingsList';
import { CurrentUserBadge } from '@/app/components/leaderboard/CurrentUserBadge';
import { EmptyState } from '@/app/components/leaderboard/EmptyState';
import { LoadingScreen } from '@/app/components/leaderboard/LoadingScreen';

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    skillOffered: '',
    skillWanted: '',
    country: '',
    state: '',
    city: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    skillsOffered: [],
    skillsWanted: [],
    countries: [],
    states: [],
    cities: []
  });

  // Stats calculation
  const stats = {
    totalUsers: users.length,
    totalSwaps: users.reduce((acc, user) => acc + (user.total_swaps || 0), 0),
    averageRating: users.length > 0 
      ? (users.reduce((acc, user) => acc + (user.rating || 0), 0) / users.length).toFixed(1)
      : '0.0',
    weeklyGrowth: '+12%'
  };

  useEffect(() => {
    loadLeaderboard();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filters]);

  useEffect(() => {
    if (currentUser && filteredUsers.length > 0) {
      const rank = filteredUsers.findIndex(u => u.id === currentUser.id) + 1;
      setCurrentUserRank(rank > 0 ? rank : null);
    }
  }, [currentUser, filteredUsers]);

  const calculateTotalScore = (user) => {
    const pointsScore = (user.points || 0) * 0.4;
    const ratingScore = (user.rating || 0) * 20 * 0.4;
    const reviewsScore = (user.total_reviews || 0) * 2 * 0.2;
    return Math.round(pointsScore + ratingScore + reviewsScore);
  };

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profile_user')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setCurrentUser({
            ...data,
            totalScore: calculateTotalScore(data)
          });
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profile_user')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      if (error) throw error;

      const usersWithScores = data.map(user => ({
        ...user,
        totalScore: calculateTotalScore(user)
      })).sort((a, b) => b.totalScore - a.totalScore);

      setUsers(usersWithScores);

      // Extract unique filter options
      const uniqueSkillsOffered = new Set();
      const uniqueSkillsWanted = new Set();
      const uniqueCountries = new Set();
      const uniqueStates = new Set();
      const uniqueCities = new Set();

      data.forEach(user => {
        user.skills_offered?.forEach(skill => uniqueSkillsOffered.add(skill));
        user.skills_wanted?.forEach(skill => uniqueSkillsWanted.add(skill));
        if (user.country) uniqueCountries.add(user.country);
        if (user.state) uniqueStates.add(user.state);
        if (user.city) uniqueCities.add(user.city);
      });

      setFilterOptions({
        skillsOffered: Array.from(uniqueSkillsOffered).sort(),
        skillsWanted: Array.from(uniqueSkillsWanted).sort(),
        countries: Array.from(uniqueCountries).sort(),
        states: Array.from(uniqueStates).sort(),
        cities: Array.from(uniqueCities).sort()
      });

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
      );
    }

    if (filters.skillOffered) {
      filtered = filtered.filter(user =>
        user.skills_offered?.includes(filters.skillOffered)
      );
    }

    if (filters.skillWanted) {
      filtered = filtered.filter(user =>
        user.skills_wanted?.includes(filters.skillWanted)
      );
    }

    if (filters.country) {
      filtered = filtered.filter(user => user.country === filters.country);
    }
    if (filters.state) {
      filtered = filtered.filter(user => user.state === filters.state);
    }
    if (filters.city) {
      filtered = filtered.filter(user => user.city === filters.city);
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setFilters({
      skillOffered: '',
      skillWanted: '',
      country: '',
      state: '',
      city: ''
    });
    setSearchQuery('');
  };

  const scrollToCurrentUser = () => {
    const currentUserElement = document.getElementById(`user-${currentUser.id}`);
    if (currentUserElement) {
      currentUserElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      currentUserElement.classList.add('ring-4', 'ring-cyan-400', 'ring-opacity-50');
      setTimeout(() => {
        currentUserElement.classList.remove('ring-4', 'ring-cyan-400', 'ring-opacity-50');
      }, 2000);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Determine how many users to show in Hall of Fame and remaining list
  const hallOfFameCount = Math.min(filteredUsers.length, 3);
  const topUsers = filteredUsers.slice(0, hallOfFameCount);
  const remainingUsers = filteredUsers.slice(hallOfFameCount);
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 ml-64 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <LeaderboardHeader />

        {/* Stats Overview */}
        <StatsOverview stats={stats} filteredCount={filteredUsers.length} />

        {/* Search and Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
        />

        {/* Hall of Fame - Show for 1, 2, or 3+ users */}
        {filteredUsers.length > 0 && (
          <HallOfFame 
            users={topUsers} 
            currentUserId={currentUser?.id}
          />
        )}

        {/* All Rankings List - Only show if there are users beyond top 3 */}
        {remainingUsers.length > 0 && (
          <RankingsList 
            users={remainingUsers}
            currentUserId={currentUser?.id}
          />
        )}

        {/* Empty State - Only show when no users at all */}
        {filteredUsers.length === 0 && (
          <EmptyState clearFilters={clearFilters} />
        )}

        {/* Current User Rank Badge - Show if user is ranked beyond top 3 */}
        {currentUser && currentUserRank && currentUserRank > 3 && (
          <CurrentUserBadge
            user={currentUser}
            rank={currentUserRank}
            onScroll={scrollToCurrentUser}
          />
        )}
      </div>
    </div>
  );
}