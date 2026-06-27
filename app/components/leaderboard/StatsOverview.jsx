// components/leaderboard/StatsOverview.jsx
import { Users, RefreshCw, Star, TrendingUp } from 'lucide-react';

export function StatsOverview({ stats, filteredCount }) {
  const statCards = [
    {
      icon: Users,
      label: 'Active Traders',
      value: stats.totalUsers,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      icon: RefreshCw,
      label: 'Total Swaps',
      value: stats.totalSwaps.toLocaleString(),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    {
      icon: Star,
      label: 'Avg. Rating',
      value: stats.averageRating,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400'
    },
    {
      icon: TrendingUp,
      label: 'Weekly Growth',
      value: stats.weeklyGrowth,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="relative group bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105"
        >
          {/* Gradient glow on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
            <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}