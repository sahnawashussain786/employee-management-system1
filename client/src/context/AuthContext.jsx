import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('ems_token') || null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem('ems_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { accessToken } = res.data;
    localStorage.setItem('ems_token', accessToken);
    setToken(accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/api/auth/register', data);
    const { accessToken } = res.data;
    localStorage.setItem('ems_token', accessToken);
    setToken(accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // ignore
    }
    localStorage.removeItem('ems_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
