"use client";
// app/onboarding/interests/page.js - FIXED AUTH HANDLING

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SKILL_CATEGORIES = [
  { id: 'programming', name: 'Programming', emoji: '💻', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'design', name: 'Design', emoji: '🎨', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'music', name: 'Music', emoji: '🎵', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'languages', name: 'Languages', emoji: '🌍', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'cooking', name: 'Cooking', emoji: '🍳', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'photography', name: 'Photography', emoji: '📸', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { id: 'writing', name: 'Writing', emoji: '✍️', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'fitness', name: 'Fitness', emoji: '💪', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'business', name: 'Business', emoji: '💼', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'crafts', name: 'Crafts', emoji: '✂️', gradient: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', gradient: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)' },
  { id: 'education', name: 'Education', emoji: '📚', gradient: 'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 90%)' },
  { id: 'art', name: 'Art', emoji: '🖼️', gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)' },
  { id: 'technology', name: 'Technology', emoji: '⚡', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  { id: 'marketing', name: 'Marketing', emoji: '📊', gradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)' },
  { id: 'video', name: 'Video', emoji: '🎥', gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)' },
  { id: 'dance', name: 'Dance', emoji: '💃', gradient: 'linear-gradient(135deg, #f2709c 0%, #ff9472 100%)' },
  { id: 'gardening', name: 'Gardening', emoji: '🌱', gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' },
  { id: 'fashion', name: 'Fashion', emoji: '👗', gradient: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)' },
  { id: 'sports', name: 'Sports', emoji: '⚽', gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' }
];

export default function InterestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [existingInterests, setExistingInterests] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading user data...');
      
      // Get session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // ✅ FIX: Better error handling
      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        router.push('/');
        return;
      }

      if (!session) {
        console.log("❌ No active session found");
        router.push('/');
        return;
      }
      
      console.log('✅ Session found:', session.user.id);
      setUser(session.user);

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profile_user')
        .select('skills_wanted')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("❌ Profile fetch error:", profileError);
        throw profileError;
      }

      if (profileData) {
        const interests = profileData.skills_wanted || [];
        setExistingInterests(interests);
        
        if (mode === 'add') {
          setSelectedInterests(interests);
        }
        console.log('✅ Loaded existing interests:', interests);
      } else {
        console.log('ℹ️ No profile found yet (will be created on save)');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      alert('Failed to load data. Please try again.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = async () => {
    if (selectedInterests.length < 3 && mode === 'new') {
      alert('Please select at least 3 interests to continue');
      return;
    }

    if (selectedInterests.length === 0) {
      alert('Please select at least one interest');
      return;
    }

    if (!user) {
      alert('User not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving interests for user:', user.id);

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profile_user')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Check error:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        // Profile exists, update it
        console.log('📝 Updating existing profile...');
        const { error: updateError } = await supabase
          .from('profile_user')
          .update({ skills_wanted: selectedInterests })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }
      } else {
        // Profile doesn't exist, create it
        console.log('📝 Creating new profile...');
        const { error: insertError } = await supabase
          .from('profile_user')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || '',
            email: user.email,
            mobile: user.user_metadata?.mobile || '',
            skills_wanted: selectedInterests,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Interests saved successfully');

      // Redirect based on mode
      if (mode === 'new') {
        router.push('/profile');
      } else {
        router.push('/profile/edit');
      }
    } catch (error) {
      console.error('❌ Error saving interests:', error);
      alert(`Failed to save interests: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (mode === 'new') {
      supabase.auth.signOut();
      router.push('/');
    } else {
      router.push('/profile/edit');
    }
  };

  const getProgressPercentage = () => {
    if (mode === 'new') {
      return Math.min((selectedInterests.length / 3) * 100, 100);
    }
    return 100;
  };

  const getHeaderText = () => {
    if (mode === 'change') {
      return {
        title: 'Change Your Interests',
        subtitle: 'Select new interests to replace your current ones'
      };
    } else if (mode === 'add') {
      return {
        title: 'Add More Interests',
        subtitle: 'Your current interests are already selected'
      };
    }
    return {
      title: 'What are you interested in?',
      subtitle: selectedInterests.length === 0 ? 'Pick 3 or more to continue' :
                selectedInterests.length < 3 ? `Pick ${3 - selectedInterests.length} more to continue` :
                `${selectedInterests.length} selected - Great! 🎉`
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const headerText = getHeaderText();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 ${mode === 'new' ? '' : 'ml-64'}`}>
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            {mode !== 'new' && (
              <button
                onClick={() => router.push('/profile/edit')}
                className="text-gray-600 hover:text-gray-800 font-semibold px-4 py-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {headerText.title}
          </h1>
          <p className="text-gray-700 text-lg md:text-xl font-medium">
            {headerText.subtitle}
          </p>
          
          {mode === 'add' && existingInterests.length > 0 && (
            <div className="mt-4 inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold">
              💡 Your {existingInterests.length} current interest{existingInterests.length !== 1 ? 's are' : ' is'} already selected
            </div>
          )}
        </div>

        {/* Interest Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {SKILL_CATEGORIES.map((category) => {
            const isSelected = selectedInterests.includes(category.id);
            const wasExisting = existingInterests.includes(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => toggleInterest(category.id)}
                className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                  isSelected ? 'scale-95 shadow-2xl ring-4 ring-white' : 'hover:scale-105 shadow-lg hover:shadow-2xl'
                }`}
                style={{ aspectRatio: '3/4' }}
              >
                <div 
                  className="absolute inset-0"
                  style={{ background: category.gradient }}
                />
                
                {isSelected && (
                  <div className="absolute inset-0 bg-black/20" />
                )}
                
                {mode === 'add' && wasExisting && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                    Current
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-110 z-10">
                    <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
                  </div>
                )}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="text-5xl md:text-6xl mb-3 transform transition-transform group-hover:scale-125 group-hover:rotate-12">
                    {category.emoji}
                  </div>
                  
                  <h3 className="font-bold text-white text-base md:text-lg leading-tight drop-shadow-2xl">
                    {category.name}
                  </h3>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className={`fixed bottom-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 py-5 px-4 shadow-2xl ${mode === 'new' ? 'left-0' : 'left-64'}`}>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={
              (mode === 'new' && selectedInterests.length < 3) || 
              selectedInterests.length === 0 || 
              saving
            }
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all transform ${
              (mode === 'new' && selectedInterests.length >= 3) || (mode !== 'new' && selectedInterests.length > 0)
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-2xl hover:shadow-3xl hover:scale-[1.02] active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : mode === 'new' && selectedInterests.length < 3 ? (
              `Pick ${3 - selectedInterests.length} more to continue`
            ) : mode === 'change' ? (
              'Save New Interests →'
            ) : mode === 'add' ? (
              'Add to My Interests →'
            ) : (
              'Continue to Profile →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}