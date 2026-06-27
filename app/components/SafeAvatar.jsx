// app/components/SafeAvatar.jsx
// ✅ SAFE avatar component - No XSS vulnerability

import { useState } from 'react';
import { getAvatarUrl, getDisplayAvatar, getAvatarGradient } from '../utils/avatarUtils';

export const SafeAvatar = ({ 
  user, 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  online = false,
  showBadge = false,
  badgeIcon = null,
  className = '',
  ringColor = 'ring-purple-500/50'
}) => {
  const [imageError, setImageError] = useState(false);
  
  const avatarUrl = getAvatarUrl(user);
  const displayLetter = getDisplayAvatar(user);
  const gradient = getAvatarGradient(user?.username || user?.full_name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl'
  };

  const onlineSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };

  const badgeSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {/* Image or Letter Fallback */}
      {!imageError ? (
        <img
          src={avatarUrl}
          alt={user?.full_name || user?.username || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ${ringColor}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div 
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white ring-2 ${ringColor}`}
        >
          {displayLetter}
        </div>
      )}

      {/* Online Indicator */}
      {online && (
        <div className={`absolute bottom-0 right-0 ${onlineSizes[size]} bg-green-500 rounded-full border-2 border-slate-900`} />
      )}

      {/* Badge (for swap, etc.) */}
      {showBadge && badgeIcon && (
        <div className={`absolute -top-1 -right-1 ${badgeSizes[size]} bg-purple-500 rounded-full flex items-center justify-center`}>
          {badgeIcon}
        </div>
      )}
    </div>
  );
};