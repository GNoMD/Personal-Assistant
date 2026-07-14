import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { clearAuth, getToken, setAuth } from '../auth/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Never trust localStorage user for route access until /me succeeds.
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      setUser(null);
      setTeams([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      setTeams(data.teams || []);
    } catch {
      clearAuth();
      setUser(null);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setAuth(data.token, data.user);
    setUser(data.user);
    setTeams(data.teams || []);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    setAuth(data.token, data.user);
    setUser(data.user);
    setTeams(data.team ? [data.team] : []);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setTeams([]);
  }, []);

  const value = useMemo(
    () => ({
      user,
      teams,
      setTeams,
      loading,
      login,
      register,
      logout,
      // Only true after bootstrap/login proves a valid session.
      isAuthenticated: !loading && Boolean(user),
      isAdmin: !loading && Boolean(user?.isAdmin),
    }),
    [user, teams, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
