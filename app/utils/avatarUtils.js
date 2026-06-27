// utils/avatarUtils.js
// Professional and stylish avatar utilities with modern DiceBear styles

/**
 * Generates an appropriate avatar URL based on user data
 * Uses modern, professional DiceBear styles for better visual appeal
 * @param {Object} user - User object with profile_pic, gender, username, full_name
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (user) => {
  if (!user) return generateFallbackAvatar('default');
  
  // If user has a valid profile_pic URL, use it
  if (user.profile_pic && user.profile_pic.trim() !== '') {
    // Check if it's already a full URL
    if (user.profile_pic.startsWith('http://') || user.profile_pic.startsWith('https://')) {
      return user.profile_pic;
    }
    
    // If it's a Supabase storage path, construct the full URL
    if (user.profile_pic.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${user.profile_pic}`;
    }
  }

  const name = user?.full_name || user?.username || 'User';
  const seed = user?.username || user?.full_name || 'anonymous';
  
  // Normalize gender for consistent matching
  const normalizeGender = (g) => {
    if (!g) return 'default';
    const normalized = g.toLowerCase().replace(/\s+/g, '-');
    if (['m', 'man', 'male'].includes(normalized)) return 'male';
    if (['f', 'woman', 'female'].includes(normalized)) return 'female';
    if (['nb', 'nonbinary', 'non-binary'].includes(normalized)) return 'non-binary';
    if (['prefer-not', 'prefer-not-to-say', 'na'].includes(normalized)) return 'prefer-not-to-say';
    return normalized;
  };
  
  const gender = normalizeGender(user?.gender);

  // Generate seed hash for consistent avatar selection
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seedHash = hashCode(seed);

  // Modern, professional avatar styles with gender-appropriate designs
  const avatarStyles = {
    male: [
      // Notionists - Modern hand-drawn style
      `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}-male&backgroundColor=dbeafe`,
      // Big Ears - Professional illustrated look
      `https://api.dicebear.com/9.x/big-ears/svg?seed=${seed}-male&backgroundColor=bfdbfe`,
      // Micah - Clean minimalist style
      `https://api.dicebear.com/9.x/micah/svg?seed=${seed}-male&backgroundColor=93c5fd`,
      // Personas - Modern flat design
      `https://api.dicebear.com/9.x/personas/svg?seed=${seed}-male&backgroundColor=60a5fa`,
    ],
    female: [
      // Notionists - Elegant hand-drawn style
      `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}-female&backgroundColor=fce7f3`,
      // Lorelei - Distinctly feminine, modern design
      `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}-female&backgroundColor=fbcfe8`,
      // Big Smile - Friendly and professional
      `https://api.dicebear.com/9.x/big-smile/svg?seed=${seed}-female&backgroundColor=f9a8d4`,
      // Adventurer - Stylish illustrated look
      `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}-female&backgroundColor=f0abfc`,
    ],
    'non-binary': [
      // Notionists Neutral - Modern minimalist
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=e9d5ff`,
      // Glass - Sleek modern geometric
      `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=d8b4fe`,
      // Miniavs - Clean professional style
      `https://api.dicebear.com/9.x/miniavs/svg?seed=${seed}&backgroundColor=c084fc`,
      // Thumbs - Abstract modern look
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=a78bfa`,
    ],
    other: [
      // Fun Emoji - Expressive and creative
      `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&backgroundColor=fef3c7`,
      // Croodles - Artistic doodle style
      `https://api.dicebear.com/9.x/croodles/svg?seed=${seed}&backgroundColor=fde68a`,
      // Dylan - Colorful illustrated style
      `https://api.dicebear.com/9.x/dylan/svg?seed=${seed}&backgroundColor=fcd34d`,
      // Open Peeps - Friendly illustrated characters
      `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=fbbf24`,
    ],
    'prefer-not-to-say': [
      // Initials - Simple and private
      `https://api.dicebear.com/9.x/initials/svg?seed=${name}&backgroundColor=f3f4f6&fontSize=50`,
      // Shapes - Abstract professional
      `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=e5e7eb`,
      // Rings - Elegant geometric
      `https://api.dicebear.com/9.x/rings/svg?seed=${seed}&backgroundColor=d1d5db`,
      // Glass - Modern minimalist
      `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=9ca3af`,
    ],
    default: [
      // Notionists Neutral - Professional default
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=e0e7ff`,
      // Miniavs - Modern clean look
      `https://api.dicebear.com/9.x/miniavs/svg?seed=${seed}&backgroundColor=c7d2fe`,
      // Glass - Sleek professional
      `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=a5b4fc`,
      // Thumbs - Abstract modern
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=818cf8`,
    ]
  };

  // Select avatar based on seed hash for consistency
  const styleOptions = avatarStyles[gender] || avatarStyles.default;
  const selectedIndex = seedHash % styleOptions.length;
  return styleOptions[selectedIndex];
};

/**
 * Generate a fallback avatar URL using DiceBear
 */
