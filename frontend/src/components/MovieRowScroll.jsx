import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending, getPopular, getTopRated, getByGenre, searchMovies, getBollywood, getHollywood, getSouthIndian, getHindiDubbed, getWebSeries, getRecommendations } from '../api';

const FETCH_MAP = {
  trending:    () => getTrending(),
  popular:     () => getPopular(),
  topRated:    () => getTopRated(),
  genre:       (p) => getByGenre(p),
  search:      (p) => searchMovies(p),
  bollywood:   () => getBollywood(),
  hollywood:   () => getHollywood(),
  southIndian: () => getSouthIndian(),
  hindiDubbed: () => getHindiDubbed(),
  webSeries:   () => getWebSeries(),
  recommend:   (p) => getRecommendations(p),
};

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  // ✅ Use w342 (smaller) instead of w500 — much faster on mobile
  const img = (!imgError && movie.poster_path)
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster';
  const rating = movie.vote_average || movie.rating;

  return (
    <div
      className="flex-none w-32 sm:w-36 md:w-44 cursor-pointer group"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 active:scale-95 md:group-hover:-translate-y-1 md:group-hover:shadow-2xl md:group-hover:shadow-black/70">
        <img
          className="w-full h-48 sm:h-52 md:h-64 object-cover transition-transform duration-500 md:group-hover:scale-105"
          src={img}
          alt={movie.title || movie.name}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {rating > 0 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-white text-xs font-semibold">{Number(rating).toFixed(1)}</span>
          </div>
        )}
        {/* Desktop hover overlay only */}
        <div className="absolute inset-0 bg-black/60 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="bg-red-600 hover:bg-red-500 text-white text-sm px-5 py-2 rounded-lg font-bold transition-colors shadow-lg">
            ▶ Watch
          </button>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-white text-xs font-semibold leading-snug line-clamp-2">
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

const MovieRowScroll = ({ title, fetchType, fetchParam }) => {
  const [movies, setMovies]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(true);
  const ref = useRef(null);

  const fetchMovies = () => {
    const fn = FETCH_MAP[fetchType];
    if (!fn) return;
    setLoading(true);
    setError(false);
    fn(fetchParam)
      .then(r => setMovies(r.data?.results || []))
      .catch(e => {
        console.error(title, e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies();
  }, [fetchType, fetchParam]);

  const scroll = (d) => ref.current?.scrollBy({ left: d * 400, behavior: 'smooth' });
  const onScroll = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 0);
    setCanRight(ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 10);
  };

  return (
    <div className="mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-10">
        <h2 className="text-white text-base md:text-lg font-bold flex items-center gap-3">
          <span className="w-1 h-5 bg-red-600 rounded-full" />{title}
        </h2>
      </div>
      <div className="relative">
        {/* Arrow buttons — only show on desktop */}
        {canLeft && (
          <button onClick={() => scroll(-1)} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-red-600 border border-gray-700 rounded-full items-center justify-center text-white text-xl transition-all">‹</button>
        )}
        {canRight && !loading && movies.length > 0 && (
          <button onClick={() => scroll(1)} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-red-600 border border-gray-700 rounded-full items-center justify-center text-white text-xl transition-all">›</button>
        )}
        <div className="absolute left-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent z-[5] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent z-[5] pointer-events-none" />

        <div
          ref={ref}
          onScroll={onScroll}
          className="flex overflow-x-scroll scrollbar-hide gap-2 md:gap-3 px-4 md:px-10 pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex-none w-32 sm:w-36 md:w-44">
                <div className="w-full h-48 sm:h-52 md:h-64 bg-gray-800/60 animate-pulse rounded-lg" />
                <div className="mt-2 h-3 bg-gray-800/40 animate-pulse rounded w-3/4" />
              </div>
            ))
          ) : error ? (
            <div className="flex items-center gap-3 py-8 px-2">
              <p className="text-gray-600 text-sm">Failed to load.</p>
              <button
                onClick={fetchMovies}
                className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 px-2 py-1 rounded"
              >
                Retry
              </button>
            </div>
          ) : movies.length === 0 ? (
            <p className="text-gray-600 py-8 text-sm">No movies found.</p>
          ) : (
            movies.map(m => <MovieCard key={m.id} movie={m} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieRowScroll;