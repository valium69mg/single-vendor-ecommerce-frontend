import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminMaterial,
  createMaterial,
  editMaterial,
  deleteMaterial,
  restoreMaterial,
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

const MATERIAL = { materialId: 9, name: "Oro 18k" };
const OK = { status: 200, message: "ok" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("admin material wrappers — Bearer auth, verb, path, body", () => {
  it("getAdminMaterial GETs the id path with the Bearer token and resolves the material", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, MATERIAL));

    await expect(getAdminMaterial(9, "t123")).resolves.toEqual(MATERIAL);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/materials/9`);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t123",
    });
  });

  it("createMaterial POSTs the serialized name with the Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      createMaterial({ data: { name: "Oro 18k" }, token: "t123" }),
    ).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/materials`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Oro 18k" }));
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("editMaterial PATCHes the serialized body to the id path", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      editMaterial({ data: { name: "Oro 18k" }, materialId: 9, token: "t123" }),
    ).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/materials/9`);
    expect(init.body).toBe('{"name":"Oro 18k"}');
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("restoreMaterial PATCHes the /restore path with no body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await restoreMaterial({ materialId: 9, token: "t123" });

    const { url, init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toBe(`${API_BASE_URL}/admin/products/materials/9/restore`);
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });

  it("deleteMaterial DELETEs the id path and resolves undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(204));

    await expect(deleteMaterial(9, "t123")).resolves.toBeUndefined();

    const { url, init } = lastCall();
    expect(init.method).toBe("DELETE");
    expect(url).toBe(`${API_BASE_URL}/admin/products/materials/9`);
    expect(init.headers).toMatchObject({ Authorization: "Bearer t123" });
  });
});

describe("admin material wrappers — transport error propagation", () => {
  it("propagates a 401 as Error(API_ERRORS.UNAUTHORIZED)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, { error: "nope" }));

    await expect(getAdminMaterial(9, "t")).rejects.toThrow(
      API_ERRORS.UNAUTHORIZED,
    );
  });

  it("propagates a 403 as Error(API_ERRORS.FORBIDDEN)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(403, { error: "nope" }));

    await expect(
      createMaterial({ data: { name: "x" }, token: "t" }),
    ).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });

  it("propagates a 409 from createMaterial as ApiConflictError carrying materialId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "material_exists_deleted", materialId: 42 }),
    );

    const err = await createMaterial({ data: { name: "Dup" }, token: "t" }).catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).message).toBe("material_exists_deleted");
    expect((err as ApiConflictError).materialId).toBe(42);
  });

  it("propagates a 409 from editMaterial as ApiConflictError carrying materialId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "material_exists_deleted", materialId: 7 }),
    );

    const err = await editMaterial({
      data: { name: "Dup" },
      materialId: 9,
      token: "t",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).materialId).toBe(7);
  });
});