export const generateFallbackAvatar = (seed) => {
  const cleanSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${cleanSeed}&backgroundColor=e0e7ff`;
};

/**
 * Get the first letter for letter-based avatars
 * Used as ultimate fallback if images fail to load
 */
export const getDisplayAvatar = (user) => {
  if (!user) return 'U';
  const name = user.username || user.full_name || 'U';
  return name.charAt(0).toUpperCase();
};

/**
 * Gets a random avatar style for the user
 * Provides variety while maintaining gender consistency
 */
export const getRandomAvatarUrl = (user) => {
  if (user?.profile_pic) {
    return user.profile_pic;
  }

  const name = user?.full_name || user?.username || 'User';
  const seed = user?.username || user?.full_name || 'anonymous';
  
  // Use the same normalization
  const normalizeGender = (g) => {
    if (!g) return 'default';
    const normalized = g.toLowerCase().replace(/\s+/g, '-');
    if (['m', 'man', 'male'].includes(normalized)) return 'male';
    if (['f', 'woman', 'female'].includes(normalized)) return 'female';
    if (['nb', 'nonbinary', 'non-binary'].includes(normalized)) return 'non-binary';
    if (['prefer-not', 'prefer-not-to-say', 'na'].includes(normalized)) return 'prefer-not-to-say';
    return normalized;
  };
  
  const gender = normalizeGender(user?.gender);

  const avatarStyles = {
    male: [
      `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}-m1&backgroundColor=dbeafe`,
      `https://api.dicebear.com/9.x/big-ears/svg?seed=${seed}-m2&backgroundColor=bfdbfe`,
      `https://api.dicebear.com/9.x/micah/svg?seed=${seed}-m3&backgroundColor=93c5fd`,
      `https://api.dicebear.com/9.x/personas/svg?seed=${seed}-m4&backgroundColor=60a5fa`,
    ],
    female: [
      `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}-f1&backgroundColor=fce7f3`,
      `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}-f2&backgroundColor=fbcfe8`,
      `https://api.dicebear.com/9.x/big-smile/svg?seed=${seed}-f3&backgroundColor=f9a8d4`,
      `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}-f4&backgroundColor=f0abfc`,
    ],
    'non-binary': [
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=e9d5ff`,
      `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=d8b4fe`,
      `https://api.dicebear.com/9.x/miniavs/svg?seed=${seed}&backgroundColor=c084fc`,
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=a78bfa`,
    ],
    other: [
      `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&backgroundColor=fef3c7`,
      `https://api.dicebear.com/9.x/croodles/svg?seed=${seed}&backgroundColor=fde68a`,
      `https://api.dicebear.com/9.x/dylan/svg?seed=${seed}&backgroundColor=fcd34d`,
      `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=fbbf24`,
    ],
    'prefer-not-to-say': [
      `https://api.dicebear.com/9.x/initials/svg?seed=${name}&backgroundColor=f3f4f6&fontSize=50`,
      `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=e5e7eb`,
      `https://api.dicebear.com/9.x/rings/svg?seed=${seed}&backgroundColor=d1d5db`,
    ],
    default: [
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=e0e7ff`,
      `https://api.dicebear.com/9.x/miniavs/svg?seed=${seed}&backgroundColor=c7d2fe`,
      `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=a5b4fc`,
    ]
  };

  const styleOptions = avatarStyles[gender] || avatarStyles.default;
  const randomIndex = Math.floor(Math.random() * styleOptions.length);
  return styleOptions[randomIndex];
};

/**
 * Gets avatar description for accessibility
 */
export const getAvatarDescription = (user) => {
  if (user?.profile_pic) {
    return `Profile picture of ${user.full_name || user.username}`;
  }

  const gender = user?.gender?.toLowerCase();
  const name = user?.full_name || user?.username || 'User';

  const descriptions = {
    male: `Generated masculine avatar for ${name}`,
    female: `Generated feminine avatar for ${name}`,
    'non-binary': `Generated gender-neutral avatar for ${name}`,
    other: `Generated creative avatar for ${name}`,
    'prefer-not-to-say': `Generated abstract avatar for ${name}`,
    default: `Generated avatar for ${name}`
  };

  return descriptions[gender] || descriptions.default;
};

/**
 * Get avatar background gradient based on name
 * Consistent colors for same names
 */
export const getAvatarGradient = (name) => {
  if (!name) return 'from-purple-500 to-pink-500';
  
  const gradients = [
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-teal-500 to-cyan-500',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-purple-500',
  ];
  
  // Use first character to pick gradient
  const charCode = name.charCodeAt(0);
  const index = charCode % gradients.length;
  
  return gradients[index];
};

/**
 * Gets avatar ring color based on gender
 */
export const getAvatarRingColor = (gender) => {
  const normalizedGender = gender?.toLowerCase()?.replace(/\s+/g, '-') || 'default';
  
  const colors = {
    male: 'ring-blue-400/60',
    female: 'ring-pink-400/60',
    'non-binary': 'ring-purple-400/60',
    other: 'ring-yellow-400/60',
    'prefer-not-to-say': 'ring-gray-400/60',
    default: 'ring-indigo-400/60'
  };

  // Additional normalization
  if (['m', 'man'].includes(normalizedGender)) return colors.male;
  if (['f', 'woman'].includes(normalizedGender)) return colors.female;
  if (['nb', 'nonbinary'].includes(normalizedGender)) return colors['non-binary'];
  if (['prefer-not', 'na', 'n/a'].includes(normalizedGender)) return colors['prefer-not-to-say'];

  return colors[normalizedGender] || colors.default;
};

/**
 * Gets avatar badge emoji based on gender
 */
export const getGenderBadge = (gender) => {
  const normalizedGender = gender?.toLowerCase();
  
  const badges = {
    male: '👨',
    female: '👩',
    'non-binary': '🧑',
    other: '✨',
    'prefer-not-to-say': '🔒',
    'prefer not to say': '👤',
    default: '🤖'
  };

  return badges[normalizedGender] || badges.default;
};

/**
 * Check if avatar image is valid
 * Returns a promise that resolves to true/false
 */
export const isValidImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
};