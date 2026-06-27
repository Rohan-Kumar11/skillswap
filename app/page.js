"use client";
// app/page.js - FIXED SESSION HANDLING

"use client";
// app/page.js - PART 1: Imports and Setup

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SkillSwapLanding() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // PART 2: Main useEffect - THIS IS THE KEY FIX!
  // PART 2: Main useEffect - COMPLETE FIX
  useEffect(() => {
    // ✅ CHECK IF COMING FROM "ADD ANOTHER ACCOUNT"
    const isAddingAccount = searchParams.get('action') === 'add-account';

    if (isAddingAccount) {
      console.log('➕ Add account mode - skipping auth check');
      setCheckingAuth(false);
      setAuthModalOpen(true);
      // Don't set up auth listener when adding account
      return;
    }

    checkAuth();

    // Listen for auth state changes ONLY if not adding account
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);

        // Ignore SIGNED_OUT events when we're in add-account mode
        const currentlyAddingAccount = window.location.search.includes('action=add-account');

        if (currentlyAddingAccount && event === 'SIGNED_OUT') {
          console.log('⏭️ Ignoring SIGNED_OUT during add account flow');
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in:', session.user.id);
          await handleAuthSuccess(session);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, searchParams]);
  // PART 3: Auth Functions
  const checkAuth = async () => {
    try {
      setCheckingAuth(true);
      console.log('🔍 Checking existing session...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session check error:', error);
        return;
      }

      if (session) {
        console.log('✅ Existing session found');
        await handleAuthSuccess(session);
      } else {
        console.log('ℹ️ No existing session');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  // REPLACE the handleAuthSuccess function (around line 100-125) with this:

  const handleAuthSuccess = async (session) => {
    try {
      console.log('🔍 Checking profile for user:', session.user.id);

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profile_user')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      // Close modal first - FIXED
      setAuthModalOpen(false);

      // Small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 300));

      if (profile) {
        console.log('✅ Profile exists, redirecting to profile');
        window.location.href = '/profile';
      } else {
        console.log('📝 No profile, redirecting to onboarding');
        window.location.href = '/onboarding/interests?mode=new';
      }
    } catch (error) {
      console.error('❌ Error in handleAuthSuccess:', error);
    }
  };

  const handleGetStarted = () => {
    setAuthModalOpen(true);
  };

  const onAuthSuccess = (isNewUser) => {
    console.log('✅ Auth modal success, new user:', isNewUser);
    // Navigation will be handled by auth state listener
  };

  // PART 4: Loading and JSX
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black text-white overflow-hidden">
      {/* Custom Cursor */}
      <div
        className="fixed w-8 h-8 border-2 border-cyan-400 rounded-full pointer-events-none z-50 mix-blend-difference transition-transform duration-150"
        style={{
          left: mousePos.x - 16,
          top: mousePos.y - 16,
        }}
      />
      <div
        className="fixed w-2 h-2 bg-cyan-400 rounded-full pointer-events-none z-50"
        style={{
          left: mousePos.x - 4,
          top: mousePos.y - 4,
        }}
      />

      <BackgroundEffects />
      <Header onAuthClick={handleGetStarted} />
      <HeroSection onGetStarted={handleGetStarted} />

      <section id="features">
        <FeaturesSection />
      </section>

      <section id="how-it-works">
        <HowItWorksSection />
      </section>

      <section id="testimonials">
        <TestimonialsSection />
      </section>

      <CTASection onGetStarted={handleGetStarted} />
      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={onAuthSuccess}
      />
    </div>
  );
}

// PART 5: Components - Header, Background, Hero

function Header({ onAuthClick }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          SkillSwap
        </div>
        <button
          onClick={onAuthClick}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          Get Started
        </button>
      </div>
    </header>
  );
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
    </div>
  );
}

