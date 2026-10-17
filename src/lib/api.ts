import axios, { type AxiosRequestConfig } from "axios";
import { env } from "./env";
import type { ApiEnvelope } from "./types";
import { useAuthStore } from "@/features/auth/store";

export const AUTO_LOGIN_EMAIL = "devasharjin@gmail.com";
export const AUTO_LOGIN_PASSWORD = "deva.420";

const api = axios.create({
  baseURL: env.backendUrl,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Accept": "application/json",
  },
});

// Silent non-blocking warm-up ping to wake up sleeping Render instance immediately
if (typeof window !== "undefined") {
  fetch(`${env.backendUrl}/api/auth/cooperatives`, { method: "GET", keepalive: true }).catch(() => {});
}

// In-flight GET request deduplication map to eliminate duplicate concurrent network calls
const inFlightRequests = new Map<string, Promise<any>>();

// In-memory short-lived response cache for fast instantaneous page transitions
interface CacheEntry {
  data: any;
  timestamp: number;
}
const getCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 25 * 1000; // 25 seconds

export function clearApiCache() {
  getCache.clear();
}

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared singleton promise to prevent thundering herd on token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("refresh-token") &&
      !originalRequest.url?.includes("login") &&
      !originalRequest.url?.includes("register")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        let newAccessToken: string | null = null;

        if (refreshToken) {
          try {
            const res: any = await axios.post(
              `${env.backendUrl}/api/auth/refresh-token`,
              { refreshToken },
              { withCredentials: true, timeout: 6000 }
            );

            newAccessToken =
              res.data?.data?.accessToken ||
              res.data?.accessToken ||
              res.data?.data?.tokens?.accessToken;
          } catch {
            // Refresh token call failed
          }
        }

        // Fast auto-login fallback if refresh token was invalid or missing
        if (!newAccessToken) {
          try {
            const loginRes: any = await axios.post(
              `${env.backendUrl}/api/auth/login`,
              { email: AUTO_LOGIN_EMAIL, password: AUTO_LOGIN_PASSWORD },
              { withCredentials: true, timeout: 6000 }
            );

            newAccessToken =
              loginRes.data?.data?.tokens?.accessToken ||
              loginRes.data?.data?.accessToken ||
              loginRes.data?.accessToken;

            const user = loginRes.data?.data?.user || loginRes.data?.user;
            if (user) {
              useAuthStore.getState().setUser(user);
            }
          } catch {}
        }

        if (newAccessToken) {
          try {
            localStorage.setItem("auth_token", newAccessToken);
          } catch {}
          onTokenRefreshed(newAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        // Complete failure
        onTokenRefreshed(null);
        try {
          localStorage.removeItem("fairgig_user");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
        } catch {}
        useAuthStore.getState().setUser(null);
        return Promise.reject(error);
      } catch (err) {
        onTokenRefreshed(null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

function extractErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Request failed"
  );
}

function getCacheKey(url: string, config?: AxiosRequestConfig): string {
  if (!config?.params) return url;
  try {
    return `${url}?${new URLSearchParams(config.params).toString()}`;
  } catch {
    return url;
  }
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig & { skipCache?: boolean }
): Promise<T> {
  const cacheKey = getCacheKey(url, config);
  const now = Date.now();

  // 1. Serve immediately from cache if fresh and cache not bypassed
  if (!config?.skipCache) {
    const cached = getCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Coalesce in-flight requests for identical GET operations
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await api.get<ApiEnvelope<T>>(url, config);
      if (response.data.success === false || response.data.status === "error") {
        throw new Error(response.data.message || "Request failed");
      }
      const data = response.data.data;
      getCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  clearApiCache();
  try {
    const response = await api.post<ApiEnvelope<TResponse>>(url, body, config);
    if (response.data.success === false || response.data.status === "error") {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function apiPut<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  clearApiCache();
  try {
    const response = await api.put<ApiEnvelope<TResponse>>(url, body, config);
    if (response.data.success === false || response.data.status === "error") {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  clearApiCache();
  try {
    const response = await api.patch<ApiEnvelope<TResponse>>(url, body, config);
    if (response.data.success === false || response.data.status === "error") {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  clearApiCache();
  try {
    const response = await api.delete<ApiEnvelope<TResponse>>(url, config);
    if (response.data.success === false || response.data.status === "error") {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}