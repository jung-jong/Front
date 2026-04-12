import { api, setToken, clearToken } from "@/lib/api";
import type { AuthResponse, LoginRequest, SignupRequest } from "@/types";

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", req);
  setToken(res.token);
  return res;
}

export async function signup(req: SignupRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/signup", req);
  setToken(res.token);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/auth/logout");
  } finally {
    clearToken();
  }
}

export async function getMe(): Promise<AuthResponse["user"]> {
  return api.get<AuthResponse["user"]>("/auth/me");
}
