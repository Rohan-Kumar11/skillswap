"use client";
// app/profile/edit/page.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Trash2, Check, X, Search, User, Award, Images, CheckCircle, XCircle, Info, ArrowLeft, Sparkles, Edit3, Plus, MapPin, Globe } from "lucide-react";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />
  };

  const styles = {
    success: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
    error: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
    info: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
  };

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${styles[type]} backdrop-blur-sm border border-white/20 min-w-[320px] transform transition-all duration-300 ease-out animate-[slideInRight_0.3s_ease-out]`}
        style={{
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default function EditProfilePage() {
  const router = useRouter();

  const SKILL_OPTIONS = [
    "Web Development", "UI/UX Design", "Graphic Design", "Photography",
    "Video Editing", "Content Writing", "Digital Marketing",
    "Python", "C Programming", "Java", "Mobile Repairing",
    "Electronics", "Public Speaking", "Leadership", "Data Science",
    "Machine Learning", "Cloud Computing", "Cybersecurity"
  ];
  const GENDER_OPTIONS = [
    { value: "male", label: "Male", emoji: "👨" },
    { value: "female", label: "Female", emoji: "👩" },
    { value: "non-binary", label: "Non-Binary", emoji: "🧑" },
    { value: "other", label: "Other", emoji: "✨" },
    { value: "prefer-not-to-say", label: "Prefer not to say", emoji: "🔒" }
  ];

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [posts, setPosts] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Load user data and posts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Load user from localStorage
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error("❌ Auth error:", authError);
      router.push("/");
      return;
    }

    setUser(authUser);

    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profile_user")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
      } else if (profileData) {
        setName(profileData.full_name || "");
        setUsername(profileData.username || "");
        setBio(profileData.bio || "");
        setSkills(profileData.skills_offered || []);
        setInterests(profileData.skills_wanted || []);
        setProfilePic(profileData.profile_pic || "");
        setCity(profileData.city || "");
        setState(profileData.state || "");
        setCountry(profileData.country || "");

        // ✅ NEW: Load DOB and Gender
        setDateOfBirth(profileData.date_of_birth || "");
        setGender(profileData.gender || "");
      }

      // Load user's posts
      const { data: postsData, error: postsError } = await supabase
        .from("post")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error loading posts:", postsError);
        setPosts([]);
      } else if (postsData) {
        setPosts(postsData);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showToast('Failed to upload image. Please try again.', 'error');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pics')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update database
      const { error: updateError } = await supabase
        .from('profile_user')
        .update({ profile_pic: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        showToast('Failed to update profile picture. Please try again.', 'error');
        return;
      }

      // Update local state
      setProfilePic(publicUrl);

      // Update localStorage
      const updatedUser = { ...user, profile_pic: publicUrl };
      localStorage.setItem('swapp_user', JSON.stringify(updatedUser));

      showToast('Profile picture updated successfully! 🎉', 'success');
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profile_user")
        .update({
          full_name: name,
          username,
          bio,
          skills_offered: skills,
          city,
          state,
          country,
          // ✅ NEW: Include DOB and Gender in update
          date_of_birth: dateOfBirth || null,
          gender: gender || null
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error saving profile:", error);
        showToast('Failed to save profile. Please try again.', 'error');
        return;
      }

      if (data) {
        localStorage.setItem("swapp_user", JSON.stringify(data));
        setSaveSuccess(true);
        showToast('Profile updated successfully! ✨', 'success');
        setTimeout(() => {
          setSaveSuccess(false);
          router.push('/profile');
        }, 1500);
      }
    } catch (error) {
      console.error("Error in saveProfile:", error);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from("post")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        showToast('Failed to delete post. Please try again.', 'error');
        return;
      }

      // Remove post from local state
      setPosts(posts.filter(p => p.id !== postId));
      setDeleteConfirmId(null);
      showToast('Post deleted successfully! 🗑️', 'success');
    } catch (error) {
      console.error("Error in deletePost:", error);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const handleChangeInterests = () => {
    // Redirect to interests page with mode=change
    router.push('/onboarding/interests?mode=change');
  };

  const handleAddInterests = () => {
    // Redirect to interests page with mode=add
    router.push('/onboarding/interests?mode=add');
  };
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Get today's date in YYYY-MM-DD format for max date validation
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get date 13 years ago (minimum age)
  const getMinAgeDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const filteredSkills = SKILL_OPTIONS.filter((sk) =>
    sk.toLowerCase().includes(search.toLowerCase())
  );
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use reverse geocoding API (OpenStreetMap Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );

          const data = await response.json();

          if (data && data.address) {
            const detectedCity = data.address.city || data.address.town || data.address.village || '';
            const detectedState = data.address.state || '';
            const detectedCountry = data.address.country || '';

            setCity(detectedCity);
            setState(detectedState);
            setCountry(detectedCountry);

            // Also update latitude and longitude in database
            await supabase
              .from('profile_user')
              .update({
                latitude,
                longitude,
                city: detectedCity,
                state: detectedState,
                country: detectedCountry
              })
              .eq('id', user.id);

            showToast('Location detected successfully! 📍', 'success');
          }
        } catch (error) {
          console.error('Error detecting location:', error);
          showToast('Failed to detect location. Please enter manually.', 'error');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Unable to access your location. Please enable location permissions.', 'error');
        setDetectingLocation(false);
      }
    );
  };

  const INTEREST_EMOJIS = {
    programming: '💻',
    design: '🎨',
    music: '🎵',
    languages: '🌍',
    cooking: '🍳',
    photography: '📸',
    writing: '✍️',
    fitness: '💪',
    business: '💼',
    crafts: '✂️',
    gaming: '🎮',
    education: '📚',
    art: '🖼️',
    technology: '⚡',
    marketing: '📊',
    video: '🎥',
    dance: '💃',
    gardening: '🌱',
    fashion: '👗',
    sports: '⚽'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 ml-64">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/profile')}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
                title="Back to Profile"
              >
                <ArrowLeft size={22} className="text-slate-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-sm text-slate-600">Manage your profile and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-lg border border-slate-200/50">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === "profile"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <User size={20} />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab("post")}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === "post"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <Images size={20} />
            <span>Posts</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs">
              {posts.length}
            </span>
          </button>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-3 animate-fade-in shadow-lg">
            <Check className="text-emerald-600" size={22} />
            <span className="text-emerald-800 font-semibold">Profile updated successfully! Redirecting...</span>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-8">
              <div className="space-y-8 max-w-3xl">
                {/* Profile Picture Section */}
                <div className="pb-6 border-b border-slate-200">
                  <label className="block font-bold text-slate-800 mb-4 text-base flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600" />
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-white">
                        {profilePic ? (
                          <img
                            src={profilePic}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{name.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Sparkles className="text-white" size={24} />
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="profile-pic-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="profile-pic-upload"
                        className={`px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer inline-block shadow-lg ${uploadingImage
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl hover:scale-105'
                          }`}
                      >
                        {uploadingImage ? 'Uploading...' : 'Change Photo'}
                      </label>
                      <p className="text-xs text-slate-600 mt-3 font-medium">Max 5MB • JPG, PNG, GIF</p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block font-bold text-slate-800 mb-3 text-sm">Full Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-3 text-sm">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-purple-600 font-bold text-lg">@</span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-3 text-sm">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={200}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none font-medium"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-slate-500 font-medium">{bio.length}/200 characters</p>
                      {bio.length > 180 && (
                        <span className="text-xs text-amber-600 font-semibold">Almost at limit!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="space-y-6 pb-6 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <User size={20} className="text-indigo-600" />
                    Personal Information
                  </h3>

                  {/* Date of Birth */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-3 text-sm">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max={getMinAgeDate()}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                    />
                    {dateOfBirth && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <span className="text-sm text-indigo-700 font-semibold">
                            Age: {calculateAge(dateOfBirth)} years
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      Must be at least 13 years old
                    </p>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-3 text-sm">Gender</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {GENDER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setGender(option.value)}
                          className={`p-4 rounded-xl border-2 transition-all font-semibold text-left flex items-center gap-3 ${gender === option.value
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-500 shadow-lg scale-105'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div className="flex-1">
                            <span className={`text-sm ${gender === option.value ? 'text-indigo-700' : 'text-slate-700'
                              }`}>
                              {option.label}
                            </span>
                          </div>
                          {gender === option.value && (
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Optional: Clear selection button */}
                    {gender && (
                      <button
                        type="button"
                        onClick={() => setGender("")}
                        className="mt-3 text-sm text-slate-600 hover:text-slate-800 font-semibold underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="pb-6 border-b border-slate-200">
                  <label className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-base">
                    <Award size={20} className="text-blue-600" />
                    Skills & Expertise
                  </label>

                  <button
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 mb-4"
                    onClick={() => setSkillsModalOpen(true)}
                  >
                    {skills.length > 0 ? "✏️ Edit Skills" : "➕ Add Skills"}
                  </button>

                  <div className="flex flex-wrap gap-3">
                    {skills.length === 0 ? (
                      <div className="w-full p-6 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 text-center">
                        <Award size={32} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-600 font-medium">No skills added yet</p>
                        <p className="text-sm text-slate-500">Click the button above to showcase your expertise</p>
                      </div>
                    ) : (
                      skills.map((s) => (
                        <span
                          key={s}
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                {/* Location Section */}
                <div className="pb-6 border-b border-slate-200">
                  <label className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-base">
                    <MapPin size={20} className="text-green-600" />
                    Location
                  </label>

                  <button
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 mb-4 flex items-center gap-2 ${detectingLocation
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      }`}
                  >
                    <Globe size={18} />
                    {detectingLocation ? 'Detecting Location...' : '📍 Detect My Location'}
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                        placeholder="e.g., Ghaziabad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">State/Province</label>
                      <input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                        placeholder="e.g., Uttar Pradesh"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
                        placeholder="e.g., India"
                      />
                    </div>
                  </div>

                  {(city || state || country) && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MapPin size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-800 mb-1">Your Location</p>
                          <p className="text-green-700">
                            {[city, state, country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={saveProfile}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-2xl transition-all transform hover:scale-105 text-lg"
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Interests Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-8">
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                      <Sparkles size={22} className="text-pink-600" />
                      Your Interests
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">What you're passionate about</p>
                  </div>
                  <div className="flex gap-3">
                    {interests.length > 0 && (
                      <button
                        onClick={handleChangeInterests}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
                      >
                        <Edit3 size={16} />
                        Change
                      </button>
                    )}
                    <button
                      onClick={handleAddInterests}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                      <Plus size={16} />
                      {interests.length > 0 ? 'Add More' : 'Add Interests'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {interests.length === 0 ? (
                    <div className="w-full p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-dashed border-purple-300 text-center">
                      <Sparkles size={40} className="mx-auto text-purple-400 mb-3" />
                      <p className="text-slate-700 font-semibold text-lg mb-1">No interests yet!</p>
                      <p className="text-sm text-slate-600">Add interests to connect with like-minded people</p>
                    </div>
                  ) : (
                    interests.map((interest) => (
                      <div
                        key={interest}
                        className="group relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
                      >
                        <span className="text-xl">{INTEREST_EMOJIS[interest] || '🎯'}</span>
                        <span className="capitalize">{interest.replace('-', ' ')}</span>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Management Tab */}
        {activeTab === "post" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Images size={48} className="text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">No posts yet</h3>
                  <p className="text-slate-600 text-lg">Start sharing your skills and knowledge with the community!</p>
                </div>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-200 group">
                  <div className="flex gap-5">
                    {post.image_url && (
                      <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-32 h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 mb-3 line-clamp-3 leading-relaxed font-medium">{post.content}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {deleteConfirmId === post.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => deletePost(post.id)}
                            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:scale-110 shadow-lg"
                            title="Confirm delete"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all hover:scale-110"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(post.id)}
                          className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all hover:scale-110 hover:shadow-lg"
                          title="Delete post"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Skills Modal */}
      {skillsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col transform animate-scale-in">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Select Your Skills
              </h2>
              <p className="text-slate-600 text-sm mt-2 font-medium">Choose skills that represent your expertise</p>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {filteredSkills.length === 0 ? (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-semibold text-lg">No skills found</p>
                  <p className="text-slate-500 text-sm mt-1">Try searching with different keywords</p>
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <label
                    key={skill}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${skills.includes(skill)
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 border-purple-400 shadow-md scale-[1.02]"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                      }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={skills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="w-6 h-6 accent-purple-600 cursor-pointer rounded-lg"
                      />
                      {skills.includes(skill) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <span className={`font-bold text-base ${skills.includes(skill) ? "text-purple-700" : "text-slate-800"}`}>
                      {skill}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-purple-50 rounded-b-3xl">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {skills.length}
                </div>
                <span className="text-sm text-slate-700 font-semibold">
                  skill{skills.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSkillsModalOpen(false);
                    setSearch("");
                  }}
                  className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSkillsModalOpen(false);
                    setSearch("");
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all hover:scale-105"
                >
                  Done ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add these styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}