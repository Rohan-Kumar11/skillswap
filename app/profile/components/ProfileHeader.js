"use client";
import React from "react";
import { Camera, Settings, Users, Award, Target, TrendingUp, MapPin } from "lucide-react";

function SkillBadge({ skill, Icon }) {
  return (
    <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
      <Icon size={14} className="text-[#263247]" />
      <span className="text-sm font-medium text-gray-800">{skill}</span>
    </div>
  );
}

function SkillOfferedBadge({ skill, Icon }) {
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:border-[#263247] hover:bg-[#263247] hover:text-white transition-all duration-200 cursor-pointer group">
      <Icon size={16} className="text-gray-700 group-hover:text-white transition-colors" />
      <span className="text-sm font-medium text-gray-900 group-hover:text-white transition-colors">{skill}</span>
    </div>
  );
}

export default function ProfileHeader({ profile, openCropper, router, SKILL_ICONS }) {
  return (
    <div>
      {/* COVER IMAGE */}
      <label className="w-full h-40 bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-2xl mb-6 relative cursor-pointer overflow-hidden block group">
        {profile.cover_pic && (
          <img
            src={profile.cover_pic}
            className="absolute inset-0 w-full h-full object-cover"
            alt="cover"
          />
        )}

        {!profile.cover_pic && (
          <div className="flex justify-center items-center w-full h-full">
            <div className="text-center">
              <Camera size={32} className="mx-auto mb-2 text-white/80" />
              <p className="text-white text-lg font-medium">Upload Cover Photo</p>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <Camera size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "cover_pic")}
          className="hidden"
        />
      </label>

      {/* PROFILE INFO */}
      <div className="flex justify-between items-start">
        <div className="relative flex items-start gap-6">
          
          {/* PROFILE PIC */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#263247] to-[#1e293b] overflow-hidden cursor-pointer border-4 border-white shadow-xl group">
              <label className="cursor-pointer w-full h-full flex items-center justify-center relative">
                {profile.profile_pic ? (
                  <>
                    <img
                      src={profile.profile_pic}
                      className="w-full h-full object-cover"
                      alt="profile"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Camera size={28} className="mx-auto mb-1 text-white" />
                    <span className="text-white text-xs font-medium">Upload</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "profile_pic")}
                  className="hidden"
                />
              </label>
            </div>

            <label className="absolute bottom-1 right-1 bg-[#263247] hover:bg-[#1e293b] p-2 rounded-full cursor-pointer shadow-lg transition-colors">
              <Camera size={16} color="white" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && openCropper(e.target.files[0], "profile_pic")}
                className="hidden"
              />
            </label>
          </div>

          {/* NAME + INFO */}
          <div className="flex-1">
            <div className="mb-3">
              <h1 className="text-3xl text-gray-900 font-bold mb-1">{profile.full_name}</h1>
              <p className="text-gray-600 font-medium">@{profile.username}</p>
              
              {/* Location */}
              {(profile.city || profile.state || profile.country) && (
                <div className="flex items-center gap-1.5 mt-2 text-gray-600">
                  <MapPin size={16} />
                  <span className="text-sm">
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* BIO */}
            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* SKILLS OFFERED SECTION - SIMPLE BADGES */}
            {profile.skills_offered?.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {profile.skills_offered?.map((skill, index) => (
                    <SkillOfferedBadge 
                      key={index} 
                      skill={skill} 
                      Icon={SKILL_ICONS[skill] || Users} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ALL SKILLS */}
            {profile.skills?.length > 0 && (
              <div className="mt-4">
                <h2 className="font-semibold text-base text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#263247] rounded-full"></span>
                  All Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, index) => (
                    <SkillBadge key={index} skill={skill} Icon={SKILL_ICONS[skill] || Users} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="flex items-center gap-2 text-gray-900 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg font-medium"
          onClick={() => router.push("/profile/edit")}
        >
          <Settings size={18} /> Edit Profile
        </button>
      </div>
    </div>
  );
}