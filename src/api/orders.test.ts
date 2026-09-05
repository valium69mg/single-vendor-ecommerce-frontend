import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrder,
  getMyOrders,
  getOrder,
  CheckoutStockConflictError,
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

const ADDRESS = {
  recipient: "Jane Doe",
  line1: "Av. Reforma 123",
  city: "CDMX",
  state: "CDMX",
  postalCode: "01000",
  country: "MX",
  phone: "5555555555",
};

const ORDER = {
  orderId: 1,
  orderNumber: "ORD-20260101-1",
  status: "PENDING",
  subtotal: 100,
  shippingCost: 99,
  total: 199,
  shippingAddress: ADDRESS,
  items: [],
  createdAt: "2026-01-01T00:00:00",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("createOrder", () => {
  it("POSTs the shipping address to /orders with the bearer token and returns the created order", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(201, ORDER));

    const res = await createOrder({ shippingAddress: ADDRESS }, "tok");

    expect(res).toEqual(ORDER);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/orders`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      shippingAddress: ADDRESS,
    });
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  it("throws CheckoutStockConflictError carrying the conflicts list on a 409 rejection", async () => {
    const conflicts = [
      {
        productVariantId: 7,
        type: "STOCK_INSUFFICIENT",
        requestedQuantity: 5,
        availableStock: 2,
      },
    ];
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, {
        status: 409,
        error: "order_stock_insufficient",
        conflicts,
      }),
    );

    const err = await createOrder({ shippingAddress: ADDRESS }, "tok").catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(CheckoutStockConflictError);
    expect((err as CheckoutStockConflictError).conflicts).toEqual(conflicts);
    expect((err as CheckoutStockConflictError).message).toBe(
      "order_stock_insufficient",
    );
  });

  it("propagates a plain 400 (e.g. empty cart) without wrapping it as a conflict error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, { status: 400, error: "order_cart_empty" }),
    );

    const err = await createOrder({ shippingAddress: ADDRESS }, "tok").catch(
      (e) => e,
    );

    expect(err).not.toBeInstanceOf(CheckoutStockConflictError);
    expect((err as Error).message).toBe("order_cart_empty");
  });
});

describe("getMyOrders", () => {
  it("GETs /orders with the bearer token and returns the list", async () => {
    const summaries = [
      {
        orderNumber: "ORD-1",
        status: "PENDING",
        total: 100,
        totalItems: 2,
        createdAt: "2026-01-01T00:00:00",
      },
    ];
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, summaries));

    const res = await getMyOrders("tok");

    expect(res).toEqual(summaries);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/orders`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      }),
    );
  });
});

describe("getOrder", () => {
  it("GETs /orders/{orderNumber} and returns the order detail", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, ORDER));

    const res = await getOrder("ORD-20260101-1", "tok");

    expect(res).toEqual(ORDER);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/orders/ORD-20260101-1`);
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  it("propagates a 404 as an Error carrying order_not_found", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, { status: 404, error: "order_not_found" }),
    );

    const err = await getOrder("ORD-UNKNOWN", "tok").catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("order_not_found");
  });
});
