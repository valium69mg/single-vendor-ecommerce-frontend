import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";

import {
  getAdminProducts,
  createProduct,
  uploadProductImage,
  type AdminProduct,
  type CreateProductInput,
} from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import { API_ERRORS } from "@/constants/apiErrors";
import { server } from "@/mocks/server";

/**
 * Integration coverage for the admin products wrapper surface that currently
 * exists in `src/api/api.ts` (`getAdminProducts`, `createProduct`,
 * `uploadProductImage`). `editProduct`/`deleteProduct`/`restoreProduct` are
 * NOT implemented in `api.ts` and are intentionally not tested here.
 */

function fakeAdminProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    productId: "p-1",
    name: "Anillo de Compromiso",
    shortDescription: null,
    featured: false,
    status: "ACTIVE",
    category: null,
    brand: null,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    avgPrice: 1000,
    avgDiscountPrice: 0,
    totalStock: 5,
    variantCount: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const CREATE_INPUT: CreateProductInput = {
  name: "Collar de Oro",
  status: "ACTIVE",
  featured: false,
  materialIds: [1],
  variants: [{ sku: "C-1", price: 100, stock: 3, attributeValueIds: [1] }],
};

describe("admin products wrappers (MSW integration) — success paths", () => {
  it("getAdminProducts resolves the MSW-served page and sends the Bearer token", async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get("*/api/v1/admin/products", ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json({
          content: [fakeAdminProduct({ name: "Aretes de Plata" })],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          last: true,
        });
      }),
    );

    const result = await getAdminProducts({ page: 0, size: 20 }, "tok-1");

    expect(result.content[0].name).toBe("Aretes de Plata");
    expect(receivedAuth).toBe("Bearer tok-1");
  });

  it("createProduct POSTs the serialized product and resolves the StandardResponse", async () => {
    let receivedBody: unknown;
    server.use(
      http.post("*/api/v1/admin/products", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ status: 201, message: "created" });
      }),
    );

    const result = await createProduct(CREATE_INPUT, "tok");

    expect(result).toEqual({ status: 201, message: "created" });
    expect(receivedBody).toEqual(CREATE_INPUT);
  });

  it("uploadProductImage POSTs a FormData body carrying the file under the 'file' field", async () => {
    let receivedFieldType: string | undefined;
    let receivedAuth: string | null = null;
    server.use(
      http.post("*/api/v1/admin/products/p-1/image", async ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        const body = await request.formData();
        const part = body.get("file") as File | null;
        receivedFieldType = part?.type;
        return HttpResponse.json({ status: 200, message: "uploaded" });
      }),
    );

    const file = new File(["binary"], "product.png", { type: "image/png" });
    const result = await uploadProductImage("p-1", file, "tok");

    expect(result).toEqual({ status: 200, message: "uploaded" });
    expect(receivedFieldType).toBe("image/png");
    expect(receivedAuth).toBe("Bearer tok");
  });
});

describe("admin products wrappers (MSW integration) — error mapping", () => {
  it("createProduct: a 500 server error surfaces as ApiError carrying the status", async () => {
    server.use(
      http.post("*/api/v1/admin/products", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );

    const err = await createProduct(CREATE_INPUT, "tok").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).message).toBe("Request failed");
  });

  it("createProduct: a Bean Validation 400 body falls through to the generic fallback message", async () => {
    // `{status, errors: {field}}` has no top-level `.error` key, so
    // `apiFetch`'s generic branch reads `errorData?.error` as undefined and
    // falls back to "Request failed" — the intended branch for this shape.
    server.use(
      http.post("*/api/v1/admin/products", () =>
        HttpResponse.json(
          { status: 400, errors: { name: "El nombre es requerido" } },
          { status: 400 },
        ),
      ),
    );

    const err = await createProduct(
      { ...CREATE_INPUT, name: "" },
      "tok",
    ).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Request failed");
    expect((err as ApiError).status).toBe(400);
  });

  it("getAdminProducts: a 403 maps to Error(API_ERRORS.FORBIDDEN)", async () => {
    server.use(
      http.get("*/api/v1/admin/products", () =>
        HttpResponse.json({ error: "no permission" }, { status: 403 }),
      ),
    );

    await expect(
      getAdminProducts({ page: 0, size: 20 }, "tok"),
    ).rejects.toThrow(API_ERRORS.FORBIDDEN);
  });
});
