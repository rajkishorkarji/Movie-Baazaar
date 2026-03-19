import { useEffect, useState } from 'react';
import { getTrending, getPopular, getTopRated, getByGenre, searchMovies, getBollywood, getHollywood, getSouthIndian, getHindiDubbed, getWebSeries } from '../api';

const FETCH_MAP = {
  trending:    (p, page) => getTrending(page),
  popular:     (p, page) => getPopular(page),
  topRated:    (p, page) => getTopRated(page),
  genre:       (p, page) => getByGenre(p, page),
  search:      (p, page) => searchMovies(p, page),
  bollywood:   (p, page) => getBollywood(page),
  hollywood:   (p, page) => getHollywood(page),
  southIndian: (p, page) => getSouthIndian(page),
  hindiDubbed: (p, page) => getHindiDubbed(page),
  webSeries:   (p, page) => getWebSeries(page),
};

const MovieCard = ({ movie }) => {
  const [hovered, setHovered] = useState(false);
  const img = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster';
  const rating = movie.vote_average || movie.rating;

  return (
    <div
      className="cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/70">
        <img
          className="w-full h-60 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
          src={img}
          alt={movie.title || movie.name}
          loading="lazy"
        />
        {rating > 0 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-white text-xs font-semibold">{Number(rating).toFixed(1)}</span>
          </div>
        )}
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
  onClick={() => navigate(`/movie/${movie.id}`)}
  className="bg-red-600 hover:bg-red-500 text-white text-sm px-5 py-2 rounded-lg font-bold transition-colors shadow-lg"
>
  ▶ Watch
</button>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-white text-xs font-semibold leading-snug line-clamp-3">
          {movie.title || movie.name}
        </p>
        {(movie.release_date || movie.first_air_date) && (
          <p className="text-gray-500 text-xs mt-0.5">
            {(movie.release_date || movie.first_air_date)?.slice(0, 4)}
          </p>
        )}
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ‹ Prev
      </button>

      {/* Page numbers */}
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dot-${i}`} className="px-3 py-2 text-gray-600 text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all border ${
              currentPage === page
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next ›
      </button>
    </div>
  );
};

const MovieRow = ({ title, fetchType, fetchParam }) => {
  const [movies, setMovies]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [fetchType, fetchParam]);

  useEffect(() => {
    const fn = FETCH_MAP[fetchType];
    if (!fn) return;
    setLoading(true);
    fn(fetchParam, currentPage)
      .then(r => {
        setMovies(r.data?.results || []);
        setTotalPages(Math.min(r.data?.total_pages || 1, 500));
      })
      .catch(e => console.error(title, e))
      .finally(() => setLoading(false));
  }, [fetchType, fetchParam, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mb-10">
      {title && (
        <div className="flex items-center justify-between mb-4 px-6 md:px-10">
          <h2 className="text-white text-lg font-bold flex items-center gap-3">
            <span className="w-1 h-5 bg-red-600 rounded-full" />{title}
          </h2>
          <span className="text-gray-600 text-xs">Page {currentPage} of {totalPages}</span>
        </div>
      )}

      <div className="px-6 md:px-10">
        {loading ? (
          <div className="grid grid-cols-5 gap-x-5 gap-y-10">
            {[...Array(20)].map((_, i) => (
              <div key={i}>
                <div className="w-full h-52 md:h-64 bg-gray-800/60 animate-pulse rounded-lg" />
                <div className="mt-2 h-3 bg-gray-800/40 animate-pulse rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <p className="text-gray-600 py-8 text-sm">No movies found.</p>
        ) : (
          <div className="grid grid-cols-5 gap-x-5 gap-y-8">
            {movies.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default MovieRow;