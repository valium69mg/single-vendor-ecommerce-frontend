import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  apiFetch,
  apiFetchFile,
  ApiConflictError,
  ApiError,
  ApiMovedError,
} from "./apiFetch";
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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

// ---------------------------------------------------------------------------
// apiFetch
// ---------------------------------------------------------------------------

describe("apiFetch", () => {
  it("returns parsed JSON on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, { id: 1 }));
    const result = await apiFetch<{ id: number }>("/url", {});
    expect(result).toEqual({ id: 1 });
  });

  it("throws UNAUTHORIZED on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401));
    await expect(apiFetch("/url", {})).rejects.toThrow(API_ERRORS.UNAUTHORIZED);
  });

  it("throws FORBIDDEN on 403", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(403));
    await expect(apiFetch("/url", {})).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });

  it("returns undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(204));
    const result = await apiFetch("/url", {});
    expect(result).toBeUndefined();
  });

  it("throws ApiConflictError with categoryId on 409", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "Nombre duplicado", categoryId: 7 }),
    );
    const err = await apiFetch("/url", {}).catch((e) => e) as ApiConflictError;
    expect(err).toBeInstanceOf(ApiConflictError);
    expect(err.message).toBe("Nombre duplicado");
    expect(err.categoryId).toBe(7);
  });

  it("throws ApiConflictError with brandId on 409 when the body carries brandId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { status: 409, error: "brand_exists_deleted", brandId: 3 }),
    );
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiConflictError;
    expect(err).toBeInstanceOf(ApiConflictError);
    expect(err.message).toBe("brand_exists_deleted");
    expect(err.brandId).toBe(3);
  });

  it("throws ApiConflictError with materialId on 409 when the body carries materialId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { status: 409, error: "material_exists_deleted", materialId: 5 }),
    );
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiConflictError;
    expect(err).toBeInstanceOf(ApiConflictError);
    expect(err.message).toBe("material_exists_deleted");
    expect(err.materialId).toBe(5);
  });

  it("throws ApiConflictError with 'Conflict' when 409 body is unparseable", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(409));
    const err = await apiFetch("/url", {}).catch((e) => e) as ApiConflictError;
    expect(err).toBeInstanceOf(ApiConflictError);
    expect(err.message).toBe("Conflict");
  });

  it("throws error message from body on non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(500, { error: "Internal server error" }),
    );
    await expect(apiFetch("/url", {})).rejects.toThrow("Internal server error");
  });

  it("throws 'Request failed' when non-ok body is unparseable", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500));
    await expect(apiFetch("/url", {})).rejects.toThrow("Request failed");
  });

  it("throws ApiError carrying the status and parsed body on a non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, {
        status: 400,
        error: "cart_stock_exceeded",
        availableStock: 4,
      }),
    );
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("cart_stock_exceeded");
    expect(err.status).toBe(400);
    expect((err.body as { availableStock: number }).availableStock).toBe(4);
  });

  it("throws ApiMovedError carrying the canonical slug from the body on 301", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(301, { status: 301, canonicalSlug: "gold-rings" }),
    );
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiMovedError;
    expect(err).toBeInstanceOf(ApiMovedError);
    expect(err.canonicalSlug).toBe("gold-rings");
  });

  it("throws ApiMovedError on a 308 permanent redirect", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(308, { status: 308, canonicalSlug: "cartier" }),
    );
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiMovedError;
    expect(err).toBeInstanceOf(ApiMovedError);
    expect(err.canonicalSlug).toBe("cartier");
  });

  it("throws ApiMovedError with an empty slug when the 301 body is unparseable", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(301));
    const err = (await apiFetch("/url", {}).catch((e) => e)) as ApiMovedError;
    expect(err).toBeInstanceOf(ApiMovedError);
    expect(err.canonicalSlug).toBe("");
  });

  it("forwards the options to fetch", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));
    const options: RequestInit = {
      method: "POST",
      headers: { Authorization: "Bearer token" },
    };
    await apiFetch("/url", options);
    expect(fetch).toHaveBeenCalledWith("/url", options);
  });
});

// ---------------------------------------------------------------------------
// apiFetchFile
// ---------------------------------------------------------------------------

describe("apiFetchFile", () => {
  it("returns parsed JSON on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, { url: "file.jpg" }));
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const result = await apiFetchFile<{ url: string }>("/upload", file);
    expect(result).toEqual({ url: "file.jpg" });
  });

  it("throws UNAUTHORIZED on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401));
    const file = new File([], "f.jpg");
    await expect(apiFetchFile("/upload", file)).rejects.toThrow(
      API_ERRORS.UNAUTHORIZED,
    );
  });

  it("throws FORBIDDEN on 403", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(403));
    const file = new File([], "f.jpg");
    await expect(apiFetchFile("/upload", file)).rejects.toThrow(
      API_ERRORS.FORBIDDEN,
    );
  });

  it("returns undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(204));
    const file = new File([], "f.jpg");
    const result = await apiFetchFile("/upload", file);
    expect(result).toBeUndefined();
  });

  it("throws error message from body on non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(422, { error: "Unsupported type" }),
    );
    const file = new File([], "f.jpg");
    await expect(apiFetchFile("/upload", file)).rejects.toThrow(
      "Unsupported type",
    );
  });

  it("includes Authorization header when token provided", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));
    const file = new File([], "f.jpg");
    await apiFetchFile("/upload", file, "my-token");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toEqual({
      Authorization: "Bearer my-token",
    });
  });

  it("omits Authorization header when token not provided", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));
    const file = new File([], "f.jpg");
    await apiFetchFile("/upload", file);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toEqual({});
  });

  it("appends file under custom fieldName when provided", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));
    const file = new File(["x"], "img.jpg");
    await apiFetchFile("/upload", file, undefined, "image");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const fd = (init as RequestInit).body as FormData;
    expect(fd.get("image")).toBe(file);
  });

  it("appends file under 'file' fieldName by default", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));
    const file = new File(["x"], "img.jpg");
    await apiFetchFile("/upload", file);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const fd = (init as RequestInit).body as FormData;
    expect(fd.get("file")).toBe(file);
  });
});
