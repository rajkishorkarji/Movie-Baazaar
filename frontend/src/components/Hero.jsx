import { useState, useEffect } from 'react';

const Hero = ({ featuredMovie, onSearch }) => {
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) onSearch(query.trim());
  };

  const backdropUrl = featuredMovie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : null;

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Cinematic Background */}
      {backdropUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[2s]"
          style={{ backgroundImage: `url('${backdropUrl}')` }}
        />
      )}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent" />

      {/* Animated Film Grain Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 md:px-16 pt-15 flex flex-col justify-center items-center h-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">Now Streaming</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-9xl font-black text-white mb-4 tracking-tight leading-none">
          MOVIE
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
            BAAZAAR
          </span>
        </h1>

        {/* Featured Movie Info */}
        {featuredMovie && (
          <div className="mb-8 animate-fade-in">
            <p className="text-gray-300 text-sm tracking-widest uppercase mb-1">Featured Tonight</p>
            <p className="text-white text-xl font-semibold">
              {featuredMovie.title || featuredMovie.name}
            </p>
            {featuredMovie.vote_average && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-yellow-400">★</span>
                <span className="text-gray-300 text-sm">{featuredMovie.vote_average?.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Scroll Indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
};
export default Hero;