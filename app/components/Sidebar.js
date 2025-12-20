"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Search,
  MessageSquare,
  Compass,
  Repeat,
  Bell,
  User,
  MoreHorizontal,
  LogOut,
  Settings,
  HelpCircle,
  Shield,
  Palette,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const moreMenuRef = useRef(null);

  const navLinks = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/swap", icon: Repeat, label: "Swap" },
    { href: "/notification", icon: Bell, label: "Notification" },
  ];

  const moreMenuItems = [
    { icon: Settings, label: "Settings", action: "settings", color: "from-blue-500 to-cyan-500" },
    { icon: Shield, label: "Privacy & Safety", action: "privacy", color: "from-green-500 to-emerald-500" },
    { icon: Palette, label: "Appearance", action: "appearance", color: "from-purple-500 to-pink-500" },
    { icon: HelpCircle, label: "Help & Support", action: "help", color: "from-orange-500 to-yellow-500" },
    { icon: LogOut, label: "Log Out", action: "logout", color: "from-red-500 to-pink-500" },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleMenuAction = async (action) => {
    switch (action) {
      case "logout":
        await handleLogout();
        break;
      case "settings":
        router.push("/settings");
        setShowMoreMenu(false);
        break;
      case "privacy":
        router.push("/settings/privacy");
        setShowMoreMenu(false);
        break;
      case "appearance":
        setDarkMode(!darkMode);
        // You can implement theme switching logic here
        break;
      case "help":
        router.push("/help");
        setShowMoreMenu(false);
        break;
      default:
        setShowMoreMenu(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      console.log("🚪 Logging out...");

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Logout error:", error);
        throw error;
      }

      console.log("✅ Logged out successfully");
      setShowMoreMenu(false);
      router.push("/");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 h-screen bg-[#0a1123] text-white p-6 fixed left-0 top-0 flex flex-col justify-between z-50 shadow-2xl">
      
      {/* TOP SECTION */}
      <div>
        <Link href="/home" className="block mb-8 group">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
            SkillSwap
          </h1>
        </Link>

        <nav className="space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 text-white font-semibold shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={22} className="group-hover:scale-110 transition-transform" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div className="space-y-2 pb-4 border-t border-gray-800 pt-4 relative" ref={moreMenuRef}>
        {/* Profile Link */}
        <Link
          href="/profile"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
            pathname === "/profile" || pathname.startsWith('/profile/')
              ? 'bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 text-white font-semibold shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={22} className="group-hover:scale-110 transition-transform" />
          <span>Profile</span>
        </Link>

        {/* More Button */}
        <button
          onClick={handleMoreClick}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
            showMoreMenu
              ? 'bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 text-white font-semibold shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MoreHorizontal size={22} className="group-hover:scale-110 transition-transform" />
          <span>More</span>
        </button>

        {/* More Menu Popup */}
        {showMoreMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f1829] rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
            {moreMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isLogout = item.action === "logout";
              
              return (
                <button
                  key={item.action}
                  onClick={() => handleMenuAction(item.action)}
                  disabled={isLogout && loggingOut}
                  className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 group hover:bg-white/5 ${
                    index !== moreMenuItems.length - 1 ? 'border-b border-gray-800/50' : ''
                  } ${isLogout && loggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10`}>
                    <Icon 
                      size={18} 
                      className={`group-hover:scale-110 transition-transform ${
                        isLogout && loggingOut ? 'animate-spin' : ''
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                    {isLogout && loggingOut ? 'Logging out...' : item.label}
                  </span>
                </button>
              );
            })}
            
            {/* Decorative bottom gradient */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
          </div>
        )}
      </div>
    </aside>
  );
}