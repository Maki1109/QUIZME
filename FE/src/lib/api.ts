/**
 * Minimal API client.
 * - Base URL comes from VITE_API_URL (empty → same origin).
 * - The session token is attached as a Bearer header; it is never put in URLs.
 * - A 401 clears the session and notifies the auth provider.
 */

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '';
const BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
const TOKEN_KEY = 'quizme_token';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let unauthorizedHandler: (() => void) | null = null;
export const onUnauthorized = (fn: () => void) => {
  unauthorizedHandler = fn;
};

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode: session lasts for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('quizme_user'); // left by older versions
      localStorage.removeItem('token');
    } catch {
      /* ignore */
    }
  },
};

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const url = `${BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Query; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: opts.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      unauthorizedHandler?.();
    }
    const message = (data && typeof data.message === 'string' && data.message) || (res.status >= 500 ? 'Máy chủ đang gặp sự cố, vui lòng thử lại sau.' : 'Yêu cầu không hợp lệ.');
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body: body ?? {} }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body: body ?? {} }),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<T>('POST', path, { form });
  },
};

export const errorMessage = (err: unknown, fallback = 'Đã có lỗi xảy ra') => (err instanceof Error && err.message ? err.message : fallback);
