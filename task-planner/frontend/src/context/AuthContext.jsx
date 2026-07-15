import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { clearAuth, getToken, setAuth } from '../auth/storage';
import { clearAllTaskCaches, setCacheUser } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Never trust localStorage user for route access until /me succeeds.
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const avatarObjectUrlRef = useRef(null);

  const revokeAvatarUrl = useCallback(() => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarSrc(null);
  }, []);

  const refreshAvatar = useCallback(async () => {
    if (!getToken()) {
      revokeAvatarUrl();
      return;
    }
    try {
      const blob = await api.fetchAvatarBlob();
      revokeAvatarUrl();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      avatarObjectUrlRef.current = url;
      setAvatarSrc(url);
    } catch {
      revokeAvatarUrl();
    }
  }, [revokeAvatarUrl]);

  const bootstrap = useCallback(async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      clearAllTaskCaches();
      setUser(null);
      setTeams([]);
      revokeAvatarUrl();
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setCacheUser(data.user?.id);
      setUser(data.user);
      setTeams(data.teams || []);
      await refreshAvatar();
    } catch {
      clearAuth();
      clearAllTaskCaches();
      setUser(null);
      setTeams([]);
      revokeAvatarUrl();
    } finally {
      setLoading(false);
    }
  }, [refreshAvatar, revokeAvatarUrl]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    clearAllTaskCaches();
    setCacheUser(data.user?.id);
    setAuth(data.token, data.user);
    setUser(data.user);
    setTeams(data.teams || []);
    await refreshAvatar();
    return data;
  }, [refreshAvatar]);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    clearAllTaskCaches();
    setCacheUser(data.user?.id);
    setAuth(data.token, data.user);
    setUser(data.user);
    setTeams(data.team ? [data.team] : []);
    revokeAvatarUrl();
    return data;
  }, [revokeAvatarUrl]);

  const logout = useCallback(() => {
    clearAuth();
    clearAllTaskCaches();
    setUser(null);
    setTeams([]);
    revokeAvatarUrl();
  }, [revokeAvatarUrl]);

  const bumpAvatar = useCallback(async () => {
    setAvatarVersion((v) => v + 1);
    await refreshAvatar();
  }, [refreshAvatar]);

  const value = useMemo(
    () => ({
      user,
      teams,
      setTeams,
      loading,
      login,
      register,
      logout,
      avatarSrc,
      avatarVersion,
      refreshAvatar: bumpAvatar,
      // Only true after bootstrap/login proves a valid session.
      isAuthenticated: !loading && Boolean(user),
      isAdmin: !loading && Boolean(user?.isAdmin),
    }),
    [user, teams, loading, login, register, logout, avatarSrc, avatarVersion, bumpAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
