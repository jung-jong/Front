import type { ApiError } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const TOKEN_KEY = "cta_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/auth";
    throw { status: 401, message: "인증이 만료되었습니다. 다시 로그인해주세요." } as ApiError;
  }

  if (!res.ok) {
    let message = "요청 처리 중 오류가 발생했습니다.";
    try {
      const json = await res.json();
      message = json.message ?? json.detail ?? message;
    } catch {
      // 응답 body 없는 경우
    }
    throw { status: res.status, message } as ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── File upload (multipart) ──────────────────────────────────────────────────

export async function uploadRequest<T>(
  path: string,
  formData: FormData,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
    signal: options?.signal,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/auth";
    throw { status: 401, message: "인증이 만료되었습니다." } as ApiError;
  }

  if (!res.ok) {
    let message = "파일 업로드 중 오류가 발생했습니다.";
    try {
      const json = await res.json();
      message = json.message ?? json.detail ?? message;
    } catch {
      // no-op
    }
    throw { status: res.status, message } as ApiError;
  }

  return res.json() as Promise<T>;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: { signal?: AbortSignal }) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal }) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal }) =>
    request<T>("PUT", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: { signal?: AbortSignal }) =>
    request<T>("PATCH", path, body, options),

  delete: <T>(path: string, options?: { signal?: AbortSignal }) =>
    request<T>("DELETE", path, undefined, options),
};
