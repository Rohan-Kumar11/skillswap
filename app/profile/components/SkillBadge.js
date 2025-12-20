export default function SkillBadge({ skill, Icon }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#263247] text-white rounded-full text-sm shadow">
      <Icon size={16} />
      {skill}
    </div>
  );
}
