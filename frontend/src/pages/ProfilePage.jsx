import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const timeAgo = (dateStr) => {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ratings, setRatings]               = useState([]);
  const [reviews, setReviews]               = useState([]);
  const [searchHistory, setSearchHistory]   = useState([]);
  const [commentsCount, setCommentsCount]   = useState(0);
  const [tab, setTab]                       = useState('searchHistory');
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, ratingsRes, reviewsRes, searchRes] = await Promise.all([
          API.get('/profile'),
          API.get('/my-ratings'),
          API.get('/my-reviews'),
          API.get('/search-history'),
        ]);
        setCommentsCount(profileRes.data.comments_count || 0);
        setRatings(ratingsRes.data || []);
        setReviews(reviewsRes.data || []);
        setSearchHistory(searchRes.data || []);
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleDeleteSearch = async (id) => {
    try {
      await API.delete(`/search-history/${id}`);
      setSearchHistory(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const handleClearAllSearch = async () => {
    try {
      await API.delete('/search-history');
      setSearchHistory([]);
    } catch {}
  };

  const handleDeleteReview = async (id) => {
    try {
      await API.delete(`/comments/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      setCommentsCount(prev => prev - 1);
    } catch {}
  };

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const TABS = [
    { id: 'searchHistory', label: '🔍 Search History', count: searchHistory.length },
    { id: 'ratings',       label: '⭐ Ratings',        count: ratings.length },
    { id: 'reviews',       label: '💬 Reviews',        count: reviews.length },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-20 md:pt-24 px-4 md:px-16 pb-16">

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 flex items-center justify-center text-xl md:text-2xl font-black flex-none">
          {initials}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl md:text-3xl font-black">{user.username}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
          <p className="text-gray-600 text-xs mt-1">
            Member since {new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-all flex-none"
        >
          Sign Out
        </button>
      </div>

      {/* Stats — 3 columns */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Searches', value: loading ? '...' : searchHistory.length },
          { label: 'Rated',    value: loading ? '...' : ratings.length },
          { label: 'Reviews',  value: loading ? '...' : commentsCount },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl md:text-3xl font-black text-red-500">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-none flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              tab === t.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20' : 'bg-white/10'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search History Tab ── */}
      {tab === 'searchHistory' && (
        <div>
          {searchHistory.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearAllSearch}
                className="text-xs text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all"
              >
                Clear All
              </button>
            </div>
          )}
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/60 animate-pulse rounded-xl mb-2" />
            ))
          ) : searchHistory.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500 text-sm">No search history yet!</p>
              <p className="text-gray-700 text-xs mt-1">Search for a movie to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchHistory.map(s => (
                <div key={s.id} className="group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 transition-all">
                  <span className="text-gray-500 text-sm flex-none">🔍</span>
                  <span className="flex-1 text-white text-sm">{s.query}</span>
                  <span className="text-gray-700 text-xs flex-none">{timeAgo(s.searched_at)}</span>
                  <button
                    onClick={() => handleDeleteSearch(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 text-xs transition-all flex-none p-1"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ratings Tab — shows poster + title + star rating ── */}
      {tab === 'ratings' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="w-full aspect-[2/3] bg-gray-800/60 animate-pulse rounded-xl" />
                  <div className="mt-2 h-3 bg-gray-800/40 animate-pulse rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-gray-500 text-sm">No ratings yet!</p>
              <p className="text-gray-700 text-xs mt-1">Rate a movie to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {ratings.map(r => (
                <div
                  key={r.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/movie/${r.tmdb_id}`)}
                >
                  {/* Poster */}
                  <div className="relative overflow-hidden rounded-xl border border-white/5 group-hover:border-red-600/30 transition-all">
                    <img
                      src={r.poster_path
                        ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
                        : 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster'}
                      alt={r.movie_title}
                      className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/555?text=No+Poster'; }}
                    />
                    {/* Rating badge on poster */}
                    <div className="absolute top-2 right-2 bg-black/90 rounded-lg px-2 py-1 flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-white text-xs font-black">{r.score}</span>
                    </div>
                  </div>
                  {/* Movie title */}
                  <p className="text-white text-xs font-semibold mt-2 line-clamp-1">{r.movie_title}</p>
                  {/* Stars */}
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xs ${s <= r.score ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reviews Tab — shows poster + title + review text ── */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800/60 animate-pulse rounded-xl" />
            ))
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 text-sm">No reviews yet!</p>
              <p className="text-gray-700 text-xs mt-1">Write a review on any movie to see it here</p>
            </div>
          ) : reviews.map(r => (
            <div
              key={r.id}
              className="group flex gap-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all"
            >
              {/* Movie poster small */}
              <div
                className="flex-none cursor-pointer"
                onClick={() => navigate(`/movie/${r.tmdb_id}`)}
              >
                <img
                  src={r.poster_path
                    ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                    : 'https://via.placeholder.com/92x138/1a1a1a/555?text=?'}
                  alt={r.movie_title}
                  className="w-12 h-[72px] object-cover rounded-lg border border-white/5 hover:border-red-600/30 transition-all"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/92x138/1a1a1a/555?text=?'; }}
                />
              </div>

              {/* Review content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <button
                    onClick={() => navigate(`/movie/${r.tmdb_id}`)}
                    className="text-white text-sm font-semibold hover:text-red-400 transition-colors line-clamp-1"
                  >
                    {r.movie_title}
                  </button>
                  <span className="text-gray-700 text-xs flex-none">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed break-words">{r.body}</p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDeleteReview(r.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 text-xs transition-all flex-none self-start p-1"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;