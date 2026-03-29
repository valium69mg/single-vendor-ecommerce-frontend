import { API_ERRORS } from "@/constants/apiErrors";

export async function apiFetch<T>(
  url: string,
  options: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    throw new Error(API_ERRORS.UNAUTHORIZED);
  }

  if (res.status === 403) {
    throw new Error(API_ERRORS.FORBIDDEN);
  }


  if (res.status === 204) {
    return undefined as unknown as T;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || "Request failed");
  }

  return res.json();
}