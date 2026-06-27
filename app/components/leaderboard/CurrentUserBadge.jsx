// components/leaderboard/CurrentUserBadge.jsx
import { TrendingUp, ChevronUp } from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatarUtils';

export function CurrentUserBadge({ user, rank, onScroll }) {
  const getRankColor = () => {
    if (rank <= 10) return 'from-purple-500 to-purple-600';
    if (rank <= 50) return 'from-blue-500 to-cyan-500';
    return 'from-slate-500 to-slate-600';
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
      <div 
        onClick={onScroll}
        className="group bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-cyan-500/50 p-4 flex items-center gap-4 hover:scale-105 transition-all cursor-pointer hover:shadow-cyan-500/50"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        
        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <img
              src={getAvatarUrl(user)}
              alt={user.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-800">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* User Info */}
          <div>
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Your Rank</p>
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${getRankColor()} shadow-lg flex items-center gap-1.5`}>
                <span className="text-white font-bold text-sm">#{rank}</span>
              </div>
              
              {/* Score */}
              <div>
                <p className="text-xl font-bold text-white leading-none mb-0.5">
                  {user.totalScore?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Points</p>
              </div>
            </div>
          </div>

          {/* Scroll Icon */}
          <div className="ml-2 text-cyan-400 group-hover:animate-bounce">
            <ChevronUp className="w-6 h-6" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-2 text-center">
        <p className="text-xs text-slate-400 font-medium">Click to view your position</p>
      </div>
    </div>
  );
}