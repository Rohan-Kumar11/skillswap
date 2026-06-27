// components/leaderboard/RankingsList.jsx
import { DetailedUserCard } from './DetailedUserCard';

export function RankingsList({ users, currentUserId }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Rankings</h2>
        <span className="text-slate-400 text-sm font-medium">
          Showing {users.length} more traders
        </span>
      </div>
      
      {/* List of User Cards */}
      <div className="space-y-4">
        {users.map((user, index) => {
          const rank = index + 4;
          
          return (
            <DetailedUserCard
              key={user.id}
              user={user}
              rank={rank}
              currentUserId={currentUserId}
            />
          );
        })}
      </div>
    </div>
  );
}