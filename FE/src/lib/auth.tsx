import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized, tokenStore } from './api';
import type { User } from './types';

interface SessionResponse {
  token: string;
  user: User;
}

interface AuthValue {
  user: User | null;
  /** True until the stored token has been checked on first load. */
  restoring: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  logoutEverywhere: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  /** Store a fresh session (e.g. after a password change). */
  adopt: (session: SessionResponse) => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(() => Boolean(tokenStore.get()));

  const adopt = useCallback((session: SessionResponse) => {
    tokenStore.set(session.token);
    setUser(session.user);
  }, []);

  const refresh = useCallback(async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    setUser(res.user);
  }, []);

  // Restore the session after a page reload.
  useEffect(() => {
    onUnauthorized(() => setUser(null));
    if (!tokenStore.get()) return;
    refresh()
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setRestoring(false));
  }, [refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      restoring,
      isAuthenticated: Boolean(user),
      async login(email, password) {
        const s = await api.post<SessionResponse>('/auth/login', { email, password });
        adopt(s);
        return s.user;
      },
      async register(fullName, email, password) {
        const s = await api.post<SessionResponse>('/auth/register', { fullName, email, password });
        adopt(s);
        return s.user;
      },
      async loginWithGoogle(credential) {
        const s = await api.post<SessionResponse>('/auth/google', { credential });
        adopt(s);
        return s.user;
      },
      logout() {
        api.post('/auth/logout').catch(() => undefined);
        tokenStore.clear();
        setUser(null);
      },
      async logoutEverywhere() {
        await api.post('/auth/logout-all');
        tokenStore.clear();
        setUser(null);
      },
      refresh,
      setUser,
      adopt,
    }),
    [user, restoring, adopt, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
