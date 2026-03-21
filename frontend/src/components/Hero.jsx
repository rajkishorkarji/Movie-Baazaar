const Hero = ({ featuredMovie, waking }) => {
  const backdropUrl = featuredMovie?.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${featuredMovie.backdrop_path}`
    : null;

  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: '55vw', minHeight: '220px', maxHeight: '480px' }}
    >
      {/* Always-visible dark fallback */}
      <div className="absolute inset-0 bg-[#1a0505]" />

      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={featuredMovie?.title || 'Featured movie'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-[#0a0a0a]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 via-transparent to-transparent" />

      <div className="relative z-10 px-4 flex flex-col justify-center items-center text-center w-full">
        {/* ✅ Show waking message if backend is starting up */}
        {waking && (
          <div className="inline-flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/30 rounded-full px-3 py-1 mb-2 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Starting server...</span>
          </div>
        )}

        {!waking && (
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1 mb-2 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">Now Streaming</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-2 tracking-tight leading-none">
          MOVIE
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
            BAAZAAR
          </span>
        </h1>

        {featuredMovie && (
          <div className="mt-1">
            <p className="text-gray-300 text-xs tracking-widest uppercase mb-1">Featured Tonight</p>
            <p className="text-white text-sm md:text-base font-semibold line-clamp-1 px-4">
              {featuredMovie.title || featuredMovie.name}
            </p>
            {featuredMovie.vote_average > 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-gray-300 text-sm">{featuredMovie.vote_average?.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;