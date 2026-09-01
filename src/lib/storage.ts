/**
 * Safe `localStorage` JSON reader. Returns `null` for a missing key or any
 * value that is not valid JSON, so callers never throw during render.
 * Mirrors the defensive parse in `CartProvider.readGuestCart`.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
