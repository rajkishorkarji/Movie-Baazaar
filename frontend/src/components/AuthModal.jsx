import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const parseError = (err) => {
  if (!err.response) return 'Cannot connect to server. Make sure the backend is running.';
  const status = err.response.status;
  const detail = err.response.data?.detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d).join(', ');
  if (status === 400) return detail || 'Invalid request. Check your details.';
  if (status === 401) return 'Incorrect email or password.';
  if (status === 404) return 'Server not reachable.';
  if (status === 422) return detail || 'Please fill in all fields correctly.';
  if (status === 500) return 'Server error. Please try again.';
  return detail || `Error ${status}. Please try again.`;
};

// ✅ Password rules
const PASSWORD_RULES = [
  { id: 'uppercase', label: 'Start with uppercase letter (e.g. R)', test: (p) => /^[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Followed by lowercase letters (e.g. aj)',   test: (p) => /^[A-Z][a-z]+/.test(p) },
  { id: 'special', label: 'Special character (@)',       test: (p) => /^[A-Z][a-z]+@/.test(p) },
  { id: 'number',  label: 'End with numbers (1234)', test: (p) => /^[A-Z][a-z]+@[0-9]+$/.test(p) },
  { id: 'length',    label: 'At least 8 characters total',          test: (p) => p.length >= 8 },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  const strength = passed <= 2 ? 'Weak' : passed <= 3 ? 'Fair' : passed <= 4 ? 'Good' : 'Strong';
  const colors = { Weak: 'bg-red-500', Fair: 'bg-yellow-500', Good: 'bg-blue-500', Strong: 'bg-green-500' };
  const widths = { Weak: 'w-1/4', Fair: 'w-2/4', Good: 'w-3/4', Strong: 'w-full' };

  return (
    <div className="mt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${colors[strength]} ${widths[strength]}`} />
        </div>
        <span className={`text-xs font-medium ${
          strength === 'Weak' ? 'text-red-400' :
          strength === 'Fair' ? 'text-yellow-400' :
          strength === 'Good' ? 'text-blue-400' : 'text-green-400'
        }`}>{strength}</span>
      </div>
      {/* Rules checklist */}
      <div className="grid grid-cols-1 gap-0.5">
        {PASSWORD_RULES.map(rule => (
          <div key={rule.id} className="flex items-center gap-1.5">
            <span className={`text-xs ${rule.test(password) ? 'text-green-400' : 'text-gray-600'}`}>
              {rule.test(password) ? '✓' : '○'}
            </span>
            <span className={`text-xs ${rule.test(password) ? 'text-green-400' : 'text-gray-600'}`}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuthModal = ({ onClose }) => {
  const { emailLogin, emailRegister } = useAuth();

  const [mode, setMode]               = useState('login');
  const [form, setForm]               = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setFieldErrors({});
    setForm({ username: '', email: '', password: '', confirmPassword: '' });
  };

  // ✅ Validate email format
  const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
};

  // ✅ Validate all fields
  const validate = () => {
    const errors = {};

    if (mode === 'register') {
      if (!form.username.trim())
        errors.username = 'Username is required';
      else if (form.username.trim().length < 3)
        errors.username = 'Username must be at least 3 characters';
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim()))
        errors.username = 'Only letters, numbers and underscores allowed';
    }

    if (!form.email.trim())
      errors.email = 'Email is required';
    else if (!isValidEmail(form.email.trim()))
      errors.email = 'Only Gmail addresses allowed (example@gmail.com)';

    if (!form.password)
      errors.password = 'Password is required';
    else if (mode === 'register') {
      const failedRules = PASSWORD_RULES.filter(r => !r.test(form.password));
      if (failedRules.length > 0)
        errors.password = `Password must have: ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`;
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register') {
      if (!form.confirmPassword)
        errors.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword)
        errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handle = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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

  const updateField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    // Clear field error when user types
    if (fieldErrors[key]) {
      setFieldErrors(f => ({ ...f, [key]: '' }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">

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

          {/* Username — register only */}
          {mode === 'register' && (
            <div>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={e => updateField('username', e.target.value)}
                autoFocus
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder-gray-500 ${
                  fieldErrors.username ? 'border-red-500' : 'border-white/10 focus:border-red-500'
                }`}
              />
              {fieldErrors.username && (
                <p className="text-red-400 text-xs mt-1">⚠ {fieldErrors.username}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              autoFocus={mode === 'login'}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder-gray-500 ${
                fieldErrors.email ? 'border-red-500' : 'border-white/10 focus:border-red-500'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-xs mt-1">⚠ {fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 pr-12 text-white text-sm outline-none transition-colors placeholder-gray-500 ${
                  fieldErrors.password ? 'border-red-500' : 'border-white/10 focus:border-red-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs transition-colors"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-400 text-xs mt-1">⚠ {fieldErrors.password}</p>
            )}
            {/* ✅ Show password strength only on register */}
            {mode === 'register' && form.password && (
              <PasswordStrength password={form.password} />
            )}
          </div>

          {/* Confirm Password — register only */}
          {mode === 'register' && (
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-3 pr-12 text-white text-sm outline-none transition-colors placeholder-gray-500 ${
                    fieldErrors.confirmPassword ? 'border-red-500' :
                    form.confirmPassword && form.password === form.confirmPassword ? 'border-green-500' :
                    'border-white/10 focus:border-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs transition-colors"
                >
                  {showConfirmPassword ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">⚠ {fieldErrors.confirmPassword}</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>
          )}

          {/* General error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <span className="text-red-500 text-sm flex-none mt-0.5">⚠</span>
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Switch mode */}
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