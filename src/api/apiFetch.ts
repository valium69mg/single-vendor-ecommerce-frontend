export async function apiFetch<T>(
  url: string,
  options: RequestInit,
  logout: () => void,
): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized - user logged out");
  }

  if (res.status === 204) {
    return {} as T;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || "Request failed");
  }

  return res.json();
}
