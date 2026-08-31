import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  CartStockError,
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

const CART = { cartId: 1, items: [], subtotal: 0, totalItems: 0 };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("getCart", () => {
  it("GETs /cart with the bearer token and returns the cart", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, CART));

    const res = await getCart("tok");

    expect(res).toEqual(CART);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/cart`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      }),
    );
  });
});

describe("addCartItem", () => {
  it("POSTs the variant id and quantity to /cart/items", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, CART));

    await addCartItem({ productVariantId: 7, quantity: 2 }, "tok");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/cart/items`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      productVariantId: 7,
      quantity: 2,
    });
  });

  it("throws CartStockError carrying availableStock on a 400 stock rejection", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, {
        status: 400,
        error: "cart_stock_exceeded",
        availableStock: 4,
      }),
    );

    const err = await addCartItem({ productVariantId: 7, quantity: 9 }, "tok").catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(CartStockError);
    expect((err as CartStockError).availableStock).toBe(4);
    expect((err as CartStockError).message).toBe("cart_stock_exceeded");
  });
});

describe("updateCartItem", () => {
  it("PATCHes the new quantity to /cart/items/{id}", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, CART));

    await updateCartItem(42, { quantity: 3 }, "tok");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/cart/items/42`);
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(init?.body as string)).toEqual({ quantity: 3 });
  });

  it("throws CartStockError with availableStock on a 400 stock rejection", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, {
        status: 400,
        error: "cart_stock_exceeded",
        availableStock: 5,
      }),
    );

    const err = await updateCartItem(42, { quantity: 9 }, "tok").catch((e) => e);

    expect(err).toBeInstanceOf(CartStockError);
    expect((err as CartStockError).availableStock).toBe(5);
  });
});

describe("removeCartItem", () => {
  it("DELETEs /cart/items/{id} and returns the updated cart (HTTP 200, not 204)", async () => {
    const updated = { cartId: 1, items: [], subtotal: 0, totalItems: 0 };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, updated));

    const res = await removeCartItem(42, "tok");

    expect(res).toEqual(updated);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/cart/items/42`);
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
  });
});
