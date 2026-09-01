import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminProducts, createProduct, API_BASE_URL } from "./api";
import { ApiError } from "./apiFetch";
import type { CreateProductInput } from "./api";

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

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  last: true,
};
const OK = { status: 201, message: "created" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getAdminProducts query builder", () => {
  it("sends exactly page and size for a minimal params object", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts({ page: 0, size: 20 }, "t");

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products?page=0&size=20`);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t",
    });
  });

  it("defaults sortDirection to ASC whenever sortBy is present", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts({ page: 0, size: 20, sortBy: "name" }, "t");

    const { query } = lastCall();
    expect(query.get("sortBy")).toBe("name");
    expect(query.get("sortDirection")).toBe("ASC");
  });

  it("keeps an explicit sortDirection when provided", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts(
      { page: 0, size: 20, sortBy: "name", sortDirection: "DESC" },
      "t",
    );

    const { query } = lastCall();
    expect(query.get("sortDirection")).toBe("DESC");
  });

  it("gates falsy strings out but keeps falsy-but-defined values", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts(
      {
        page: 0,
        size: 20,
        term: "",
        status: "ACTIVE",
        featured: false,
        categoryId: 3,
      },
      "t",
    );

    const { query } = lastCall();
    expect(query.has("term")).toBe(false);
    expect(query.get("status")).toBe("ACTIVE");
    expect(query.get("featured")).toBe("false");
    expect(query.get("categoryId")).toBe("3");
  });

  it("omits sortDirection when sortBy is absent", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts({ page: 0, size: 20, sortDirection: "DESC" }, "t");

    const { query } = lastCall();
    expect(query.has("sortDirection")).toBe(false);
  });

  it("stringifies numeric brandId and categoryId when defined", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, EMPTY_PAGE));

    await getAdminProducts(
      { page: 1, size: 5, brandId: 9, categoryId: 0 },
      "t",
    );

    const { query } = lastCall();
    expect(query.get("brandId")).toBe("9");
    expect(query.get("categoryId")).toBe("0");
  });

  it("resolves the parsed PageResponse body", async () => {
    const body = { ...EMPTY_PAGE, content: [{ productId: "p1" }], totalElements: 1 };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getAdminProducts({ page: 0, size: 20 }, "t")).resolves.toEqual(
      body,
    );
  });
});

describe("createProduct", () => {
  const input: CreateProductInput = {
    name: "Ring",
    status: "ACTIVE",
    featured: false,
    materialIds: [1],
    variants: [
      { sku: "R-1", price: 10, stock: 3, attributeValueIds: [7] },
    ],
  };

  it("POSTs the serialized product to /admin/products with the Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(201, OK));

    await expect(createProduct(input, "t")).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(input));
    expect(init.headers).toMatchObject({ Authorization: "Bearer t" });
  });
});

describe("transport error propagation", () => {
  it("surfaces a generic non-ok as ApiError carrying status and parsed body", async () => {
    const body = { message: "boom" };
    vi.mocked(fetch).mockResolvedValue(mockResponse(500, body));

    const err = await getAdminProducts({ page: 0, size: 20 }, "t").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).body).toEqual(body);
  });
});
