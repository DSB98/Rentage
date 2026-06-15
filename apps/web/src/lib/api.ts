import axios from 'axios';

const normalizeLocalApiUrl = (url: string) => {
  if (url.includes('http://localhost:4100')) {
    return url.replace('http://localhost:4100', 'http://localhost:4000');
  }

  return url;
};

const API_URL = normalizeLocalApiUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
);

const api = axios.create({
  baseURL: API_URL,
});

const unwrap = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    // Preserve pagination metadata for list endpoints while still unwrapping data.
    if ('meta' in payload) {
      return {
        items: payload.data,
        meta: payload.meta,
      } as T;
    }

    return payload.data as T;
  }
  return payload as T;
};

const isPublicEndpoint = (url?: string) => {
  if (!url) return false;

  return /^\/(categories|listings|banners)(\/|\?|$)/.test(url);
};

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get' || method === 'head') {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  const storage = (globalThis as any)?.localStorage;
  if (storage && !isPublicEndpoint(config.url)) {
    const token = storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Refresh-token mutex ──────────────────────────────────────────────────────
// Prevents the race condition where multiple concurrent 401 responses each
// trigger their own refresh, causing the second one to fail (token already rotated).
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function flushRefreshQueue(error: any, token: string | null = null) {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token!)));
  refreshQueue = [];
}

// Response interceptor — handle 401 + auto-refresh
api.interceptors.response.use(
  (response) => {
    response.data = unwrap(response.data);
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a refresh is already in flight, queue this request to retry after it completes
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        const storage = (globalThis as any)?.localStorage;
        const refreshToken = storage?.getItem('refreshToken');

        if (!refreshToken) {
          flushRefreshQueue(new Error('No refresh token'));
          isRefreshing = false;
          storage?.removeItem('accessToken');
          if ((globalThis as any)?.location) {
            (globalThis as any).location.href = '/login';
          }
          reject(error);
          return;
        }

        axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            const refreshed = unwrap<{ tokens: { accessToken: string; refreshToken: string } }>(data);
            storage?.setItem('accessToken', refreshed.tokens.accessToken);
            storage?.setItem('refreshToken', refreshed.tokens.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${refreshed.tokens.accessToken}`;
            flushRefreshQueue(null, refreshed.tokens.accessToken);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            flushRefreshQueue(refreshError);
            storage?.removeItem('accessToken');
            storage?.removeItem('refreshToken');
            if ((globalThis as any)?.location) {
              (globalThis as any).location.href = '/login';
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

export default api;
