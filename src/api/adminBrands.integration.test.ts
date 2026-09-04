import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import {
  getAdminBrands,
  getAdminBrand,
  createBrand,
  editBrand,
  restoreBrand,
  deleteBrand,
  type AdminBrandById,
} from "@/api/api";
import { ApiConflictError, ApiError } from "@/api/apiFetch";
import { API_ERRORS } from "@/constants/apiErrors";
import { server } from "@/mocks/server";

/**
 * Integration coverage: the real admin brands wrappers -> real `apiFetch` ->
 * real `fetch`, served entirely by MSW handlers registered per test.
 * Symmetric to `adminCategories.integration.test.ts`.
 */

function fakeBrand(overrides: Partial<AdminBrandById> = {}): AdminBrandById {
  return {
    brandId: 1,
    name: "Cartier",
    slug: "cartier",
    ...overrides,
  };
}

describe("admin brands wrappers (MSW integration) — success paths", () => {
  it("getAdminBrands resolves the MSW-served page and sends the Bearer token", async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get("*/api/v1/admin/products/brands", ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json({
          content: [fakeBrand({ name: "Tiffany" })],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          last: true,
        });
      }),
    );

    const result = await getAdminBrands(0, 10, "", "tok-1");

    expect(result.content[0].name).toBe("Tiffany");
    expect(receivedAuth).toBe("Bearer tok-1");
  });

  it("getAdminBrand GETs the id path and resolves the brand", async () => {
    server.use(
      http.get("*/api/v1/admin/products/brands/9", () =>
        HttpResponse.json(fakeBrand({ brandId: 9, name: "Bulgari" })),
      ),
    );

    await expect(getAdminBrand(9, "tok")).resolves.toMatchObject({
      brandId: 9,
      name: "Bulgari",
    });
  });

  it("createBrand POSTs the serialized name and resolves the StandardResponse", async () => {
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/admin/products/brands", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ status: 200, message: "created" });
      }),
    );

    const result = await createBrand({ data: { name: "Chopard" }, token: "tok" });

    expect(result).toEqual({ status: 200, message: "created" });
    expect(receivedBody).toEqual({ name: "Chopard" });
  });

  it("editBrand PATCHes the id path and resolves the updated brand payload", async () => {
    server.use(
      http.patch("*/api/v1/admin/products/brands/9", () =>
        HttpResponse.json({ status: 200, message: "updated" }),
      ),
    );

    await expect(
      editBrand({ data: { name: "Bulgari Nuovo" }, brandId: 9, token: "tok" }),
    ).resolves.toEqual({ status: 200, message: "updated" });
  });

  it("restoreBrand PATCHes the /restore path and resolves the StandardResponse", async () => {
    server.use(
      http.patch("*/api/v1/admin/products/brands/9/restore", () =>
        HttpResponse.json({ status: 200, message: "restored" }),
      ),
    );

    await expect(restoreBrand({ brandId: 9, token: "tok" })).resolves.toEqual({
      status: 200,
      message: "restored",
    });
  });

  it("deleteBrand DELETEs the id path and resolves undefined on 204", async () => {
    server.use(
      http.delete("*/api/v1/admin/products/brands/9", () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(deleteBrand(9, "tok")).resolves.toBeUndefined();
  });
});

describe("admin brands wrappers (MSW integration) — error mapping", () => {
  it("createBrand: a 409 service-layer conflict `{error}` body maps to ApiConflictError", async () => {
    server.use(
      http.post("*/api/v1/admin/products/brands", () =>
        HttpResponse.json(
          { error: "brand_exists_deleted", brandId: 42 },
          { status: 409 },
        ),
      ),
    );

    const err = await createBrand({
      data: { name: "Dup" },
      token: "tok",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiConflictError);
    expect((err as ApiConflictError).message).toBe("brand_exists_deleted");
    expect((err as ApiConflictError).brandId).toBe(42);
  });

  it("createBrand: a Bean Validation 400 body falls through to the generic fallback message", async () => {
    // `{status, errors: {field}}` has no top-level `.error` key, so
    // `apiFetch`'s generic branch reads `errorData?.error` as undefined and
    // falls back to "Request failed" — the intended branch for this shape.
    server.use(
      http.post("*/api/v1/admin/products/brands", () =>
        HttpResponse.json(
          { status: 400, errors: { name: "El nombre es requerido" } },
          { status: 400 },
        ),
      ),
    );

    const err = await createBrand({
      data: { name: "" },
      token: "tok",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Request failed");
    expect((err as ApiError).status).toBe(400);
  });

  it("getAdminBrand: a service-layer 404 `{error}` body surfaces the specific message", async () => {
    server.use(
      http.get("*/api/v1/admin/products/brands/404", () =>
        HttpResponse.json({ error: "Brand not found" }, { status: 404 }),
      ),
    );

    const err = await getAdminBrand(404, "tok").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Brand not found");
    expect((err as ApiError).status).toBe(404);
  });

  it("deleteBrand: a 403 maps to Error(API_ERRORS.FORBIDDEN)", async () => {
    server.use(
      http.delete("*/api/v1/admin/products/brands/9", () =>
        HttpResponse.json({ error: "no permission" }, { status: 403 }),
      ),
    );

    await expect(deleteBrand(9, "tok")).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });
});
