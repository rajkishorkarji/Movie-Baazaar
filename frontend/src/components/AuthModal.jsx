import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ── Parse any axios error into a readable string ── */
const parseError = (err) => {
  if (!err.response) {
    return 'Cannot connect to server. Make sure the backend is running.';
  }
  const status = err.response.status;
  const detail = err.response.data?.detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d).join(', ');
  if (status === 400) return detail || 'Invalid request. Check your details.';
  if (status === 401) return 'Incorrect email or password.';
  if (status === 404) return 'Server not reachable. Check your backend URL.';
  if (status === 422) return detail || 'Please fill in all fields correctly.';
  if (status === 500) return 'Server error. Please try again.';
  return detail || `Error ${status}. Please try again.`;
};

const AuthModal = ({ onClose }) => {
  // ── uses emailLogin / emailRegister — matches updated AuthContext ──
  const { emailLogin, emailRegister } = useAuth();

  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setForm({ username: '', email: '', password: '' });
  };

  const handle = async (e) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation before hitting the server ──
    if (mode === 'register') {
      if (!form.username.trim())
        return setError('Username is required.');
      if (form.username.trim().length < 3)
        return setError('Username must be at least 3 characters.');
      if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim()))
        return setError('Username can only contain letters, numbers and underscores.');
    }
    if (!form.email.trim())
      return setError('Email is required.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (mode === 'login') {
        await emailLogin(form.email.trim(), form.password);
      } else {
        await emailRegister(form.username.trim(), form.email.trim(), form.password);
      }
      onClose();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (type, placeholder, key, autoFocus = false) => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      autoFocus={autoFocus}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                 text-white text-sm outline-none focus:border-red-500
                 transition-colors placeholder-gray-500"
      required
    />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl transition-colors"
        >✕</button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Join Movie Baazaar'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'login'
              ? 'Sign in to rate, comment & track movies.'
              : 'Create your account to get started.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          {[['login', 'Sign In'], ['register', 'Sign Up']].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === m ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} className="space-y-4">

          {mode === 'register' && field('text',     'Username', 'username', true)}
          {field('email',    'Email',    'email',    mode === 'login')}
          {field('password', 'Password', 'password')}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30
                            rounded-lg px-4 py-3">
              <span className="text-red-500 text-sm flex-none mt-0.5">⚠</span>
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50
                       text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Switch mode link */}
          <p className="text-center text-xs text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </form>
      </div>
    </div>
  );
};

export default AuthModal;