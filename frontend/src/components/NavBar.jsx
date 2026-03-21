import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const genreRef = useRef(null);

  const [scrolled, setScrolled]           = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [query, setQuery]                 = useState('');
  const [genreOpen, setGenreOpen]         = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [mobileGenreOpen, setMobileGenreOpen] = useState(false);
  // ✅ FIXED: showAuth is state, AuthModal rendered in JSX return, not as a statement
  const [showAuth, setShowAuth]           = useState(false);

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

  // ✅ FIXED: AuthModal is now properly rendered inside the JSX return
  return (
    <>
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

            {/* ✅ FIXED: Desktop Auth Button — was completely missing before */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-black hover:bg-red-500 transition-colors"
                  title={user.username}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>


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

            {/* ✅ FIXED: Mobile auth button properly placed inside mobile menu */}
            <div className="border-t border-white/5 mt-3 pt-3 px-2">
              {user ? (
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-black">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  {user.username}
                </button>
              ) : (
                <button
                  onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Sign In / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ✅ FIXED: AuthModal now correctly rendered here at root level of return */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};

export default NavBar;