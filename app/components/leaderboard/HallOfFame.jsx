// components/leaderboard/HallOfFame.jsx
import { Crown, Medal, Award, Star, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/app/utils/avatarUtils';

export function HallOfFame({ users, currentUserId }) {
  const router = useRouter();
  
  if (!users || users.length === 0) return null;

  const PodiumCard = ({ user, position }) => {
    const configs = {
      1: {
        icon: Crown,
        gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
        ring: 'ring-yellow-400/50',
        shadow: 'shadow-yellow-500/50',
        size: 'w-32 h-32',
        order: 'order-2',
        mt: 'mt-0',
        textSize: 'text-4xl',
        glow: 'shadow-2xl shadow-yellow-500/50'
      },
      2: {
        icon: Medal,
        gradient: 'from-slate-300 via-slate-400 to-slate-500',
        ring: 'ring-slate-400/50',
        shadow: 'shadow-slate-500/50',
        size: 'w-28 h-28',
        order: 'order-1',
        mt: 'mt-8',
        textSize: 'text-3xl',
        glow: 'shadow-xl shadow-slate-500/30'
      },
      3: {
        icon: Award,
        gradient: 'from-orange-400 via-orange-500 to-orange-600',
        ring: 'ring-orange-400/50',
        shadow: 'shadow-orange-500/50',
        size: 'w-28 h-28',
        order: 'order-3',
        mt: 'mt-8',
        textSize: 'text-3xl',
        glow: 'shadow-xl shadow-orange-500/30'
      }
    };

    const config = configs[position];
    const Icon = config.icon;
    const isCurrentUser = user.id === currentUserId;

    return (
      <div
        className={`flex flex-col items-center group cursor-pointer ${config.order} ${config.mt}`}
        onClick={() => router.push(`/profile/${user.username}`)}
      >
        {/* Icon Badge */}
        <div className={`mb-4 p-3 rounded-full bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-lg ${position === 1 ? 'animate-bounce' : ''}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Avatar */}
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`}></div>
          
          {/* Avatar image */}
          <div className="relative">
            <img
              src={getAvatarUrl(user)}
              alt={user.full_name}
              className={`${config.size} rounded-full object-cover border-4 border-slate-800 ring-4 ${config.ring} ${config.glow} group-hover:scale-110 transition-transform duration-300`}
            />
            
            {/* Rank badge */}
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg font-bold text-sm`}>
              #{position}
            </div>

            {/* "YOU" badge for current user */}
            {isCurrentUser && (
              <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                YOU
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center">
          <h3 className={`font-bold mb-1 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${config.gradient} group-hover:bg-clip-text transition-all ${position === 1 ? 'text-2xl' : 'text-xl'}`}>
            {user.full_name}
          </h3>
          <p className="text-slate-400 text-sm mb-3">@{user.username}</p>
          
          {/* Rating */}
          <div className="flex items-center justify-center gap-1.5 text-yellow-400 mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{user.rating?.toFixed(1) || '0.0'}</span>
          </div>

          {/* Points */}
          <div className={`font-bold mb-1 bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent ${config.textSize}`}>
            {user.totalScore?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">points</p>
        </div>
      </div>
    );
  };

  // Handle different user counts
  if (users.length === 1) {
    // Only 1 user - Show single champion
    return (
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 rounded-3xl blur-3xl"></div>
        
        <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-slate-700/50">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Top Performer</span>
            </div>
            <h2 className="font-bold text-3xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Champion
            </h2>
          </div>

          <div className="flex justify-center">
            <PodiumCard user={users[0]} position={1} />
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 2) {
    // Only 2 users - Show first and second place
    const [first, second] = users;
    
    return (
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 rounded-3xl blur-3xl"></div>
        
        <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-slate-700/50">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Top Performers</span>
            </div>
            <h2 className="font-bold text-3xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Hall of Fame
            </h2>
          </div>

          <div className="flex justify-center items-start gap-16">
            <PodiumCard user={second} position={2} />
            <PodiumCard user={first} position={1} />
          </div>
        </div>
      </div>
    );
  }

  // 3 or more users - Show full podium
  const [first, second, third] = users;

  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 rounded-3xl blur-3xl"></div>
      
      <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-slate-700/50">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Top Performers</span>
          </div>
          <h2 className="font-bold text-3xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Hall of Fame
          </h2>
        </div>

        <div className="flex justify-center items-start gap-8 lg:gap-16">
          <PodiumCard user={second} position={2} />
          <PodiumCard user={first} position={1} />
          <PodiumCard user={third} position={3} />
        </div>
      </div>
    </div>
  );
}