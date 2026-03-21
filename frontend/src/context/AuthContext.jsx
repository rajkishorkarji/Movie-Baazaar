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
    // ✅ Always ensure header is set before verifying
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    API.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('mb_token');
        delete API.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Shared helper: save token + set axios header ──────────────────────────
  const _applyToken = (token, userData) => {
    localStorage.setItem('mb_token', token);
    // ✅ Set BOTH default header AND instance header to be safe
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const emailRegister = async (username, email, password) => {
    const r = await API.post('/auth/email/register', { username, email, password });
    _applyToken(r.data.access_token, r.data.user);
  };

  const emailLogin = async (email, password) => {
    const r = await API.post('/auth/email/login', { email, password });
    _applyToken(r.data.access_token, r.data.user);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('mb_token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

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