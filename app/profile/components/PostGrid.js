"use client";
import { Plus, Heart, MessageCircle, Play, Music } from "lucide-react";

export default function PostGrid({ posts, openMediaUploader, openViewer }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
      {/* Add Post Card */}
      <button
        onClick={openMediaUploader}
        className="relative w-full aspect-square bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl flex flex-col items-center justify-center group overflow-hidden transition-all hover:shadow-xl border-2 border-dashed border-gray-300 hover:border-blue-400"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-gray-600 font-semibold text-sm group-hover:text-gray-800">
            Create New Post
          </p>
        </div>
      </button>

      {/* Posts Grid */}
      {posts.map((p, index) => {
        // Check if post is video based on media_type or file extension
        const isVideo = p.media_type === 'video' ||
          (p.media_urls && p.media_urls.length > 0 &&
            (p.media_urls[0].includes('/post-videos/') ||
              p.media_urls[0].match(/\.(mp4|webm|ogg|mov)(\?|$)/i)));

        const hasMusic = p.music_url && p.music_title;
        
        // Get the first media URL (works for both images and videos)
        const mediaUrl = p.media_urls?.[0] || p.image_url;
        
        // For video posts, check if thumbnail exists
        const videoThumbnail = p.video_thumbnail;

        // Calculate if post is new (less than 24 hours old)
        const hoursSincePost = (new Date() - new Date(p.created_at)) / (1000 * 60 * 60);
        const isNewPost = hoursSincePost < 24;

        return (
          <div
            key={p.id}
            className="relative w-full aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300"
            onClick={() => openViewer(index)}
          >
            {/* Media Display */}
            {isVideo ? (
              <div className="relative w-full h-full bg-black">
                {/* Video Element - uses media_urls[0] for video source */}
                <video
                  src={mediaUrl}
                  poster={videoThumbnail || undefined}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
                
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                    <Play size={28} className="text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt={p.caption || 'Post'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            )}

            {/* NEW Badge - Only show if post is less than 24 hours old */}
            {isNewPost && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                NEW
              </div>
            )}

            {/* Music Badge */}
            {hasMusic && (
              <div className={`absolute top-3 ${isNewPost ? 'left-20' : 'left-3'} bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm z-10`}>
                <Music size={14} />
                <span className="text-xs font-bold">MUSIC</span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Hover Info */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">

              {/* Top: Stats */}
              <div className="flex items-center justify-end gap-4 text-white transform translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Heart size={18} fill="white" className="text-white" />
                  <span className="text-sm font-semibold">{p.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MessageCircle size={18} className="text-white" />
                  <span className="text-sm font-semibold">{p.comments_count || 0}</span>
                </div>
              </div>

              {/* Bottom: Caption & Music Info */}
              <div className="transform translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300">
                {p.caption && (
                  <p className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg mb-2">
                    {p.caption}
                  </p>
                )}
                {hasMusic && (
                  <div className="flex items-center gap-2 text-white/90 text-xs">
                    <Music size={14} />
                    <span className="truncate">{p.music_title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}