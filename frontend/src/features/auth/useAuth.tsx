'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiFetch, setAccessToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  roleId: string;
  roleName?: string;
  organizationId: string;
  permissions: string[];
  isPlatformOrg: boolean;
  planFeatures?: string[];
  blockedScreens?: string[];
  orgDisabledScreens?: string[];
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
  hasPermission: (key: string) => boolean;
  isScreenAllowed: (screenKey: string) => boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string, organizationId?: string) => Promise<LoginResult>;
  complete2fa: (preAuthToken: string, code: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string; organizationName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_access_token') : null;
    if (!token) return;
    try {
      const d = await apiFetch<{ user: AuthUser }>('/api/v1/auth/me');
      setUser({
        ...d.user,
        permissions: d.user.permissions || [],
        isPlatformOrg: d.user.isPlatformOrg || false,
        planFeatures: d.user.planFeatures || [],
        blockedScreens: d.user.blockedScreens || [],
        orgDisabledScreens: d.user.orgDisabledScreens || [],
      });
    } catch {
      // ignore refresh errors
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, organizationId?: string) => {
    const data = await apiFetch<LoginResult>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, organizationId }),
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
    async (data: { email: string; password: string; name?: string; organizationName: string }) => {
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

  const hasPermission = useCallback((key: string): boolean => {
    if (!user) return false;
    // Fail closed: no permissions means no access.
    if (!user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.permissions.includes(key);
  }, [user]);

  const isScreenAllowed = useCallback((screenKey: string): boolean => {
    if (!user) return false;

    // Permanent rule: Staff role is ALWAYS BLOCKED from administration screens
    const adminScreens = ['users', 'roles', 'screens', 'plan', 'platform'];
    if (user.roleName === 'Staff' && adminScreens.includes(screenKey)) {
      return false;
    }

    // 1. Per-user screen blocks (set by tenant org admin) - highest priority
    if (user.blockedScreens && user.blockedScreens.includes(screenKey)) {
      return false;
    }
    // 2. Manual Organization-level screen blocks (set by FinFlow Platform Admin)
    if (user.orgDisabledScreens && user.orgDisabledScreens.includes(screenKey)) {
      return false;
    }
    // 3. Platform Organization members see all remaining non-blocked screens
    if (user.isPlatformOrg) return true;
    // 4. Subscription Plan-level feature gates
    if (user.planFeatures && user.planFeatures.length > 0) {
      return user.planFeatures.includes(screenKey);
    }
    // No plan features configured = no restrictions
    return true;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, hasPermission, isScreenAllowed, refreshUser, login, complete2fa, register, logout }}
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
