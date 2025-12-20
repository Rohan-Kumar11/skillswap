"use client";
import { Plus, Heart, MessageCircle, Play } from "lucide-react";

export default function PostGrid({ posts, openMediaUploader, openViewer }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 max-w-full">
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
          <p className="text-gray-600 font-semibold text-sm group-hover:text-gray-800 transition-colors">
            Create New Post
          </p>
        </div>
      </button>

      {/* Posts Grid */}
      {posts.map((p, index) => {
        const isVideo = p.post_type === 'video';
        
        return (
          <div
            key={p.id}
            className="relative w-full aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300"
            onClick={() => openViewer(index)}
          >
            {/* Image/Video Thumbnail */}
            {isVideo ? (
              <div className="relative w-full h-full">
                <video
                  src={p.video_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                    <Play size={28} className="text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={p.image_url}
                alt={p.caption || 'Post'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}

            {/* Media Type Badge */}
            <div className={`absolute top-3 right-3 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm ${
              isVideo 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}>
              {isVideo ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span className="text-xs font-bold">VIDEO</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold">IMAGE</span>
                </>
              )}
            </div>

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

              {/* Bottom: Caption */}
              {p.caption && (
                <div className="transform translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
                    {p.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Corner Badge (Optional - for new posts) */}
            {(() => {
              const hoursSincePost = (new Date() - new Date(p.created_at)) / (1000 * 60 * 60);
              return hoursSincePost < 24 ? (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  NEW
                </div>
              ) : null;
            })()}
          </div>
        );
      })}
    </div>
  );
}