import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 27,    name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37,    name: 'Western' },
];

const NavBar = ({ onSearch, onGenreSelect, onCategorySelect }) => {
  const [scrolled, setScrolled]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');
  const [genreOpen, setGenreOpen]   = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [mobileGenreOpen, setMobileGenreOpen] = useState(false);
  const location = useLocation();
  const genreRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (genreRef.current && !genreRef.current.contains(e.target)) {
        setGenreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      setSearchOpen(false);
      setMenuOpen(false);
      setQuery('');
    }
  };

  const handleGenreClick = (genre) => {
    setGenreOpen(false);
    setMenuOpen(false);
    setMobileGenreOpen(false);
    if (onGenreSelect) onGenreSelect(genre);
  };

  const navLinks = [
    { label: 'Home',         action: 'home' },
    { label: 'Bollywood',    action: 'Bollywood' },
    { label: 'Hollywood',    action: 'Hollywood' },
    { label: 'Hindi Dubbed', action: 'Hindi Dubbed' },
    { label: 'South Hindi',  action: 'South Indian' },
    { label: 'Web Series',   action: 'Web Series' },
  ];

  const handleNavClick = (action) => {
    if (onCategorySelect) onCategorySelect(action);
    setMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50'
        : 'bg-black/60 backdrop-blur-md'
    }`}>
      <div className="flex items-center justify-between px-3 md:px-6 py-2">

        {/* Logo */}
        <button onClick={() => handleNavClick('home')} className="flex items-center gap-2 group">
          <img
            src="/logo.svg"
            alt="Movie Baazaar"
            className="h-11 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-200"
          />
        </button>

        {/* Center Nav — desktop only */}
        <div className={`hidden md:flex items-center gap-0 transition-all duration-300 ${searchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
          {navLinks.map(({ label, action }) => (
            <button
              key={label}
              onClick={() => handleNavClick(action)}
              className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5"
            >
              {label}
            </button>
          ))}

          {/* Genres Dropdown — desktop */}
          <div className="relative" ref={genreRef}>
            <button
              onClick={() => setGenreOpen(!genreOpen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-all duration-200 ${
                genreOpen ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Genres
              <svg className={`w-3 h-3 transition-transform duration-200 ${genreOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {genreOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-[#111111] border border-red-600/20 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                <div className="p-1.5 grid grid-cols-2 gap-0.5">
                  {GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreClick(genre)}
                      className="text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-all duration-150 whitespace-nowrap"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 text-white text-sm outline-none w-48 md:w-96 placeholder-gray-500"
                  onBlur={() => !query && setSearchOpen(false)}
                />
                <button type="submit" className="ml-2 text-red-400 hover:text-red-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* LinkedIn — desktop only */}
          <a
            href="https://www.linkedin.com/in/rajkishor-karji-43456a2a9/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex w-9 h-9 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 items-center justify-center text-gray-400 hover:text-blue-400 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </a>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            {menuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d0d0d]/98 backdrop-blur-xl border-t border-white/5 px-4 py-4">

          {/* Nav Links */}
          <div className="flex flex-col gap-1 mb-4">
            {navLinks.map(({ label, action }) => (
              <button
                key={label}
                onClick={() => handleNavClick(action)}
                className="text-left px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Genres toggle */}
          <div className="border-t border-white/5 pt-3">
            <button
              onClick={() => setMobileGenreOpen(!mobileGenreOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <span>Genres</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${mobileGenreOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileGenreOpen && (
              <div className="grid grid-cols-3 gap-1 mt-2 px-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreClick(genre)}
                    className="px-2 py-2 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-red-600/20 rounded-lg transition-all text-center"
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LinkedIn in mobile menu */}
          <div className="border-t border-white/5 mt-3 pt-3 px-2">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-blue-400 hover:bg-white/5 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              LinkedIn
            </a>
          </div>

        </div>
      )}
    </nav>
  );
};

export default NavBar;