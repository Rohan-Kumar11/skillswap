"use client";

export default function ProfileStats({ profile }) {
  // Calculate actual values from profile data
  const swaps = profile?.total_swaps || 0;
  const points = profile?.points || 0;
  const rating = profile?.rating ? Number(profile.rating).toFixed(1) : '0.0';

  // Format points with 'k' suffix if >= 1000
  const formatPoints = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="flex items-center gap-12 mt-6">
      {/* Swaps */}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 mb-0.5">
          {swaps}
        </p>
        <p className="text-sm text-gray-600 font-normal">swaps</p>
      </div>

      {/* Points */}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 mb-0.5">
          {formatPoints(points)}
        </p>
        <p className="text-sm text-gray-600 font-normal">points</p>
      </div>

      {/* Rating */}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 mb-0.5">
          {rating}
        </p>
        <p className="text-sm text-gray-600 font-normal">rating</p>
      </div>
    </div>
  );
}