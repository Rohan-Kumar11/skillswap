// components/leaderboard/DetailedUserCard.jsx
import { Star, MapPin, RefreshCw, Heart, UserPlus, MessageCircle, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/app/utils/avatarUtils';

export function DetailedUserCard({ user, rank, currentUserId }) {
  const router = useRouter();
  const isCurrentUser = user.id === currentUserId;

  const getRankBadge = () => {
    if (rank <= 10) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg';
    }
    return 'bg-slate-700/50 text-slate-300 border border-slate-600/50';
  };

  return (
    <div
      id={`user-${user.id}`}
      className={`relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:bg-slate-800/60 ${
        isCurrentUser 
          ? 'border-cyan-500/50 bg-cyan-500/5' 
          : 'border-slate-700/50 hover:border-slate-600/50'
      }`}
    >
      {/* Rank Badge - Top Left Corner */}
      <div className="absolute -top-3 -left-3 z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getRankBadge()}`}>
          #{rank}
        </div>
      </div>

      {/* "YOU" Badge for current user */}
      {isCurrentUser && (
        <div className="absolute top-4 right-4 bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse z-10">
          YOU
        </div>
      )}

      <div className="p-6 pt-8">
        {/* Top Section - Avatar, Name, Location, Points */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar with Online Indicator */}
          <div className="relative flex-shrink-0">
            <img
              src={getAvatarUrl(user)}
              alt={user.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-600 ring-2 ring-slate-700/50 shadow-lg"
            />
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>

          {/* Name and Location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white truncate">
                {user.full_name}
              </h3>
              {rank <= 10 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <span className="text-emerald-400">⚡</span>
                  Top
                </span>
              )}
            </div>
            <p className="text-emerald-400 text-sm mb-2">@{user.username}</p>
            {(user.city || user.state || user.country) && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{[user.city, user.state, user.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>

          {/* Points Display */}
          <div className="text-right">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-xl px-5 py-3 shadow-lg">
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {user.totalScore?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">points</p>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-3 mb-5">
          {/* Teaching Skills */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TEACHING</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skills_offered?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-sm font-medium rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Learning Skills */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LEARNING</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skills_wanted?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-300 text-sm font-medium rounded-lg border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats and Actions Section */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-700/50">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {/* Swaps */}
            <div className="flex items-center gap-2 text-slate-300">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{user.total_swaps || 0}</span>
              <span className="text-sm text-slate-500">swaps</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="font-semibold">{user.rating?.toFixed(1) || '0.0'}</span>
            </div>

            {/* Likes */}
            <div className="flex items-center gap-2 text-slate-300">
              <Heart className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{Math.floor(Math.random() * 500) + 50}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/*  */}

            {/* View Profile Button */}
            <button
              onClick={() => router.push(`/profile/${user.username}`)}
              className="px-5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 font-semibold transition-all flex items-center gap-2"
            >
              View
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}