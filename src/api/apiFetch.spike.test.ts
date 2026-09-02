import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./apiFetch";

/**
 * SPIKE (SDD entity-slugs, PR3 task 3.1) — how does a backend HTTP 301 behave
 * through `apiFetch`?
 *
 * Code inspection: `apiFetch` calls `fetch(url, options)` and never sets a
 * `redirect` option, so `fetch` uses its default `redirect: "follow"`. In a
 * real browser (and under undici / jsdom) a GET 301 is therefore followed
 * transparently to the canonical `by-slug` URL and `apiFetch` only ever sees
 * the final 200 + DTO. `fetch` following a redirect does NOT change the browser
 * address bar (it is a data request, not a navigation), so a stale
 * `/product/:slug` in the URL must still be reconciled from the response DTO's
 * canonical `slug`.
 *
 * This test documents the OTHER outcome: when a 301 response does reach
 * `apiFetch` (a non-following environment, an explicit `redirect: "manual"`, or
 * a stubbed response as below), the status is surfaced to `apiFetch` and never
 * silently unwrapped as a success body. That is why the defensive
 * `ApiMovedError` branch (task 3.3) ships regardless of the follow behavior.
 */
describe("apiFetch — 301 redirect spike", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("surfaces a 301 to apiFetch instead of resolving the redirect body as success", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 301,
      ok: false,
      json: () => Promise.resolve({ status: 301, canonicalSlug: "gold-rings" }),
    } as Response);

    await expect(apiFetch("/url", {})).rejects.toBeInstanceOf(Error);
  });
});
