import { http } from "./http";

interface AuthPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  register: (payload: AuthPayload) =>
    http.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  login: (payload: AuthPayload) =>
    http.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  refresh: () =>
    http.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  logout: () =>
    http.post<{ success: boolean }>("/auth/logout").then((r) => r.data),
};
