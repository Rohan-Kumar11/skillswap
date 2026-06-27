// app/messages/components/ProfilePictureModal.jsx
// Full-screen profile picture viewer with consistent avatar generation

import React, { useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatarUtils';

const ProfilePictureModal = ({ isOpen, onClose, user }) => {
    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Use the same avatar utility function for consistency
    const profilePicUrl = getAvatarUrl({
        profile_pic: user.profilePic,
        username: user.name,
        full_name: user.fullName,
        gender: user.gender
    });

    const handleDownload = async () => {
        try {
            const response = await fetch(profilePicUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${user.name}_profile.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download image. Please try right-clicking and saving instead.');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${user.fullName || user.name}'s Profile`,
                    text: `Check out ${user.fullName || user.name}'s profile on SkillSwap`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            // Fallback: copy link
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center animate-fadeIn"
            onClick={onClose}
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <div>
                            <h3 className="text-white font-semibold text-lg">
                                {user.fullName || `@${user.name}`}
                            </h3>
                            {user.fullName && (
                                <p className="text-gray-400 text-sm">@{user.name}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Download"
                        >
                            <Download className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Picture */}
            <div 
                className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={profilePicUrl}
                    alt={`${user.fullName || user.name}'s profile`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
                    style={{
                        imageRendering: 'high-quality'
                    }}
                />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-gray-400 text-sm">
                    Press <kbd className="px-2 py-1 bg-white/10 rounded text-white">ESC</kbd> or click outside to close
                </p>
            </div>
        </div>
    );
};

export default ProfilePictureModal;

// Add these styles to your global CSS or Tailwind config
const styles = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
}
`;