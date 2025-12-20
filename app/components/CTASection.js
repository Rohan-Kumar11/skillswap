export function CTASection({ onGetStarted }) {
  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative p-16 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 animate-pulse" />

          <h2 className="relative text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Ready to Transform Your Learning?
          </h2>
          <p className="relative text-xl text-gray-300 mb-8">
            Join 50,000+ skill swappers already growing together
          </p>
          <button
            onClick={onGetStarted}
            className="relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-110"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}

