// components/leaderboard/LeaderboardHeader.jsx
import { TrendingUp, Sparkles } from 'lucide-react';

export function LeaderboardHeader() {
  return (
    <div className="text-center mb-10 animate-fade-in">
      <div className="inline-flex items-center gap-4 mb-6">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-2xl opacity-50 animate-pulse"></div>
          {/* Icon container */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="text-left">
          <h1 className="font-bold text-5xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-slate-400 text-lg mt-1">
            Top skill traders in the community
          </p>
        </div>
      </div>
      
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="text-slate-300 text-sm font-medium">Rankings update in real-time</span>
      </div>
    </div>
  );
}