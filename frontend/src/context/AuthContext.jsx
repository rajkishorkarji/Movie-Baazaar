import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Token already set on axios by api.js on import — just verify it's still valid
    API.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem('mb_token');
        delete API.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Shared helper: save token + set axios header ──────────────────────────
  const _applyToken = (token, userData) => {
    localStorage.setItem('mb_token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  // ── Email register ────────────────────────────────────────────────────────
  // Route: POST /auth/email/register
  // Response includes { access_token, user } — no second /auth/me call needed
  const emailRegister = async (username, email, password) => {
    const r = await API.post('/auth/email/register', { username, email, password });
    _applyToken(r.data.access_token, r.data.user);
  };

  // ── Email login ───────────────────────────────────────────────────────────
  // Route: POST /auth/email/login
  const emailLogin = async (email, password) => {
    const r = await API.post('/auth/email/login', { email, password });
    _applyToken(r.data.access_token, r.data.user);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('mb_token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // ── Refresh user (called after profile edit) ──────────────────────────────
  const refreshUser = async () => {
    const r = await API.get('/auth/me');
    setUser(r.data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      emailRegister,
      emailLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};