function HeroSection({ onGetStarted }) {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30">
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🚀 The Future of Learning is Here
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Exchange Skills,
          </span>
          <br />
          <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Grow Together
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Join the world's first decentralized skill-sharing platform.
          <span className="text-purple-400 font-semibold"> Trade your expertise</span> for knowledge you want to learn.
        </p>

        <button
          onClick={onGetStarted}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
        >
          Start Swapping →
        </button>

        <div className="mt-16 grid grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: 'Web Dev', color: 'from-cyan-400 to-blue-500', icon: '💻' },
            { name: 'Design', color: 'from-pink-400 to-purple-500', icon: '🎨' },
            { name: 'Marketing', color: 'from-orange-400 to-red-500', icon: '📱' },
            { name: 'Music', color: 'from-green-400 to-emerald-500', icon: '🎵' },
            { name: 'Coding', color: 'from-yellow-400 to-orange-500', icon: '⚡' },
            { name: 'Writing', color: 'from-indigo-400 to-purple-500', icon: '✍️' },
          ].map((skill, i) => (
            <div
              key={i}
              className={`px-4 py-3 bg-gradient-to-r ${skill.color} rounded-full font-bold text-sm text-center`}
            >
              <span className="mr-1">{skill.icon}</span>
              {skill.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// PART 6: Features, How It Works, Testimonials

function FeaturesSection() {
  const features = [
    { icon: '🌍', title: 'Connect Globally', desc: 'Meet skilled individuals from around the world' },
    { icon: '⚡', title: 'Interest Matching', desc: 'Match with the interest you want' },
    { icon: '📈', title: 'Consistent Growth', desc: 'Steady steps fuel exponential growth' },
    { icon: '✨', title: 'Verified Skills', desc: 'Learn from the best' }
  ];

  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Why SkillSwap?
        </h2>
        <p className="text-center text-gray-400 text-xl mb-16">Experience the future of peer-to-peer learning</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-white/30 transition-all duration-500 hover:transform hover:scale-105"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: '01', title: 'Register', desc: 'Sign up for using the platform', icon: '👥' },
    { step: '02', title: 'Choose Interest', desc: 'Select skills you want to learn', icon: '✨' },
    { step: '03', title: 'Find a Match', desc: 'Meet people to share and learn skills', icon: '🤝' },
    { step: '04', title: 'Start Learning', desc: 'Exchange knowledge and grow', icon: '🚀' }
  ];

  return (
    <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-purple-900/10 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl mb-6">
                {item.icon}
              </div>
              <div className="text-6xl font-black text-white/10 mb-4">{item.step}</div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: 'Alex Chen', skill: 'Learned Python', avatar: '👨‍💻', quote: 'Traded my design skills for coding. Best decision ever!' },
    { name: 'Sarah Kim', skill: 'Learned Design', avatar: '👩‍🎨', quote: 'Found my design mentor in exchange for marketing tips.' },
    { name: 'Mike Johnson', skill: 'Learned Music', avatar: '👨‍🎤', quote: 'Swapped video editing skills for guitar lessons!' }
  ];

  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Success Stories
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((person, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105"
            >
              <div className="text-6xl mb-4">{person.avatar}</div>
              <p className="text-gray-300 italic mb-4">"{person.quote}"</p>
              <div className="font-bold">{person.name}</div>
              <div className="text-sm text-purple-400">{person.skill}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// PART 7: CTA and Footer

function CTASection({ onGetStarted }) {
  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative p-16 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 animate-pulse" />

          <h2 className="relative text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Ready to Transform Your Learning?
          </h2>
          <p className="relative text-xl text-gray-300 mb-8">
            Join 50,000+ skill swappers already growing together
          </p>
          <button
            onClick={onGetStarted}
            className="relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-110"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          SkillSwap
        </div>
        <div className="flex gap-8 text-gray-400">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Blog</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>
        <div className="text-gray-500">
          © 2025 SkillSwap. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// PART 8: AuthModal - Setup

function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  // NEW: Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // NEW: Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digits
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };
  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle paste in OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtp(newOtp);
  };
  // ADD these functions inside AuthModal (after handleChange, before handleSubmit):

  // Send OTP to email
  // Send OTP to email
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Supabase sends OTP via email
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase()
      );

      if (error) throw error;

      console.log('✅ Password reset OTP sent to email');
      setShowOtpInput(true);
      setShowForgotPassword(false);
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and show reset password form
  // Verify OTP code
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: resetEmail.trim().toLowerCase(),
        token: otpCode,
        type: 'recovery'
      });

      if (error) throw error;

      console.log('✅ OTP verified successfully');
      setShowOtpInput(false);
      setShowResetPassword(true);
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      console.log('✅ Password reset successful');

      // Reset states and show login
      setShowResetPassword(false);
      setResetEmail('');
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setIsLogin(true);
      setError('');

      // Show success message
      alert('Password reset successful! Please login with your new password.');
    } catch (err) {
      console.error('❌ Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset all states when modal closes
      setShowEmailConfirmation(false);
      setConfirmationEmail('');
      setError('');
      setLoading(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowForgotPassword(false);
      setShowOtpInput(false);
      setShowResetPassword(false);
      setResetEmail('');
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setFormData({
        full_name: '',
        username: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [isOpen]);


  // PART 9: AuthModal - handleSubmit

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔐 Attempting login...');

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });

        if (authError) {
          console.error('❌ Login error:', authError);

          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('Incorrect email or password. Please try again.');
          } else if (authError.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email before logging in. Check your inbox.');
          }

          throw authError;
        }

        if (!data.session) {
          throw new Error('Login failed. Please try again.');
        }

        console.log('✅ Login successful');

        // Close modal immediately
        onClose();  // ✅ FIXED: Use onClose() instead of setAuthModalOpen(false)

        // Check profile and redirect
        const { data: profile } = await supabase
          .from('profile_user')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // Direct navigation without waiting for auth listener
        setTimeout(() => {
          if (profile) {
            window.location.href = '/profile';
          } else {
            window.location.href = '/onboarding/interests?mode=new';
          }
        }, 500);
      } else {
        console.log('📝 Attempting signup...');

        if (!formData.full_name || !formData.username || !formData.email || !formData.password) {
          throw new Error('Please fill in all required fields');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const cleanEmail = formData.email.trim().toLowerCase();
        const cleanUsername = formData.username.trim().toLowerCase().replace(/\s/g, '');

        const { data: existingUser } = await supabase
          .from('profile_user')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error('Username already taken. Please choose another.');
        }

        console.log('✅ Username available, creating account...');

        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: formData.full_name.trim(),
              username: cleanUsername,
              mobile: formData.mobile?.trim() || ''
            }
          }
        });

        if (authError) {
          console.error('❌ Signup error:', authError);

          if (authError.message.includes('already registered')) {
            throw new Error('This email is already registered. Please login instead.');
          }

          throw authError;
        }

        console.log('✅ Signup response:', data);

        if (data.user && !data.session) {
          console.log('📧 Email confirmation required');
          setConfirmationEmail(cleanEmail);
          setShowEmailConfirmation(true);
          return;
        }

        if (data.user && data.session) {
          console.log('✅ User auto-confirmed');
          onSuccess(true);
        }
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  // ADD these screens BEFORE the regular auth form in AuthModal (after "if (!isOpen) return null;"):

  // Forgot Password - Email Input Screen
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowForgotPassword(false)} />

        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl p-8 border border-purple-500/30">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ×
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Reset Password
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your email to receive a reset link
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <input
            type="email"
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
            placeholder="Enter your email"
            className="w-full px-4 py-3 mb-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={handleForgotPassword}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            onClick={() => setShowForgotPassword(false)}
            className="w-full mt-3 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // OTP Input Screen
  // OTP Input Screen
  if (showOtpInput) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl p-8 border border-purple-500/30">
          <button
            onClick={() => {
              setShowOtpInput(false);
              setShowForgotPassword(true);
              setOtp(['', '', '', '', '', '']);
            }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ×
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Enter Verification Code
            </h2>
            <p className="text-gray-400 text-sm mb-2">
              We sent a 6-digit code to:
            </p>
            <p className="text-cyan-400 font-semibold text-sm mb-6">
              {resetEmail}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* OTP Input Boxes */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {loading ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </div>

          <button
            onClick={() => {
              setShowOtpInput(false);
              setShowForgotPassword(true);
              setOtp(['', '', '', '', '', '']);
            }}
            className="w-full mt-3 py-3 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Reset Password Screen
  if (showResetPassword) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl p-8 border border-purple-500/30">
          <button
            onClick={() => {
              setShowResetPassword(false);
              setShowForgotPassword(false);
            }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ×
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4">
              <span className="text-3xl">🔑</span>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Create New Password
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your new password
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="New Password"
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                placeholder="Confirm New Password"
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PART 10: AuthModal - Email Confirmation Screen

  if (showEmailConfirmation) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl p-8 border border-purple-500/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ×
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-6">
              <span className="text-4xl">📧</span>
            </div>

            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-300 mb-2">
              We've sent a confirmation link to:
            </p>
            <p className="text-cyan-400 font-semibold mb-6">
              {confirmationEmail}
            </p>

            <p className="text-gray-400 text-sm mb-8">
              Click the link in your email to complete your registration and start using SkillSwap.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular auth form
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl p-8 border border-purple-500/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {isLogin ? 'Welcome Back!' : 'Join SkillSwap'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Continue your learning journey' : 'Start swapping skills today'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-full">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 px-6 py-2 rounded-full font-semibold transition-all ${isLogin ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'text-gray-400'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 px-6 py-2 rounded-full font-semibold transition-all ${!isLogin ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'text-gray-400'
              }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full Name *"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username *"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </>
          )}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Email *"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {!isLogin && (
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile (Optional)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}



          {/* Password with Eye Icon */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Password *"
              required
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Confirm Password with Eye Icon - Only for Sign Up */}
          {!isLogin && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Confirm Password *"
                required
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Forgot Password Link - Only show on login */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to SkillSwap's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}