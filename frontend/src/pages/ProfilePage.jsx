import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [tab, setTab] = useState('history');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    API.get('/history').then(r => setHistory(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-24 px-6 md:px-16">
      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-2xl font-black">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-black">{user.username}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
          <p className="text-gray-600 text-xs mt-1">
            Member since {new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="ml-auto px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Movies Watched', value: history.length },
          { label: 'Movies Rated', value: ratings.length },
          { label: 'Reviews Written', value: 0 },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-red-500">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {['history', 'ratings'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'history' ? '🎬 Watch History' : '⭐ My Ratings'}
          </button>
        ))}
      </div>

      {/* Watch History */}
      {tab === 'history' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {history.length === 0 ? (
            <p className="text-gray-600 col-span-full py-8">No watch history yet. Start watching movies!</p>
          ) : history.map(h => (
            <div
              key={h.id}
              onClick={() => navigate(`/movie/${h.tmdb_id}`)}
              className="cursor-pointer group"
            >
              <img
                src={h.poster_path
                  ? `https://image.tmdb.org/t/p/w200${h.poster_path}`
                  : 'https://via.placeholder.com/200x300/1a1a1a/555?text=?'}
                alt={h.movie_title}
                className="w-full rounded-lg object-cover aspect-[2/3] group-hover:opacity-80 transition-opacity"
              />
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{h.movie_title}</p>
              <p className="text-xs text-gray-600">{new Date(h.watched_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;