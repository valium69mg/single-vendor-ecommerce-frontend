import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminCategories,
  getAdminCategory,
  createCategory,
  editCategory,
  deleteCategory,
  restoreCategory,
  API_BASE_URL,
} from "./api";
import { ApiConflictError } from "./apiFetch";
import { API_ERRORS } from "@/constants/apiErrors";

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

const CATEGORY = { categoryId: 5, name: "Gold" };
const OK = { status: 200, message: "ok" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("admin category wrappers — Bearer auth", () => {
  it("getAdminCategories sends the Bearer token and JSON content type", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }),
    );

    await getAdminCategories(0, 10, "rings", "t123");

    const { url, init, query } = lastCall();
    expect(url.startsWith(`${API_BASE_URL}/admin/products/categories?`)).toBe(true);
    expect(query.get("page")).toBe("0");
    expect(query.get("size")).toBe("10");
    expect(query.get("term")).toBe("rings");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t123",
    });
  });

  it("getAdminCategory hits the id path with the Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, CATEGORY));

    await expect(getAdminCategory(5, "t123")).resolves.toEqual(CATEGORY);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories/5`);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("createCategory POSTs the serialized name with the Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await createCategory({ data: { name: "Gold" }, token: "t123" });

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Gold" }));
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("editCategory PATCHes the serialized body to the id path", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await editCategory({ data: { name: "Gold" }, categoryId: 5, token: "t123" });

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories/5`);
    expect(init.body).toBe('{"name":"Gold"}');
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("deleteCategory DELETEs the id path and resolves undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(204));

    await expect(deleteCategory(5, "t123")).resolves.toBeUndefined();

    const { url, init } = lastCall();
    expect(init.method).toBe("DELETE");
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories/5`);
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("restoreCategory PATCHes the /restore path with no body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await restoreCategory({ categoryId: 5, token: "t123" });

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories/5/restore`);
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });
});

describe("admin category wrappers — resolved values", () => {
  it("getAdminCategories resolves the parsed PageResponse", async () => {
    const body = {
      content: [{ categoryId: 5, name: "Gold" }],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, body));

    await expect(getAdminCategories(0, 10, "", "t")).resolves.toEqual(body);
  });

  it("editCategory resolves the StandardResponse body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      editCategory({ data: { name: "x" }, categoryId: 1, token: "t" }),
    ).resolves.toEqual(OK);
  });
});

describe("admin category wrappers — transport error propagation", () => {
  it("propagates a 401 as Error(API_ERRORS.UNAUTHORIZED)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, { error: "nope" }));

    await expect(getAdminCategories(0, 10, "", "t")).rejects.toThrow(
      API_ERRORS.UNAUTHORIZED,
    );
  });

  it("propagates a 403 as Error(API_ERRORS.FORBIDDEN)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(403, { error: "nope" }));

    await expect(getAdminCategory(5, "t")).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });

  it("propagates a 409 as ApiConflictError", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "duplicate", categoryId: 5 }),
    );

    const err = await createCategory({ data: { name: "Dup" }, token: "t" }).catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).message).toBe("duplicate");
    expect((err as ApiConflictError).categoryId).toBe(5);
  });
});
