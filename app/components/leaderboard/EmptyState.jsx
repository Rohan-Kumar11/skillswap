// components/leaderboard/EmptyState.jsx
import { Search, Filter } from 'lucide-react';

export function EmptyState({ clearFilters }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-16 text-center border border-slate-700/50">
      {/* Icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full opacity-20"></div>
        {/* Inner circle */}
        <div className="absolute inset-3 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
          <Search className="w-10 h-10 text-slate-500" />
        </div>
        {/* Small filter icon */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800">
          <Filter className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-bold text-white mb-3">No Traders Found</h3>
      <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
        We couldn't find any traders matching your search criteria. Try adjusting your filters or search query.
      </p>

      {/* Button */}
      <button
        onClick={clearFilters}
        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105"
      >
        Clear All Filters
      </button>
    </div>
  );
}