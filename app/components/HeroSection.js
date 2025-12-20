import { ArrowRight } from 'lucide-react';

export default function HeroSection({ onGetStarted }) {
  const skills = [
    { name: 'Web Dev', color: 'from-cyan-400 to-blue-500', icon: '💻' },
    { name: 'Design', color: 'from-pink-400 to-purple-500', icon: '🎨' },
    { name: 'Marketing', color: 'from-orange-400 to-red-500', icon: '📱' },
    { name: 'Music', color: 'from-green-400 to-emerald-500', icon: '🎵' },
    { name: 'Coding', color: 'from-yellow-400 to-orange-500', icon: '⚡' },
    { name: 'Writing', color: 'from-indigo-400 to-purple-500', icon: '✍️' },
  ];

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30 backdrop-blur-sm animate-fade-in">
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🚀 The Future of Learning is Here
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          <span className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            Exchange Skills,
          </span>
          <br />
          <span className="inline-block bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-reverse">
            Grow Together
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Join the world's first decentralized skill-sharing platform.
          <span className="text-purple-400 font-semibold"> Trade your expertise</span> for knowledge you want to learn.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            Start Swapping
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Floating Skills */}
        <div className="relative h-40">
          {skills.map((skill, i) => (
            <div
              key={skill.name}
              className={`absolute px-6 py-3 bg-gradient-to-r ${skill.color} rounded-full font-bold shadow-lg animate-float-skill`}
              style={{
                left: `${15 + i * 15}%`,
                top: `${Math.sin(i) * 30 + 50}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              <span className="mr-2">{skill.icon}</span>
              {skill.name}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float-skill {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes gradient-reverse {
          0% { background-position: 100% 50%; }
          50% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float-skill {
          animation: float-skill 4s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-gradient-reverse {
          background-size: 200% 200%;
          animation: gradient-reverse 3s ease infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </section>
  );
}