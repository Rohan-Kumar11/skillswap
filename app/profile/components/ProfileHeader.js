"use client";
import { Camera, Settings, Users } from "lucide-react";
import SkillBadge from "./SkillBadge";

export default function ProfileHeader({ profile, openCropper, router, SKILL_ICONS }) {
  return (
    <div>
      {/* COVER IMAGE */}
      <label className="w-full h-40 bg-gray-400 rounded-2xl mb-6 relative cursor-pointer overflow-hidden block">
        {profile.cover_pic && (
          <img
            src={profile.cover_pic}
            className="absolute inset-0 w-full h-full object-cover"
            alt="cover"
          />
        )}

        {!profile.cover_pic && (
          <div className="flex justify-center items-center w-full h-full">
            <p className="text-white text-lg">Upload Cover</p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "cover_pic")}
          className="hidden"
        />
      </label>

      {/* PROFILE INFO */}
      <div className="flex justify-between items-center">
        <div className="relative flex items-center gap-6">
          
          {/* PROFILE PIC */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-300 overflow-hidden cursor-pointer border-4 border-white">
              <label className="cursor-pointer w-full h-full flex items-center justify-center">
                {profile.profile_pic ? (
                  <img
                    src={profile.profile_pic}
                    className="w-full h-full object-cover"
                    alt="profile"
                  />
                ) : (
                  <span className="text-gray-700">Upload</span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "profile_pic")}
                  className="hidden"
                />
              </label>
            </div>

            <label className="absolute bottom-1 right-1 bg-[#263247] p-1 rounded-full cursor-pointer">
              <Camera size={18} color="white" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "profile_pic")}
                className="hidden"
              />
            </label>
          </div>

          {/* NAME + SKILLS */}
          <div>
            <h1 className="text-3xl text-black font-semibold">{profile.full_name}</h1>
            <p className="text-gray-700">@{profile.username}</p>

            {/* SKILLS */}
            {profile.skills?.length > 0 && (
              <div className="mt-3">
                <h2 className="font-semibold text-lg text-black mb-1">Skills</h2>

                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, index) => (
                    <SkillBadge key={index} skill={skill} Icon={SKILL_ICONS[skill] || Users} />
                  ))}
                </div>
              </div>
            )}

            {/* BIO */}
            <p className="text-gray-800 mt-4">{profile.bio}</p>
          </div>
        </div>

        <button
          className="flex items-center gap-2 text-black bg-white px-4 py-2 rounded-lg shadow"
          onClick={() => router.push("/profile/edit")}
        >
          <Settings size={20} /> Edit profile
        </button>
      </div>
    </div>
  );
}
