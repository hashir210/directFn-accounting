const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const TOKEN_KEY = 'ff_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(message: string, code = 'ERROR', details: unknown = null, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await res.json();
    if (body?.success && body?.data?.accessToken) {
      setAccessToken(body.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Thin fetch wrapper around the FinFlow backend.
 * - Prefixes the configured API base URL
 * - Attaches `Authorization: Bearer <accessToken>` when present
 * - Sends credentials (httpOnly refresh-token cookie)
 * - Normalizes the `{ success, data, message, code }` envelope
 * - Auto-refreshes the access token once on a 401 (except auth routes)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Endpoints where a 401 must NOT trigger a token refresh: the refresh call
  // itself (avoids loops) and the credential-exchange endpoints (a 401 there is
  // a genuine auth failure, not an expired access token). Note: `/auth/me` is
  // deliberately excluded so a valid session survives access-token expiry.
  const noRefreshPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/2fa/authenticate',
  ];
  const skipRefresh = noRefreshPaths.some((p) => path.includes(p));
  const doRequest = () => fetch(url, { ...options, headers, credentials: 'include' });

  let res = await doRequest();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = await res.json().catch(() => ({}));

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
      res = await doRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body = await res.json().catch(() => ({}));
    }
  }

  if (!res.ok) {
    throw new ApiError(
      body?.message || 'Request failed',
      body?.code || 'ERROR',
      body?.details ?? null,
      res.status,
    );
  }

  return body?.data as T;
}

export default apiFetch;
