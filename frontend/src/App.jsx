import MovieRow from './components/MovieRow';
import MovieRowScroll from './components/MovieRowScroll';
import { useState, useEffect } from 'react';
import { getTrending } from './api';
import NavBar from './components/NavBar';
import Hero from './components/Hero';

function App() {
  const [featuredMovie, setFeaturedMovie]     = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeGenreId, setActiveGenreId]     = useState(null);
  const [activeGenreName, setActiveGenreName] = useState('');
  const [activeCategory, setActiveCategory]   = useState('home');

  useEffect(() => {
    getTrending()
      .then(r => {
        const movies = r.data.results;
        if (movies?.length) setFeaturedMovie(movies[Math.floor(Math.random() * 5)]);
      })
      .catch(e => console.error('Hero failed:', e));
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
    switch (activeCategory) {
      case 'search':
        return (
          <>
            <div className="px-6 md:px-10 pt-6 mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Results for <span className="text-red-400">"{searchQuery}"</span></h2>
              <button onClick={() => handleCategorySelect('home')} className="text-gray-400 hover:text-white text-sm">✕ Clear</button>
            </div>
            <MovieRow title="" fetchType="search" fetchParam={searchQuery} />
          </>
        );

      case 'genre':
        return (
          <>
            <div className="px-6 md:px-10 pt-6 mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white"><span className="text-red-400">{activeGenreName}</span> Movies</h2>
              <button onClick={() => handleCategorySelect('home')} className="text-gray-400 hover:text-white text-sm">✕ Clear</button>
            </div>
            <MovieRow title="" fetchType="genre" fetchParam={activeGenreId} />
          </>
        );

      case 'Bollywood':
        return (
          <>
            <MovieRow title="Bollywood Popular"     fetchType="bollywood" />
  
          </>
        );

      case 'Hollywood':
        return (
          <>
            <MovieRow title="Hollywood Popular"     fetchType="hollywood" />
           
          </>
        );

      case 'Hindi Dubbed':
        return (
          <>
            <MovieRow title="Hindi Dubbed Popular"  fetchType="hindiDubbed" />
            
          </>
        );

      case 'South Indian':
        return (
          <>
            <MovieRow title="South Indian Popular"  fetchType="southIndian" />
           
          </>
        );

      case 'Web Series':
        return (
          <>
            <MovieRow title="Popular Web Series"    fetchType="webSeries" />
           
          </>
        );

      default:
  return (
    <>
      <MovieRowScroll title="Trending This Week"    fetchType="trending" />
      <MovieRowScroll title="Top Rated"              fetchType="topRated" />
      <MovieRowScroll title="Popular Now"            fetchType="popular" />
      <MovieRowScroll title="Action"                 fetchType="genre" fetchParam={28} />
      <MovieRowScroll title="Comedy"                 fetchType="genre" fetchParam={35} />
      <MovieRowScroll title="Sci-Fi"                 fetchType="genre" fetchParam={878} />
      <MovieRowScroll title="Horror"                 fetchType="genre" fetchParam={27} />
      <MovieRowScroll title="Drama"                  fetchType="genre" fetchParam={18} />
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
      <Hero featuredMovie={featuredMovie} onSearch={handleSearch} />

      <div className="relative z-20 -mt-32 pb-16">
        {renderRows()}
      </div>

      <footer className="border-t border-gray-800/50 bg-[#0a0a0a] mt-10">
        <div className="max-w-7xl mx-auto px-10 py-10">

          {/* Top Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Movie Baazaar" className="h-14 w-auto"
                onError={(e) => e.target.style.display='none'} />
            </div>

            {/* Connect Links */}
            <div className="flex items-center gap-6 text-sm">
              <a href="https://www.linkedin.com/in/rajkishor-karji-43456a2a9/" target="_blank" className="text-gray-500 hover:text-blue-400 transition-colors">LinkedIn</a>
              <a href="https://github.com/rajkishorkarji" target="_blank" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
              <a href="https://www.themoviedb.org" target="_blank" className="text-gray-500 hover:text-red-400 transition-colors">TMDB</a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} Movie Baazaar. All rights reserved.
            </p>
            <p className="text-gray-700 text-xs">
              Designed & Developed by <span className="text-gray-500">RAJKISHOR KARJI</span> · Powered by <span className="text-gray-500">TMDB API</span>
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default App;