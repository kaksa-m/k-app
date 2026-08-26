'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, clearToken, getToken } from './api';
import type { AuthUser, LoginResponse } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_KEY = 'kaksam_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restores the session from localStorage on first load, rather than
  // re-hitting the API — the JWT itself is the source of truth and any
  // request will 401 cleanly if it's expired.
  useEffect(() => {
    const token = getToken();
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(res.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }

  function logout() {
    clearToken();
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/login');
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
