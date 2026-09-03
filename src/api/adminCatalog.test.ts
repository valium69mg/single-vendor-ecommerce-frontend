import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminBrands,
  getAdminMaterials,
  getAdminAttributesPage,
  API_BASE_URL,
} from "./api";

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

function page<T>(content: T[], over: Partial<Record<string, unknown>> = {}) {
  return {
    content,
    page: 0,
    size: 15,
    totalElements: content.length,
    totalPages: 1,
    last: true,
    ...over,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getAdminBrands", () => {
  it("GETs the brands page with page, size, term and the Bearer token", async () => {
    const body = page([{ brandId: 1, name: "Cartier" }], { page: 2, size: 15 });
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getAdminBrands(2, 15, "silver", "t")).resolves.toEqual(body);

    const { url, init, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/admin/products/brands?`)).toBe(true);
    expect(query.get("page")).toBe("2");
    expect(query.get("size")).toBe("15");
    expect(query.get("term")).toBe("silver");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t",
    });
  });

  it("transmits a term with reserved characters as exactly one term param (F1)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, page([])));

    await getAdminBrands(0, 10, "oro & plata #x=1", "t");

    const { url, query } = lastCall();
    expect(query.get("term")).toBe("oro & plata #x=1");
    expect([...query.keys()].sort()).toEqual(["page", "size", "term"]);
    expect(new URL(url).hash).toBe("");
  });
});

describe("getAdminMaterials", () => {
  it("GETs the materials page with the same shape as brands", async () => {
    const body = page([{ materialId: 3, name: "18k Gold" }]);
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getAdminMaterials(0, 10, "gold", "t")).resolves.toEqual(body);

    const { url, init, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/admin/products/materials?`)).toBe(true);
    expect(query.get("page")).toBe("0");
    expect(query.get("size")).toBe("10");
    expect(query.get("term")).toBe("gold");
    expect(init.headers).toMatchObject({ Authorization: "Bearer t" });
  });

  it("transmits a term with reserved characters as exactly one term param (F1)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, page([])));

    await getAdminMaterials(0, 10, "oro & plata #x=1", "t");

    const { url, query } = lastCall();
    expect(query.get("term")).toBe("oro & plata #x=1");
    expect([...query.keys()].sort()).toEqual(["page", "size", "term"]);
    expect(new URL(url).hash).toBe("");
  });
});

describe("getAdminAttributesPage — array to PageResponse adaptation", () => {
  const attr = (id: number) => ({
    attributeId: id,
    name: `A${id}`,
    attributeValues: [],
  });

  it("issues exactly one GET to /admin/products/attributes with page and size", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, [attr(1)]));

    await getAdminAttributesPage(0, 20, "t");

    expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
    const { url, init, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/admin/products/attributes?`)).toBe(true);
    expect(query.get("page")).toBe("0");
    expect(query.get("size")).toBe("20");
    expect(init.headers).toMatchObject({ Authorization: "Bearer t" });
  });

  it("marks a short page as last and echoes the requested page and size", async () => {
    const list = Array.from({ length: 7 }, (_, i) => attr(i + 1));
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, list));

    const res = await getAdminAttributesPage(0, 20, "t");

    expect(res.content).toHaveLength(7);
    expect(res.page).toBe(0);
    expect(res.size).toBe(20);
    expect(res.last).toBe(true);
  });

  it("marks an exactly-full page as not last (documents the residual)", async () => {
    const list = Array.from({ length: 20 }, (_, i) => attr(i + 1));
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, list));

    const res = await getAdminAttributesPage(3, 20, "t");

    expect(res.content).toHaveLength(20);
    expect(res.page).toBe(3);
    expect(res.last).toBe(false);
  });

  it("tolerates a null body without a TypeError and resolves an empty terminal page (F4)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, null));

    const res = await getAdminAttributesPage(0, 20, "t");

    expect(res.content).toEqual([]);
    expect(res.last).toBe(true);
    expect(res.page).toBe(0);
  });

  it("derives the list from a wrapped { content: [...] } body without infinite paging (F4)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, { content: [attr(1)] }));

    const res = await getAdminAttributesPage(0, 20, "t");

    expect(res.content).toHaveLength(1);
    expect(res.content[0].attributeId).toBe(1);
    expect(res.last).toBe(true);
  });

  it("reports honest pagination bounds instead of type-lie sentinels (F3)", async () => {
    const list = Array.from({ length: 20 }, (_, i) => attr(i + 1));
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, list));

    const res = await getAdminAttributesPage(1, 20, "t");

    expect(res.totalElements).toBe(40);
    expect(res.totalPages).not.toBe(-1);
    expect(res.totalPages).toBeGreaterThan(0);
  });

  it("bounds totals from the cumulative count on a partial final page (F3)", async () => {
    const list = Array.from({ length: 7 }, (_, i) => attr(i + 1));
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, list));

    const res = await getAdminAttributesPage(0, 20, "t");

    expect(res.totalElements).toBe(7);
    expect(res.totalPages).toBe(1);
  });
});
