import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory]             = useState([]);
  const [ratings, setRatings]             = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [tab, setTab]                     = useState('history');
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [histRes, profileRes] = await Promise.all([
          API.get('/history'),
          API.get('/profile'),
        ]);
        setHistory(histRes.data);
        setRatings(profileRes.data.recent_ratings || []);
        setCommentsCount(profileRes.data.comments_count || 0);
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-20 md:pt-24 px-4 md:px-16 pb-16">
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

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Watched', value: loading ? '...' : history.length },
          { label: 'Rated',   value: loading ? '...' : ratings.length },
          { label: 'Reviews', value: loading ? '...' : commentsCount },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl md:text-3xl font-black text-red-500">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 border-b border-white/10 pb-2">
        {['history', 'ratings'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              tab === t ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'history' ? '🎬 History' : '⭐ Ratings'}
          </button>
        ))}
      </div>

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
              <div className="w-full aspect-[2/3] bg-gray-800/60 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-red-600/30 transition-colors">
                <span className="text-2xl font-black text-red-500">{r.score}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">#{r.tmdb_id}</p>
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
  );
};

export default ProfilePage;