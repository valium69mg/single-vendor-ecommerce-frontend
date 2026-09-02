import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicProduct, getPublicProductBySlug, API_BASE_URL } from "./api";

function mockResponse(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

const PRODUCT = {
  productId: "abc-123",
  slug: "anillo-de-plata",
  name: "Anillo de plata",
  shortDescription: null,
  longDescription: null,
  featured: false,
  category: null,
  brand: null,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
  minPrice: 250,
  minDiscountPrice: null,
  createdAt: "2026-01-01T00:00:00",
  materials: [],
  variants: [
    {
      productVariantId: 1,
      price: 250,
      discountPrice: null,
      stock: 5,
      attributeValues: [{ attributeValueId: 9, value: "M" }],
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getPublicProduct", () => {
  it("GETs /products/:id and returns the product with variants", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PRODUCT));

    const res = await getPublicProduct("abc-123");

    expect(res).toEqual(PRODUCT);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/products/abc-123`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propagates a 404 as an error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, { status: 404, error: "product_not_found" }),
    );

    await expect(getPublicProduct("missing")).rejects.toThrow();
  });
});

describe("getPublicProductBySlug", () => {
  it("GETs /products/by-slug/:slug and returns the product", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PRODUCT));

    const res = await getPublicProductBySlug("anillo-de-plata");

    expect(res).toEqual(PRODUCT);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/products/by-slug/anillo-de-plata`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("re-fetches the canonical by-slug URL when the backend answers 301", async () => {
    const canonical = { ...PRODUCT, slug: "gold-rings" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockResponse(301, { status: 301, canonicalSlug: "gold-rings" }),
      )
      .mockResolvedValueOnce(mockResponse(200, canonical));

    const res = await getPublicProductBySlug("old-ring");

    expect(res).toEqual(canonical);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/products/by-slug/old-ring`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/products/by-slug/gold-rings`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propagates a 404 as an error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, { status: 404, error: "product_not_found" }),
    );

    await expect(getPublicProductBySlug("missing")).rejects.toThrow();
  });
});
