import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieRowScroll from '../components/MovieRowScroll';
import axios from 'axios';

const TMDB_KEY  = '19752fb21d9c9448fe7e4ecfe88a7d8d';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_BASE = '/api';

// Generate or retrieve session ID
const getSessionId = () => {
  let sid = localStorage.getItem('mb_session_id');
  if (!sid) {
    sid = 'user_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('mb_session_id', sid);
  }
  return sid;
};

const tmdbGet = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  return r.json();
};

const STREAMING = [
  { name: 'Netflix',     color: 'bg-red-600 hover:bg-red-500',    logo: 'N', url: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
  { name: 'Prime Video', color: 'bg-blue-600 hover:bg-blue-500',  logo: '▶', url: (t) => `https://www.primevideo.com/search/?phrase=${encodeURIComponent(t)}` },
  { name: 'Hotstar',     color: 'bg-yellow-500 hover:bg-yellow-400', logo: '★', url: (t) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(t)}` },
  { name: 'YouTube',     color: 'bg-red-500 hover:bg-red-400',    logo: '▷', url: (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t + ' full movie')}` },
];

// ─── Star Rating Component ────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-2xl transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
            star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MovieDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const sessionId  = getSessionId();

  const [movie,       setMovie]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Rating state
  const [userRating,  setUserRating]  = useState(0);
  const [avgRating,   setAvgRating]   = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingMsg,   setRatingMsg]   = useState('');

  // Review state
  const [reviews,     setReviews]     = useState([]);
  const [comment,     setComment]     = useState('');
  const [reviewMsg,   setReviewMsg]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // Fetch movie details
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    tmdbGet(`/movie/${id}`, { append_to_response: 'credits,videos' })
      .then(data => setMovie(data))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch rating + reviews once movie is loaded
  useEffect(() => {
    if (!movie?.id) return;
    fetchRating();
    fetchReviews();
  }, [movie]);

  const fetchRating = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rating/${movie.id}`, {
        params: { session_id: sessionId }
      });
      setAvgRating(res.data.avg_rating);
      setUserRating(res.data.user_rating || 0);
      setTotalRatings(res.data.total);
    } catch (e) {
      console.error('Rating fetch failed:', e);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/reviews/${movie.id}`);
      setReviews(res.data);
    } catch (e) {
      console.error('Reviews fetch failed:', e);
    }
  };

  const handleRate = async (star) => {
    setUserRating(star);
    try {
      await axios.post(`${API_BASE}/rate`, {
        tmdb_id:    movie.id,
        title:      movie.title,
        poster_path: movie.poster_path,
        session_id: sessionId,
        rating:     star
      });
      setRatingMsg('Rating saved!');
      setTimeout(() => setRatingMsg(''), 2000);
      fetchRating();
    } catch (e) {
      setRatingMsg('Failed to save rating.');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/review`, {
        tmdb_id:    movie.id,
        title:      movie.title,
        poster_path: movie.poster_path,
        session_id: sessionId,
        comment:    comment.trim()
      });
      setComment('');
      setReviewMsg('Review posted!');
      setTimeout(() => setReviewMsg(''), 2000);
      fetchReviews();
    } catch (e) {
      setReviewMsg('Failed to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`${API_BASE}/review/${reviewId}`, {
        params: { session_id: sessionId }
      });
      fetchReviews();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // ─── Loading / Not Found ────────────────────────────────────────────────────
  if (loading) return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading movie...</p>
      </div>
    </div>
  );

  if (!movie) return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Movie not found.</p>
    </div>
  );

  const backdrop  = movie.backdrop_path  ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const poster    = movie.poster_path    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`       : 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster';
  const cast      = movie.credits?.cast?.slice(0, 8) || [];
  const trailer   = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const year      = movie.release_date?.slice(0, 4);
  const runtime   = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-all"
      >
        ← Back
      </button>

      {/* Backdrop */}
      <div className="relative w-full h-[55vh] overflow-hidden">
        {backdrop && <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Poster */}
          <div className="flex-none">
            <img src={poster} alt={movie.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl shadow-black/70 border border-white/5" />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-16">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">{movie.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full text-yellow-400 text-sm font-semibold">
                  ★ {Number(movie.vote_average).toFixed(1)}
                </span>
              )}
              {year      && <span className="text-gray-400 text-sm">{year}</span>}
              {runtime   && <span className="text-gray-400 text-sm">{runtime}</span>}
              {movie.original_language && (
                <span className="text-gray-400 text-sm uppercase bg-white/5 px-2 py-0.5 rounded">
                  {movie.original_language}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.genres?.map(g => (
                <span key={g.id} className="px-3 py-1 bg-red-600/20 border border-red-600/30 rounded-full text-red-400 text-xs font-medium">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Overview */}
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>

            {/* Streaming */}
            <div className="mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Watch On</p>
              <div className="flex flex-wrap gap-3">
                {STREAMING.map(s => (
                  <a key={s.name} href={s.url(movie.title)} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all ${s.color} shadow-lg`}>
                    <span>{s.logo}</span>{s.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Trailer */}
            {trailer && (
              <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all">
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* ── Cast ─────────────────────────────────────────────────────────── */}
        {cast.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white text-lg font-bold flex items-center gap-3 mb-5">
              <span className="w-1 h-5 bg-red-600 rounded-full" />Top Cast
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {cast.map(actor => (
                <div key={actor.id} className="flex-none w-24 text-center">
                  <img
                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/100x150/1a1a1a/555?text=?'}
                    alt={actor.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-white/10 mb-2"
                  />
                  <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{actor.name}</p>
                  <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rate This Movie ───────────────────────────────────────────────── */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white text-lg font-bold flex items-center gap-3 mb-4">
            <span className="w-1 h-5 bg-red-600 rounded-full" />Rate This Movie
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">Your Rating</p>
              <StarRating value={userRating} onChange={handleRate} />
              {ratingMsg && <p className="text-green-400 text-xs mt-2">{ratingMsg}</p>}
            </div>
            {avgRating && (
              <div className="sm:ml-8 border-l border-white/10 sm:pl-8">
                <p className="text-gray-400 text-sm mb-1">Community Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-2xl font-bold">{avgRating}</span>
                  <span className="text-yellow-400 text-lg">★</span>
                  <span className="text-gray-500 text-sm">({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ──────────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-white text-lg font-bold flex items-center gap-3 mb-5">
            <span className="w-1 h-5 bg-red-600 rounded-full" />Reviews
            {reviews.length > 0 && (
              <span className="text-gray-500 text-sm font-normal">({reviews.length})</span>
            )}
          </h2>

          {/* Write Review */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <p className="text-gray-400 text-sm mb-3">Write a Review</p>
            <form onSubmit={handleReview} className="flex flex-col gap-3">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts about this movie..."
                maxLength={500}
                rows={3}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none placeholder-gray-600 resize-none focus:border-red-600/50 transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">{comment.length}/500</span>
                <button
                  type="submit"
                  disabled={!comment.trim() || submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-semibold transition-all"
                >
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
              {reviewMsg && <p className="text-green-400 text-xs">{reviewMsg}</p>}
            </form>
          </div>

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-600/30 flex items-center justify-center text-red-400 text-xs font-bold">
                        {r.session_id.slice(5, 7).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">User {r.session_id.slice(5, 10)}</p>
                        <p className="text-gray-600 text-xs">{r.created_at}</p>
                      </div>
                    </div>
                    {r.session_id === sessionId && (
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recommended Movies ───────────────────────────────────────────── */}
        <div className="mt-12">
          <MovieRowScroll title="Most Recommended Movies" fetchType="recommend" fetchParam={id} />
        </div>

      </div>
      <div className="pb-16" />
    </div>
  );
};

export default MovieDetail;