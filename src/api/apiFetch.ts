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

export async function apiFetchFile<T>(
  url: string,
  file: File,
  token?: string,
  fieldName: string = "file"
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

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