import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieRowScroll from '../components/MovieRowScroll';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import AuthModal from '../components/AuthModal';

const TMDB_KEY  = '19752fb21d9c9448fe7e4ecfe88a7d8d';
const TMDB_BASE = 'https://api.themoviedb.org/3';

API.get(`/movie/${id}`)
  .then(r => {
    const data = r.data;
    if (data.status_code === 34) {
      setError('Movie not found.');
      return;
    }
    setMovie(data);
    if (data.genres?.length) setGenreId(data.genres[0].id);
  })

const STREAMING = [
  {
    name: 'Netflix',
    color: 'bg-red-600 hover:bg-red-500',
    logo: 'N',
    url: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: 'Prime',
    color: 'bg-blue-600 hover:bg-blue-500',
    logo: '▶',
    url: (title) => `https://www.primevideo.com/search/?phrase=${encodeURIComponent(title)}`,
  },
  {
    name: 'Hotstar',
    color: 'bg-yellow-500 hover:bg-yellow-400',
    logo: '★',
    url: (title) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: 'YouTube',
    color: 'bg-red-500 hover:bg-red-400',
    logo: '▷',
    url: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' full movie')}`,
  },
];

const StarRating = ({ score, onRate, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || score || 0;
  const labels = { 1: 'Terrible', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Excellent' };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRate?.(s)}
            onMouseEnter={() => !readonly && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className={`text-2xl md:text-3xl leading-none transition-all duration-100
              ${readonly ? 'cursor-default' : 'cursor-pointer active:scale-125 md:hover:scale-125'}
              ${s <= active
                ? hovered ? 'text-yellow-300' : 'text-yellow-400'
                : 'text-gray-700'
              }`}
          >
            ★
          </button>
        ))}
      </div>
      {!readonly && (
        <span className="text-xs text-gray-500 h-4">
          {hovered
            ? labels[hovered]
            : score
              ? `Your rating: ${labels[score]}`
              : 'Tap a star to rate'}
        </span>
      )}
    </div>
  );
};

const Avatar = ({ username, avatarUrl }) => {
  const colors = ['bg-red-700','bg-orange-700','bg-amber-700','bg-emerald-700','bg-sky-700','bg-violet-700'];
  const color  = colors[(username?.charCodeAt(0) ?? 0) % colors.length];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username}
        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-none" />
    );
  }
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center
                     text-xs font-bold text-white flex-none`}>
      {username?.slice(0, 2).toUpperCase()}
    </div>
  );
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const MovieDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [genreId, setGenreId]         = useState(null);
  const [showAuth, setShowAuth]       = useState(false);
  const [ratings, setRatings]         = useState({ average: null, count: 0, user_score: null });
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // ✅ Load ratings with proper auth header attached
  const loadRatings = useCallback(async () => {
    try {
      const r = await API.get(`/ratings/${id}`);
      setRatings(r.data);
    } catch (e) {
      console.error('Ratings load error:', e);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setError(null);
    API.get(`/movie/${id}`)
      .then(data => {
        if (data.status_code === 34) {
          setError('Movie not found.');
          return;
        }
        setMovie(data);
        if (data.genres?.length) setGenreId(data.genres[0].id);
      })
      .catch(e => {
        console.error('Movie load error:', e);
        setError('Failed to load movie. Check your internet connection.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadRatings();
    API.get(`/comments/${id}`).then(r => setComments(r.data)).catch(() => {});
  }, [id, loadRatings]);

  // ✅ Track watch history only when user is logged in
  useEffect(() => {
    if (!movie || !user) return;
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    API.post('/history', {
      tmdb_id:     movie.id,
      movie_title: movie.title,
      poster_path: movie.poster_path,
    }).catch(() => {});
  }, [movie, user]);

  // ✅ FIXED: Rating handler — ensures auth header is set before calling
  const handleRate = async (score) => {
    if (!user) { setShowAuth(true); return; }

    const token = localStorage.getItem('mb_token');
    if (!token) { setShowAuth(true); return; }

    // Ensure header is set (defensive)
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setRatingLoading(true);
    try {
      await API.post('/ratings', { tmdb_id: Number(id), score });
      // Reload ratings to get updated average
      await loadRatings();
    } catch (e) {
      console.error('Rating error:', e);
      if (e.response?.status === 401) {
        setShowAuth(true);
      } else {
        alert('Failed to save rating. Please try again.');
      }
    } finally {
      setRatingLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { setShowAuth(true); return; }
    if (!commentText.trim()) return;

    const token = localStorage.getItem('mb_token');
    if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setSubmitting(true);
    try {
      const r = await API.post('/comments', { tmdb_id: Number(id), body: commentText.trim() });
      setComments(prev => [r.data, ...prev]);
      setCommentText('');
    } catch (e) {
      console.error('Comment error:', e);
      if (e.response?.status === 401) setShowAuth(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  if (loading) return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading movie...</p>
      </div>
    </div>
  );

  if (error || !movie) return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-sm">{error || 'Movie not found.'}</p>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
      >
        ← Go Back
      </button>
    </div>
  );

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : null;
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster';
  const cast    = movie.credits?.cast?.slice(0, 8) || [];
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const year    = movie.release_date?.slice(0, 4);
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2
                   bg-black/70 backdrop-blur-md border border-white/10 rounded-lg
                   text-gray-400 hover:text-white text-sm transition-all"
      >
        ← Back
      </button>

      {/* Backdrop */}
      <div className="relative w-full h-[40vh] md:h-[55vh] overflow-hidden bg-[#111]">
        {backdrop && (
          <img
            src={backdrop}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 -mt-32 md:-mt-48 relative z-10">

        <div className="flex flex-col md:flex-row gap-5 md:gap-8">

          {/* Poster */}
          <div className="flex-none flex md:block justify-center">
            <img
              src={poster}
              alt={movie.title}
              className="w-36 md:w-64 rounded-xl shadow-2xl shadow-black/70 border border-white/5"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster'; }}
            />
          </div>

          {/* Info panel */}
          <div className="flex-1 pt-2 md:pt-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 md:mb-3 leading-tight">
              {movie.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30
                                 px-2 py-0.5 rounded-full text-yellow-400 text-xs font-semibold">
                  ★ {Number(movie.vote_average).toFixed(1)}
                  <span className="text-yellow-600 text-xs ml-0.5">TMDB</span>
                </span>
              )}
              {ratings.average && (
                <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/30
                                 px-2 py-0.5 rounded-full text-red-400 text-xs font-semibold">
                  ★ {ratings.average}
                  <span className="text-red-600 text-xs ml-0.5">({ratings.count})</span>
                </span>
              )}
              {year    && <span className="text-gray-400 text-xs">{year}</span>}
              {runtime && <span className="text-gray-400 text-xs">{runtime}</span>}
              {movie.original_language && (
                <span className="text-gray-400 text-xs uppercase bg-white/5 px-2 py-0.5 rounded">
                  {movie.original_language}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-5">
              {movie.genres?.map(g => (
                <span key={g.id}
                  className="px-2 md:px-3 py-0.5 md:py-1 bg-red-600/20 border border-red-600/30 rounded-full
                             text-red-400 text-xs font-medium">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Overview */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4 md:mb-6 max-w-2xl">
              {movie.overview}
            </p>

            {/* ✅ Your Rating — shows loading state while saving */}
            <div className="mb-4 md:mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
                Your Rating
                {ratingLoading && <span className="ml-2 text-gray-600">Saving...</span>}
              </p>
              <StarRating score={ratings.user_score} onRate={handleRate} />
              {!user && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="mt-2 text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Sign in to rate →
                </button>
              )}
            </div>

            {/* Streaming buttons */}
            <div className="mb-4 md:mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 md:mb-3">Watch On</p>
              <div className="flex flex-wrap gap-2">
                {STREAMING.map(s => (
                  <a
                    key={s.name}
                    href={s.url(movie.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-white text-xs md:text-sm
                                font-semibold transition-all ${s.color} shadow-lg`}
                  >
                    <span>{s.logo}</span>
                    {s.name}
                  </a>
                ))}
              </div>
            </div>

            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20
                           border border-white/10 rounded-lg text-white text-sm font-medium transition-all"
              >
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* Top Cast */}
        {cast.length > 0 && (
          <div className="mt-8 md:mt-12">
            <h2 className="text-white text-base md:text-lg font-bold flex items-center gap-3 mb-4 md:mb-5">
              <span className="w-1 h-5 bg-red-600 rounded-full" />Top Cast
            </h2>
            <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {cast.map(actor => (
                <div key={actor.id} className="flex-none w-16 md:w-24 text-center">
                  <img
                    src={actor.profile_path
                      ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                      : 'https://via.placeholder.com/100x150/1a1a1a/555?text=?'}
                    alt={actor.name}
                    className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover mx-auto border-2 border-white/10 mb-1 md:mb-2"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100x150/1a1a1a/555?text=?'; }}
                  />
                  <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">
                    {actor.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Rating */}
        <div className="mt-8 md:mt-12 bg-white/[0.03] border border-white/8 rounded-2xl p-4 md:p-6">
          <h2 className="text-white font-bold flex items-center gap-3 mb-4">
            <span className="w-1 h-5 bg-red-600 rounded-full" />Community Rating
          </h2>
          {ratings.count > 0 ? (
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-black text-yellow-400">{ratings.average}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {ratings.count} rating{ratings.count !== 1 ? 's' : ''}
                </p>
              </div>
              <StarRating score={Math.round(ratings.average)} readonly />
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No community ratings yet — be the first!</p>
          )}
        </div>

        {/* Reviews */}
        <div className="mt-8 md:mt-10 mb-4">
          <h2 className="text-white text-base md:text-lg font-bold flex items-center gap-3 mb-4 md:mb-6">
            <span className="w-1 h-5 bg-red-600 rounded-full" />
            Reviews
            {comments.length > 0 && (
              <span className="text-xs text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </h2>

          {user ? (
            <form onSubmit={handleComment} className="mb-6 md:mb-8">
              <div className="flex gap-3">
                <Avatar username={user.username} avatarUrl={user.avatar_url} />
                <div className="flex-1 space-y-2 md:space-y-3">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-white/5 border border-white/10 focus:border-red-500/50
                               rounded-xl px-3 md:px-4 py-3 text-white text-sm outline-none transition-colors
                               placeholder-gray-600 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">{commentText.length}/1000</span>
                    <button
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                      className="px-4 md:px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40
                                 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      {submitting ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full mb-6 md:mb-8 py-4 border border-dashed border-white/15 rounded-xl
                         text-gray-500 hover:text-gray-300 hover:border-white/30 text-sm transition-all"
            >
              Sign in to write a review →
            </button>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-700 text-sm">No reviews yet — be the first!</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {comments.map(c => (
                <div
                  key={c.id}
                  className="group flex gap-3 bg-white/[0.03] hover:bg-white/[0.05]
                             border border-white/5 hover:border-white/10 rounded-xl
                             px-4 md:px-5 py-3 md:py-4 transition-all"
                >
                  <Avatar username={c.username} avatarUrl={c.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-white text-sm font-semibold">{c.username}</span>
                      <span className="text-gray-700 text-xs">{timeAgo(c.created_at)}</span>
                      {c.is_mine && (
                        <span className="text-xs text-red-500/70 bg-red-500/10 px-1.5 py-0.5 rounded">you</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed break-words">{c.body}</p>
                  </div>
                  {c.is_mine && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500
                                 text-xs transition-all flex-none self-start mt-0.5 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {genreId && (
          <div className="mt-8 md:mt-12">
            <MovieRowScroll title="You May Also Like" fetchType="recommend" fetchParam={id} />
          </div>
        )}
      </div>

      <div className="pb-16" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default MovieDetail;