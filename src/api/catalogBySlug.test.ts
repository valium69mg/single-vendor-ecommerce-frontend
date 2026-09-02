import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategoryBySlug, getBrandBySlug, API_BASE_URL } from "./api";

function mockResponse(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

const CATEGORY = {
  categoryId: 5,
  name: "Anillos",
  slug: "anillos",
  products: 12,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
};

const BRAND = { brandId: 8, name: "Cartier", slug: "cartier" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getCategoryBySlug", () => {
  it("GETs /products/categories/by-slug/:slug and returns the category", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, CATEGORY));

    const res = await getCategoryBySlug("anillos");

    expect(res).toEqual(CATEGORY);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/products/categories/by-slug/anillos`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("re-fetches the canonical by-slug URL when the backend answers 301", async () => {
    const canonical = { ...CATEGORY, slug: "anillos-de-oro" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(301, { status: 301, canonicalSlug: "anillos-de-oro" }),
      )
      .mockResolvedValueOnce(mockResponse(200, canonical));

    const res = await getCategoryBySlug("anillos-viejos");

    expect(res).toEqual(canonical);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/products/categories/by-slug/anillos-viejos`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/products/categories/by-slug/anillos-de-oro`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propagates a 404 as an error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, { status: 404, error: "category_not_found" }),
    );

    await expect(getCategoryBySlug("missing")).rejects.toThrow();
  });
});

describe("getBrandBySlug", () => {
  it("GETs /products/brands/by-slug/:slug and returns the brand", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, BRAND));

    const res = await getBrandBySlug("cartier");

    expect(res).toEqual(BRAND);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/products/brands/by-slug/cartier`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("re-fetches the canonical by-slug URL when the backend answers 301", async () => {
    const canonical = { ...BRAND, slug: "cartier-paris" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(301, { status: 301, canonicalSlug: "cartier-paris" }),
      )
      .mockResolvedValueOnce(mockResponse(200, canonical));

    const res = await getBrandBySlug("cartier-old");

    expect(res).toEqual(canonical);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/products/brands/by-slug/cartier-paris`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propagates a 404 as an error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, { status: 404, error: "brand_does_not_exists" }),
    );

    await expect(getBrandBySlug("missing")).rejects.toThrow();
  });
});
