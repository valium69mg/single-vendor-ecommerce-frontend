import { API_ERRORS } from "@/constants/apiErrors";

export class ApiConflictError extends Error {
  categoryId: number;
  brandId?: number;
  materialId?: number;
  /**
   * The full parsed 409 response body. `categoryId`/`brandId`/`materialId`
   * above cover the original category/brand/material duplicate-conflict
   * shape; callers with a different 409 contract (e.g. checkout's
   * `conflicts` array) read it directly from here instead of adding more
   * named fields to this class.
   */
  body?: unknown;
  constructor(
    message: string,
    categoryId: number,
    brandId?: number,
    materialId?: number,
    body?: unknown,
  ) {
    super(message);
    this.categoryId = categoryId;
    this.brandId = brandId;
    this.materialId = materialId;
    this.body = body;
  }
}

/**
 * Thrown for any non-ok response that is not already mapped to a more specific
 * error above. Carries the HTTP status and the parsed error body so callers can
 * read structured fields (e.g. the top-level `availableStock` on cart 400s).
 */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Thrown when a by-slug endpoint answers with an HTTP 301/308 that reaches the
 * client instead of being followed transparently by `fetch`. Carries the
 * canonical slug (from the response body) so the caller can re-fetch and
 * reconcile the browser URL. See `src/api/apiFetch.spike.test.ts`.
 */
export class ApiMovedError extends Error {
  canonicalSlug: string;
  constructor(canonicalSlug: string) {
    super("Moved Permanently");
    this.name = "ApiMovedError";
    this.canonicalSlug = canonicalSlug;
  }
}

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

  if (res.status === 301 || res.status === 308) {
    const movedBody = await res.json().catch(() => null);
    throw new ApiMovedError(movedBody?.canonicalSlug ?? "");
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  if (res.status === 409) {
    const errorData = await res.json().catch(() => null);
    throw new ApiConflictError(
      errorData?.error || "Conflict",
      errorData?.categoryId,
      errorData?.brandId,
      errorData?.materialId,
      errorData,
    );
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ApiError(errorData?.error || "Request failed", res.status, errorData);
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