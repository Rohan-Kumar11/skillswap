export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-12 px-6 backdrop-blur-xl">
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