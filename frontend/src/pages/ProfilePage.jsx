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

  const [history, setHistory]           = useState([]);
  const [ratings, setRatings]           = useState([]);
  const [reviews, setReviews]           = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [tab, setTab]                   = useState('history');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [histRes, profileRes, reviewsRes, searchRes] = await Promise.all([
          API.get('/history'),
          API.get('/profile'),
          API.get('/my-reviews'),
          API.get('/search-history'),
        ]);
        setHistory(histRes.data);
        setRatings(profileRes.data.recent_ratings || []);
        setCommentsCount(profileRes.data.comments_count || 0);
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
    } catch {}
  };

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const TABS = [
    { id: 'history',       label: '🎬 History',        count: history.length },
    { id: 'ratings',       label: '⭐ Ratings',         count: ratings.length },
    { id: 'reviews',       label: '💬 Reviews',         count: reviews.length },
    { id: 'searchHistory', label: '🔍 Search History',  count: searchHistory.length },
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Watched',   value: loading ? '...' : history.length },
          { label: 'Rated',     value: loading ? '...' : ratings.length },
          { label: 'Reviews',   value: loading ? '...' : commentsCount },
          { label: 'Searches',  value: loading ? '...' : searchHistory.length },
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

      {/* ── Watch History Tab ── */}
      {tab === 'history' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="w-full aspect-[2/3] bg-gray-800/60 animate-pulse rounded-lg" />
              </div>
            ))
          ) : history.length === 0 ? (
            <p className="text-gray-600 col-span-full py-8 text-sm text-center">No watch history yet!</p>
          ) : history.map(h => (
            <div key={h.id} onClick={() => navigate(`/movie/${h.tmdb_id}`)} className="cursor-pointer group">
              <img
                src={h.poster_path ? `https://image.tmdb.org/t/p/w200${h.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/555?text=?'}
                alt={h.movie_title}
                className="w-full rounded-lg object-cover aspect-[2/3] group-hover:opacity-80 transition-opacity border border-white/5"
              />
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{h.movie_title}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Ratings Tab ── */}
      {tab === 'ratings' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="w-full aspect-[2/3] bg-gray-800/60 animate-pulse rounded-lg" />
              </div>
            ))
          ) : ratings.length === 0 ? (
            <p className="text-gray-600 col-span-full py-8 text-sm text-center">No ratings yet!</p>
          ) : ratings.map(r => (
            <div key={r.id} className="cursor-pointer group" onClick={() => navigate(`/movie/${r.tmdb_id}`)}>
              <div className="w-full aspect-[2/3] bg-gray-800/60 rounded-lg flex flex-col items-center justify-center border border-white/5 group-hover:border-red-600/30 transition-colors gap-1">
                <span className="text-2xl font-black text-red-500">{r.score}</span>
                <span className="text-xs text-gray-500">/ 5</span>
              </div>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-xs ${s <= r.score ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 text-center">Movie #{r.tmdb_id}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/60 animate-pulse rounded-xl" />
            ))
          ) : reviews.length === 0 ? (
            <p className="text-gray-600 py-8 text-sm text-center">No reviews yet! Go watch a movie and share your thoughts.</p>
          ) : reviews.map(r => (
            <div key={r.id} className="group flex gap-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl px-4 py-4 transition-all">
              {/* Movie poster small */}
              <div
                className="flex-none w-10 h-14 bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => navigate(`/movie/${r.tmdb_id}`)}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">🎬</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <button
                    onClick={() => navigate(`/movie/${r.tmdb_id}`)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
                  >
                    Movie #{r.tmdb_id} →
                  </button>
                  <span className="text-gray-700 text-xs">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed break-words">{r.body}</p>
              </div>
              {/* Delete button */}
              <button
                onClick={() => handleDeleteReview(r.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 text-xs transition-all flex-none self-start p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Search History Tab ── */}
      {tab === 'searchHistory' && (
        <div>
          {/* Clear all button */}
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
            <p className="text-gray-600 py-8 text-sm text-center">No search history yet!</p>
          ) : (
            <div className="space-y-2">
              {searchHistory.map(s => (
                <div key={s.id} className="group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 transition-all">
                  <span className="text-gray-600 text-sm">🔍</span>
                  <button
                    onClick={() => navigate(`/?search=${encodeURIComponent(s.query)}`)}
                    className="flex-1 text-left text-white text-sm hover:text-red-400 transition-colors"
                  >
                    {s.query}
                  </button>
                  <span className="text-gray-700 text-xs flex-none">{timeAgo(s.searched_at)}</span>
                  <button
                    onClick={() => handleDeleteSearch(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 text-xs transition-all flex-none p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;