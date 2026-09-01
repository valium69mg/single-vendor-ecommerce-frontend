import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts, getCategories, API_BASE_URL } from "./api";

function mockResponse(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json:
      body !== undefined
        ? () => Promise.resolve(body)
        : () => Promise.reject(new Error("no body")),
  } as Response;
}

function lastCall() {
  const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
  return { url, init, query: new URL(url).searchParams };
}

const PAGE = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getProducts", () => {
  it("sends page and size, and sends featured=false when featured is false", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PAGE));

    await getProducts(0, 12, false);

    const { url, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/products?`)).toBe(true);
    expect(query.get("page")).toBe("0");
    expect(query.get("size")).toBe("12");
    expect(query.get("featured")).toBe("false");
    expect(query.has("createdAtStart")).toBe(false);
  });

  it("omits featured when undefined and includes createdAtStart only when truthy", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PAGE));

    await getProducts(1, 8, undefined, "2026-01-01");

    const { query } = lastCall();
    expect(query.get("page")).toBe("1");
    expect(query.get("size")).toBe("8");
    expect(query.has("featured")).toBe(false);
    expect(query.get("createdAtStart")).toBe("2026-01-01");
  });

  it("omits createdAtStart when it is an empty string", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PAGE));

    await getProducts(0, 12, true, "");

    const { query } = lastCall();
    expect(query.get("featured")).toBe("true");
    expect(query.has("createdAtStart")).toBe(false);
  });

  it("issues an unauthenticated GET with a JSON content type", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PAGE));

    await getProducts(0, 12);

    const { init } = lastCall();
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("resolves the parsed PageResponse body", async () => {
    const body = { ...PAGE, content: [{ productId: "p1" }], totalElements: 1 };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getProducts(0, 12)).resolves.toEqual(body);
  });
});

describe("getCategories", () => {
  it("GETs the public categories page with page, size and term always present", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, PAGE));

    await getCategories(0, 10, "rings");

    const { url, init, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/products/categories?`)).toBe(true);
    expect(query.get("page")).toBe("0");
    expect(query.get("size")).toBe("10");
    expect(query.get("term")).toBe("rings");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("resolves the parsed PageResponse body", async () => {
    const body = {
      ...PAGE,
      content: [{ categoryId: 1, name: "Rings" }],
      totalElements: 1,
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getCategories(0, 10, "rings")).resolves.toEqual(body);
  });
});
