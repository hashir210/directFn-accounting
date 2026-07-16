'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiFetch, setAccessToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface LoginResult {
  twoFactorRequired: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  preAuthToken?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  complete2fa: (preAuthToken: string, code: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_access_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: AuthUser }>('/api/v1/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<LoginResult>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!data.twoFactorRequired && data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  }, []);

  const complete2fa = useCallback(async (preAuthToken: string, code: string) => {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/api/v1/auth/2fa/authenticate',
      { method: 'POST', body: JSON.stringify({ preAuthToken, token: code }) },
    );
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name?: string }) => {
      await apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, complete2fa, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
