import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminBrand,
  createBrand,
  editBrand,
  deleteBrand,
  restoreBrand,
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
  return { url, init };
}

const BRAND = { brandId: 9, name: "Cartier", slug: "cartier" };
const OK = { status: 200, message: "ok" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("admin brand wrappers — Bearer auth, verb, path, body", () => {
  it("getAdminBrand GETs the id path with the Bearer token and resolves the brand", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, BRAND));

    await expect(getAdminBrand(9, "t123")).resolves.toEqual(BRAND);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/brands/9`);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t123",
    });
  });

  it("createBrand POSTs the serialized name with the Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      createBrand({ data: { name: "Cartier" }, token: "t123" }),
    ).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/brands`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Cartier" }));
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("editBrand PATCHes the serialized body to the id path", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      editBrand({ data: { name: "Cartier" }, brandId: 9, token: "t123" }),
    ).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/brands/9`);
    expect(init.body).toBe('{"name":"Cartier"}');
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("restoreBrand PATCHes the /restore path with no body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await restoreBrand({ brandId: 9, token: "t123" });

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/brands/9/restore`);
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("deleteBrand DELETEs the id path and resolves undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(204));

    await expect(deleteBrand(9, "t123")).resolves.toBeUndefined();

    const { url, init } = lastCall();
    expect(init.method).toBe("DELETE");
    expect(url).toBe(`${API_BASE_URL}/admin/products/brands/9`);
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });
});

describe("admin brand wrappers — transport error propagation", () => {
  it("propagates a 401 as Error(API_ERRORS.UNAUTHORIZED)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, { error: "nope" }));

    await expect(getAdminBrand(9, "t")).rejects.toThrow(
      API_ERRORS.UNAUTHORIZED,
    );
  });

  it("propagates a 403 as Error(API_ERRORS.FORBIDDEN)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(403, { error: "nope" }));

    await expect(
      createBrand({ data: { name: "x" }, token: "t" }),
    ).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });

  it("propagates a 409 from createBrand as ApiConflictError carrying brandId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "brand_exists_deleted", brandId: 42 }),
    );

    const err = await createBrand({ data: { name: "Dup" }, token: "t" }).catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).message).toBe("brand_exists_deleted");
    expect((err as ApiConflictError).brandId).toBe(42);
  });

  it("propagates a 409 from editBrand as ApiConflictError carrying brandId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "brand_exists_deleted", brandId: 7 }),
    );

    const err = await editBrand({
      data: { name: "Dup" },
      brandId: 9,
      token: "t",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).brandId).toBe(7);
  });
});
