import MovieRow from './components/MovieRow';
import MovieRowScroll from './components/MovieRowScroll';
import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import API from './api';

function App() {
  const [featuredMovie, setFeaturedMovie]     = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeGenreId, setActiveGenreId]     = useState(null);
  const [activeGenreName, setActiveGenreName] = useState('');
  const [activeCategory, setActiveCategory]   = useState('home');
  const [backendReady, setBackendReady]       = useState(false);
  const [waking, setWaking]                   = useState(true);

  // ✅ Step 1: Ping backend first to wake up Render
  // Step 2: Then fetch trending for hero
  useEffect(() => {
    const wakeAndLoad = async () => {
      setWaking(true);
      try {
        // Ping backend — wakes up Render if sleeping
        await API.get('/ping');
      } catch (e) {
        console.warn('Backend ping failed, trying anyway...', e);
      }
      setBackendReady(true);
      setWaking(false);

      // Now fetch trending for hero
      try {
        const r = await API.get('/trending');
        const movies = r.data?.results;
        if (movies?.length) {
          setFeaturedMovie(movies[Math.floor(Math.random() * 5)]);
        }
      } catch (e) {
        console.error('Hero fetch failed:', e);
      }
    };

    wakeAndLoad();
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    setActiveGenreId(null);
    setActiveGenreName('');
    setActiveCategory('search');
  };

  const handleGenreSelect = (genre) => {
    setActiveGenreId(genre.id);
    setActiveGenreName(genre.name);
    setSearchQuery('');
    setActiveCategory('genre');
  };

  const handleCategorySelect = (action) => {
    setActiveCategory(action);
    setSearchQuery('');
    setActiveGenreId(null);
    setActiveGenreName('');
  };

  const renderRows = () => {
    // ✅ Show loading until backend is ready
    if (!backendReady) {
      return (
        <div className="px-4 md:px-10 py-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-10">
              <div className="h-5 w-40 bg-gray-800/60 animate-pulse rounded mb-4" />
              <div className="flex gap-3 overflow-hidden">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex-none w-32 sm:w-36 md:w-44">
                    <div className="w-full h-48 sm:h-52 md:h-64 bg-gray-800/60 animate-pulse rounded-lg" />
                    <div className="mt-2 h-3 bg-gray-800/40 animate-pulse rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    switch (activeCategory) {
      case 'search':
        return (
          <>
            <div className="px-4 md:px-10 pt-4 mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Results for <span className="text-red-400">"{searchQuery}"</span>
              </h2>
              <button onClick={() => handleCategorySelect('home')} className="text-gray-400 hover:text-white text-sm">✕ Clear</button>
            </div>
            <MovieRow title="" fetchType="search" fetchParam={searchQuery} />
          </>
        );
      case 'genre':
        return (
          <>
            <div className="px-4 md:px-10 pt-4 mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                <span className="text-red-400">{activeGenreName}</span> Movies
              </h2>
              <button onClick={() => handleCategorySelect('home')} className="text-gray-400 hover:text-white text-sm">✕ Clear</button>
            </div>
            <MovieRow title="" fetchType="genre" fetchParam={activeGenreId} />
          </>
        );
      case 'Bollywood':    return <MovieRow title="Bollywood Popular"    fetchType="bollywood" />;
      case 'Hollywood':    return <MovieRow title="Hollywood Popular"    fetchType="hollywood" />;
      case 'Hindi Dubbed': return <MovieRow title="Hindi Dubbed Popular" fetchType="hindiDubbed" />;
      case 'South Indian': return <MovieRow title="South Indian Popular" fetchType="southIndian" />;
      case 'Web Series':   return <MovieRow title="Popular Web Series"   fetchType="webSeries" />;
      default:
        return (
          <>
            <MovieRowScroll title="Trending This Week" fetchType="trending" />
            <MovieRowScroll title="Top Rated"          fetchType="topRated" />
            <MovieRowScroll title="Popular Now"        fetchType="popular" />
            <MovieRowScroll title="Action"             fetchType="genre" fetchParam={28} />
            <MovieRowScroll title="Comedy"             fetchType="genre" fetchParam={35} />
            <MovieRowScroll title="Sci-Fi"             fetchType="genre" fetchParam={878} />
            <MovieRowScroll title="Horror"             fetchType="genre" fetchParam={27} />
            <MovieRowScroll title="Drama"              fetchType="genre" fetchParam={18} />
          </>
        );
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans">
      <NavBar
        onSearch={handleSearch}
        onGenreSelect={handleGenreSelect}
        onCategorySelect={handleCategorySelect}
      />
      <div className="pt-14">
        <Hero featuredMovie={featuredMovie} waking={waking} />
        <div className="pb-16 pt-4">
          {renderRows()}
        </div>
      </div>
      <footer className="border-t border-gray-800/50 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <img
              src="/logo.svg"
              alt="Movie Baazaar"
              className="h-10 md:h-14 w-auto"
              onError={(e) => e.target.style.display='none'}
            />
            <div className="flex items-center gap-4 text-sm">
              <a href="https://www.linkedin.com/in/rajkishor-karji-43456a2a9/" target="_blank" className="text-gray-500 hover:text-white transition-colors">LinkedIn</a>
              <a href="https://github.com/rajkishorkarji" target="_blank" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
              <a href="https://www.themoviedb.org" target="_blank" className="text-gray-500 hover:text-white transition-colors">TMDB</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Movie Baazaar. All rights reserved.</p>
            <p className="text-gray-700 text-xs">Designed by RAJKISHOR KARJI · Powered by TMDB API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;