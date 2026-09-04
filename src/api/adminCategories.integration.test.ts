import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import {
  getAdminCategories,
  getAdminCategory,
  createCategory,
  editCategory,
  deleteCategory,
  restoreCategory,
  uploadCategoryImage,
  type Category,
} from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import { API_ERRORS } from "@/constants/apiErrors";
import { server } from "@/mocks/server";

/**
 * Integration coverage: the real admin categories wrappers -> real `apiFetch`
 * -> real `fetch`, served entirely by MSW handlers registered per test. No
 * fetch stub, no `@/api/api` module mock. Mirrors the pattern established in
 * `src/test/publicProduct.integration.test.tsx`.
 */

function fakeCategory(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: 1,
    name: "Anillos",
    products: 5,
    unitsSold: 10,
    revenue: 500,
    averagePrice: 50,
    stock: 20,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function imageFile() {
  return new File(["binary"], "photo.png", { type: "image/png" });
}

describe("admin categories wrappers (MSW integration) — success paths", () => {
  it("getAdminCategories resolves the MSW-served page and sends the Bearer token", async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get("*/api/v1/admin/products/categories", ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json({
          content: [fakeCategory({ name: "Collares" })],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          last: true,
        });
      }),
    );

    const result = await getAdminCategories(0, 10, "", "tok-1");

    expect(result.content[0].name).toBe("Collares");
    expect(receivedAuth).toBe("Bearer tok-1");
  });

  it("getAdminCategory GETs the id path and resolves the category", async () => {
    server.use(
      http.get("*/api/v1/admin/products/categories/7", () =>
        HttpResponse.json(fakeCategory({ categoryId: 7, name: "Pulseras" })),
      ),
    );

    await expect(getAdminCategory(7, "tok")).resolves.toMatchObject({
      categoryId: 7,
      name: "Pulseras",
    });
  });

  it("createCategory POSTs the serialized name and resolves the StandardResponse", async () => {
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/admin/products/categories", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ status: 200, message: "created" });
      }),
    );

    const result = await createCategory({
      data: { name: "Diamantes" },
      token: "tok",
    });

    expect(result).toEqual({ status: 200, message: "created" });
    expect(receivedBody).toEqual({ name: "Diamantes" });
  });

  it("editCategory PATCHes the id path and resolves the StandardResponse", async () => {
    server.use(
      http.patch("*/api/v1/admin/products/categories/7", () =>
        HttpResponse.json({ status: 200, message: "updated" }),
      ),
    );

    await expect(
      editCategory({ data: { name: "Rubies" }, categoryId: 7, token: "tok" }),
    ).resolves.toEqual({ status: 200, message: "updated" });
  });

  it("deleteCategory DELETEs the id path and resolves undefined on 204", async () => {
    server.use(
      http.delete("*/api/v1/admin/products/categories/7", () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(deleteCategory(7, "tok")).resolves.toBeUndefined();
  });

  it("restoreCategory PATCHes the /restore path and resolves the StandardResponse", async () => {
    server.use(
      http.patch("*/api/v1/admin/products/categories/7/restore", () =>
        HttpResponse.json({ status: 200, message: "restored" }),
      ),
    );

    await expect(
      restoreCategory({ categoryId: 7, token: "tok" }),
    ).resolves.toEqual({ status: 200, message: "restored" });
  });

  it("uploadCategoryImage POSTs a FormData body carrying the file under the 'file' field", async () => {
    // MSW's Node-side FormData reconstruction does not preserve exact
    // byte-for-byte fidelity or the original filename across the jsdom ->
    // undici boundary (a known environment limitation — see
    // `imageUpload.test.ts`, which mocks `fetch` directly for byte-exact
    // assertions). This test instead proves the real pipeline-relevant facts:
    // the request reaches the server as multipart with a `file` part of the
    // right content-type, and the auth header is attached.
    let receivedFieldType: string | undefined;
    let receivedAuth: string | null = null;
    server.use(
      http.post(
        "*/api/v1/admin/products/categories/7/image",
        async ({ request }) => {
          receivedAuth = request.headers.get("authorization");
          const body = await request.formData();
          const part = body.get("file") as File | null;
          receivedFieldType = part?.type;
          return HttpResponse.json({ status: 200, message: "uploaded" });
        },
      ),
    );

    const result = await uploadCategoryImage({
      categoryId: 7,
      file: imageFile(),
      token: "tok",
    });

    expect(result).toEqual({ status: 200, message: "uploaded" });
    expect(receivedFieldType).toBe("image/png");
    expect(receivedAuth).toBe("Bearer tok");
  });
});

describe("admin categories wrappers (MSW integration) — error mapping", () => {
  it("createCategory: a Bean Validation 400 body falls through to the generic fallback message", async () => {
    // `{status, errors: {field}}` has no top-level `.error` key, so
    // `apiFetch`'s generic `!res.ok` branch (L76-79) reads `errorData?.error`
    // as undefined and falls back to "Request failed". This is the intended
    // branch for a Bean Validation failure, not a field-specific message.
    server.use(
      http.post("*/api/v1/admin/products/categories", () =>
        HttpResponse.json(
          { status: 400, errors: { name: "El nombre es muy corto" } },
          { status: 400 },
        ),
      ),
    );

    const err = await createCategory({
      data: { name: "x" },
      token: "tok",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Request failed");
    expect((err as ApiError).status).toBe(400);
  });

  it("getAdminCategory: a service-layer 404 `{error}` body surfaces the specific message", async () => {
    server.use(
      http.get("*/api/v1/admin/products/categories/99", () =>
        HttpResponse.json({ error: "Category not found" }, { status: 404 }),
      ),
    );

    const err = await getAdminCategory(99, "tok").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Category not found");
    expect((err as ApiError).status).toBe(404);
  });

  it("getAdminCategories: a 401 maps to Error(API_ERRORS.UNAUTHORIZED)", async () => {
    server.use(
      http.get("*/api/v1/admin/products/categories", () =>
        HttpResponse.json({ error: "no token" }, { status: 401 }),
      ),
    );

    await expect(getAdminCategories(0, 10, "", "bad")).rejects.toThrow(
      API_ERRORS.UNAUTHORIZED,
    );
  });
});
