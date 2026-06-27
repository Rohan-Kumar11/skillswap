// components/leaderboard/SearchAndFilters.jsx
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  filterOptions,
  activeFiltersCount,
  clearFilters
}) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-8">
      <div className="flex gap-4 mb-4">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search traders..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border-2 border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder-slate-500 text-white font-medium transition-all"
          />
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all border-2 ${
            showFilters
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900/50 text-slate-300 border-slate-700/50 hover:border-slate-600/50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2.5 py-0.5 bg-white text-slate-900 rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-600 transition-all flex items-center gap-2 border-2 border-transparent shadow-lg shadow-red-500/25"
          >
            <X className="w-5 h-5" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-5 gap-4 pt-6 border-t-2 border-slate-700/50 animate-fade-in">
          <FilterSelect
            label="Skill Offered"
            value={filters.skillOffered}
            onChange={(value) => setFilters({ ...filters, skillOffered: value })}
            options={filterOptions.skillsOffered}
            placeholder="All Skills"
          />
          
          <FilterSelect
            label="Skill Wanted"
            value={filters.skillWanted}
            onChange={(value) => setFilters({ ...filters, skillWanted: value })}
            options={filterOptions.skillsWanted}
            placeholder="All Skills"
          />
          
          <FilterSelect
            label="Country"
            value={filters.country}
            onChange={(value) => setFilters({ ...filters, country: value })}
            options={filterOptions.countries}
            placeholder="All Countries"
          />
          
          <FilterSelect
            label="State"
            value={filters.state}
            onChange={(value) => setFilters({ ...filters, state: value })}
            options={filterOptions.states}
            placeholder="All States"
          />
          
          <FilterSelect
            label="City"
            value={filters.city}
            onChange={(value) => setFilters({ ...filters, city: value })}
            options={filterOptions.cities}
            placeholder="All Cities"
          />
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900/50 border-2 border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white font-medium appearance-none cursor-pointer transition-all hover:border-slate-600/50"
        >
          <option value="" className="text-slate-400 bg-slate-900">{placeholder}</option>
          {options.map(option => (
            <option key={option} value={option} className="text-white bg-slate-900">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}