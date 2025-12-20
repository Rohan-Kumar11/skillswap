export default function ProfileStats({ profile }) {
  return (
    <div className="flex gap-12 mt-6 text-center text-black">
      <div>
        <p className="text-xl font-semibold">{profile.swaps}</p>
        <p>swaps</p>
      </div>
      <div>
        <p className="text-xl font-semibold">{profile.points}</p>
        <p>points</p>
      </div>
      <div>
        <p className="text-xl font-semibold">{profile.rating}</p>
        <p>rating</p>
      </div>
    </div>
  );
}
