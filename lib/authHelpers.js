const AUTH_KEY = 'skillswap_user'; // Single consistent key across entire app

export const setAuthUser = (user) => {
  if (typeof window !== 'undefined') {
    // Clear any old keys first
    localStorage.removeItem('swapp_user');
    localStorage.removeItem('skillswap_user');
    
    // Set new user data
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    console.log('✅ User stored:', user.username);
  }
};

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    // Try new key first
    let user = localStorage.getItem(AUTH_KEY);
    
    // Fallback to old key if exists (migration)
    if (!user) {
      user = localStorage.getItem('swapp_user');
      if (user) {
        // Migrate to new key
        localStorage.setItem(AUTH_KEY, user);
        localStorage.removeItem('swapp_user');
      }
    }
    
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAuthUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('swapp_user'); // Remove old key too
    console.log('✅ Session cleared');
  }
};

export const isAuthenticated = () => {
  return getAuthUser() !== null;
};