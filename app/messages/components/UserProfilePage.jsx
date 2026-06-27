// app/messages/components/UserProfilePage.jsx
// Instagram-style user profile info page

import React, { useState, useEffect } from 'react';
import { 
    X, Search, Bell, MoreVertical, Users, Calendar, 
    Award, Star, MessageCircle, Video, Phone, Share2,
    MapPin, Link as LinkIcon, Briefcase, Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SafeAvatar } from '../../components/SafeAvatar';

const UserProfilePage = ({ isOpen, onClose, userId, currentUserId, conversationId }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [sharedMedia, setSharedMedia] = useState([]);

    useEffect(() => {
        if (isOpen && userId) {
            loadUserData();
            loadSharedMedia();
        }
    }, [isOpen, userId]);

    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
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

    const loadUserData = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('profile_user')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setUserData({
                id: data.id,
                username: data.username,
                fullName: data.full_name,
                bio: data.bio,
                profilePic: data.profile_pic,
                skillsOffered: data.skills_offered || [],
                skillsWanted: data.skills_wanted || [],
                location: data.location,
                website: data.website,
                email: data.email,
                joinedDate: data.created_at,
                lastSeenAt: data.last_seen_at
            });

        } catch (err) {
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSharedMedia = async () => {
        if (!conversationId) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('file_url, file_type, file_name, created_at')
                .eq('conversation_id', conversationId)
                .not('file_url', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setSharedMedia(data || []);
        } catch (err) {
            console.error('Error loading shared media:', err);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const isOnline = userData?.lastSeenAt 
        ? (new Date() - new Date(userData.lastSeenAt) < 5 * 60 * 1000)
        : false;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            {/* Main Container */}
            <div 
                className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors backdrop-blur-sm z-10 border border-slate-700"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar bg-slate-900">
                    {/* Profile Section */}
                    <div className="px-6 pt-6 pb-6">
                        {/* Avatar */}
                        <div className="mb-4 flex justify-center">
                            <SafeAvatar
                                user={{
                                    username: userData.username,
                                    full_name: userData.fullName,
                                    profile_pic: userData.profilePic
                                }}
                                size="xl"
                                online={isOnline}
                                className="shadow-xl"
                            />
                        </div>

                        {/* Name and Username */}
                        <div className="mb-4 text-center">
                            <h1 className="text-3xl font-bold text-white mb-1.5">
                                {userData.fullName || userData.username}
                            </h1>
                            <p className="text-purple-300 text-lg font-medium mb-2">@{userData.username}</p>
                            <div className="flex items-center gap-2 justify-center">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                <p className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>

                        {/* Bio */}
                        {userData.bio && (
                            <p className="text-gray-300 mb-4 leading-relaxed text-center">
                                {userData.bio}
                            </p>
                        )}

                        {/* Quick Info */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {userData.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <MapPin className="w-4 h-4 text-purple-400" />
                                    <span>{userData.location}</span>
                                </div>
                            )}
                            {userData.website && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <LinkIcon className="w-4 h-4 text-purple-400" />
                                    <a 
                                        href={userData.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:text-purple-400 transition-colors truncate"
                                    >
                                        {userData.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span>
                                    Joined {new Date(userData.joinedDate).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                            <button className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
                                <MessageCircle className="w-5 h-5" />
                                <span>Message</span>
                            </button>
                            <button className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700">
                                <Phone className="w-5 h-5 text-purple-400" />
                            </button>
                            <button className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700">
                                <Video className="w-5 h-5 text-purple-400" />
                            </button>
                            <button className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700">
                                <Share2 className="w-5 h-5 text-purple-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 border-b border-slate-700">
                            {[
                                { id: 'about', label: 'About', icon: Users },
                                { id: 'skills', label: 'Skills', icon: Award },
                                { id: 'media', label: 'Shared Media', icon: Star }
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-3 px-4 font-medium transition-all flex items-center justify-center gap-2 ${
                                            activeTab === tab.id
                                                ? 'text-purple-400 border-b-2 border-purple-400'
                                                : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="pb-6">
                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <div className="space-y-4">
                                    <InfoSection 
                                        title="Contact Information"
                                        items={[
                                            { 
                                                icon: Mail, 
                                                label: 'Email', 
                                                value: userData.email,
                                                link: `mailto:${userData.email}`
                                            },
                                            { 
                                                icon: LinkIcon, 
                                                label: 'Website', 
                                                value: userData.website,
                                                link: userData.website
                                            }
                                        ].filter(item => item.value)}
                                    />

                                    <InfoSection 
                                        title="Profile Details"
                                        items={[
                                            { 
                                                icon: Users, 
                                                label: 'Username', 
                                                value: `@${userData.username}`
                                            },
                                            { 
                                                icon: Calendar, 
                                                label: 'Member Since', 
                                                value: new Date(userData.joinedDate).toLocaleDateString('en-US', { 
                                                    month: 'long', 
                                                    day: 'numeric',
                                                    year: 'numeric' 
                                                })
                                            },
                                            { 
                                                icon: MapPin, 
                                                label: 'Location', 
                                                value: userData.location
                                            }
                                        ].filter(item => item.value)}
                                    />
                                </div>
                            )}

                            {/* Skills Tab */}
                            {activeTab === 'skills' && (
                                <div className="space-y-6">
                                    {/* Skills Offered */}
                                    {userData.skillsOffered?.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                                <Award className="w-5 h-5 text-green-400" />
                                                Skills I Can Teach
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {userData.skillsOffered.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm border border-green-500/30"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills Wanted */}
                                    {userData.skillsWanted?.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                                <Star className="w-5 h-5 text-blue-400" />
                                                Skills I Want to Learn
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {userData.skillsWanted.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {userData.skillsOffered?.length === 0 && userData.skillsWanted?.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No skills listed yet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Shared Media Tab */}
                            {activeTab === 'media' && (
                                <div>
                                    {sharedMedia.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {sharedMedia.map((media, idx) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(media.file_url, '_blank')}
                                                >
                                                    {media.file_type?.startsWith('image/') ? (
                                                        <img
                                                            src={media.file_url}
                                                            alt={media.file_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : media.file_type?.startsWith('video/') ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                                            <Video className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                                            <LinkIcon className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No shared media yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component
const InfoSection = ({ title, items }) => (
    <div>
        <h3 className="text-white font-semibold mb-3">{title}</h3>
        <div className="bg-slate-800 rounded-lg divide-y divide-slate-700">
            {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <div key={idx} className="px-4 py-3 flex items-center gap-3">
                        <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                            {item.link ? (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-white hover:text-purple-400 transition-colors truncate block"
                                >
                                    {item.value}
                                </a>
                            ) : (
                                <p className="text-sm text-white truncate">{item.value}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default UserProfilePage;

// Add this CSS for custom scrollbar
const styles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(148, 163, 184, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 85, 247, 0.7);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slideUp {
    animation: slideUp 0.3s ease-out;
}
`;