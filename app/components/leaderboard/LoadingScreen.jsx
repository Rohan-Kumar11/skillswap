// components/leaderboard/LoadingScreen.jsx

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 ml-64 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin"></div>
          {/* Inner ring */}
          <div className="absolute inset-3 border-4 border-transparent border-b-cyan-500 border-l-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Leaderboard</h2>
        <p className="text-slate-400 text-sm">Calculating rankings...</p>
      </div>
    </div>
  );
}