export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export interface LoginResponse {
  userId: string;
  email: string;
  token: string;
  role: string;
}

export async function loginRequest(data: { email: string; password: string }): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error);
  }

  return res.json();
}
