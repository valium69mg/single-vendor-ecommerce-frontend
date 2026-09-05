import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return {
    ...actual,
    getCart: vi.fn(),
    addCartItem: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    mergeCart: vi.fn(),
  };
});
const toastInfo = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ info: toastInfo }),
}));

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import type { CartResponse } from "@/api/api";
import { CartProvider } from "@/providers/CartProvider";
import { useCart } from "@/hooks/useCart";

const mockedUseUser = vi.mocked(useUser);

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

const authedUser = {
  userId: "u1",
  email: "a@b.c",
  name: "Ada",
  token: "jwt-123",
  role: "CUSTOMER",
  isVerified: true,
};

function asGuest() {
  mockedUseUser.mockReturnValue({
    user: null,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function asAuthenticated() {
  mockedUseUser.mockReturnValue({
    user: authedUser,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  asGuest();
});

describe("useCart", () => {
  it("throws when used outside a CartProvider", () => {
    expect(() => renderHook(() => useCart())).toThrow(
      "useCart must be used within a CartProvider",
    );
  });

  it("persists a guest addItem to localStorage and restores it on remount", async () => {
    const first = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await first.result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    expect(first.result.current.items).toHaveLength(1);
    expect(first.result.current.totalItems).toBe(2);
    expect(first.result.current.subtotal).toBe(200);

    const stored = JSON.parse(localStorage.getItem("cart") as string);
    expect(stored.items[0].productVariantId).toBe(1);
    expect(api.addCartItem).not.toHaveBeenCalled();

    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.items).toHaveLength(1);
    expect(second.result.current.subtotal).toBe(200);
  });

  it("merges the guest cart into the server on login and clears localStorage on success", async () => {
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    const server: CartResponse = {
      cartId: 5,
      items: [
        {
          cartItemId: 20,
          productVariantId: 1,
          productId: "p1",
          productName: "Ring",
          sku: "R-1",
          imageUrl: null,
          unitPrice: 100,
          discountPrice: null,
          quantity: 2,
          availableStock: 10,
          lineTotal: 200,
        },
      ],
      subtotal: 200,
      totalItems: 2,
    };
    vi.mocked(api.mergeCart).mockResolvedValue({
      cart: server,
      adjustedLines: [],
      skippedLines: [],
    });

    asAuthenticated();
    await act(async () => {
      rerender();
    });
    await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));

    expect(api.mergeCart).toHaveBeenCalledWith(
      [{ productVariantId: 1, quantity: 2 }],
      "jwt-123",
    );
    expect(api.getCart).not.toHaveBeenCalled();
    await waitFor(() => expect(localStorage.getItem("cart")).toBeNull());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].productVariantId).toBe(1);
  });

  it("does not send a merge request when the guest cart is empty at login", async () => {
    asAuthenticated();
    vi.mocked(api.getCart).mockResolvedValue({
      cartId: 5,
      items: [],
      subtotal: 0,
      totalItems: 0,
    });

    renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.getCart).toHaveBeenCalled());

    expect(api.mergeCart).not.toHaveBeenCalled();
  });

  it("shows a toast for adjusted and skipped lines after a successful merge", async () => {
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await result.current.addItem({
        productVariantId: 1,
        quantity: 5,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    const server: CartResponse = { cartId: 5, items: [], subtotal: 0, totalItems: 0 };
    vi.mocked(api.mergeCart).mockResolvedValue({
      cart: server,
      adjustedLines: [{ productVariantId: 1, requestedQuantity: 5, finalQuantity: 3 }],
      skippedLines: [{ productVariantId: 2, reason: "not found" }],
    });

    asAuthenticated();
    await act(async () => {
      rerender();
    });
    await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toastInfo).toHaveBeenCalledTimes(2));

    expect(toastInfo).toHaveBeenCalledWith(
      expect.stringContaining("stock"),
    );
  });

  it("does not show a toast when a successful merge has no adjustments or skips", async () => {
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    vi.mocked(api.mergeCart).mockResolvedValue({
      cart: { cartId: 5, items: [], subtotal: 0, totalItems: 0 },
      adjustedLines: [],
      skippedLines: [],
    });

    asAuthenticated();
    await act(async () => {
      rerender();
    });
    await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));

    expect(toastInfo).not.toHaveBeenCalled();
  });

  it("preserves the guest cart in localStorage and does not surface an error when merge fails", async () => {
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    const before = localStorage.getItem("cart");

    vi.mocked(api.mergeCart).mockRejectedValue(new Error("network error"));

    asAuthenticated();
    await act(async () => {
      rerender();
    });
    await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));

    expect(localStorage.getItem("cart")).toBe(before);
    expect(result.current.error).toBeNull();
    expect(api.mergeCart).toHaveBeenCalledTimes(1);
  });

  it("does not re-merge on an authenticated page reload even with a stale guest cart key", async () => {
    localStorage.setItem(
      "cart",
      JSON.stringify({
        cartId: null,
        items: [
          {
            cartItemId: null,
            productVariantId: 1,
            productId: null,
            productName: "Stale Ring",
            sku: null,
            imageUrl: null,
            unitPrice: 100,
            discountPrice: null,
            quantity: 1,
            availableStock: 10,
          },
        ],
      }),
    );

    asAuthenticated();
    vi.mocked(api.getCart).mockResolvedValue({
      cartId: 5,
      items: [],
      subtotal: 0,
      totalItems: 0,
    });

    renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.getCart).toHaveBeenCalled());

    expect(api.mergeCart).not.toHaveBeenCalled();
  });

  it("survives the merge effect being torn down and re-run before settling, merging exactly once", async () => {
    // Simulates a React 18/19 dev-mode StrictMode double-invoke: the effect's
    // cleanup fires (e.g. because an unrelated dependency like `logout`
    // changes identity) before the in-flight mergeCart call has settled. The
    // previousTokenRef must be rolled back on that aborted cleanup, or the
    // real second invocation would see the ref already flipped to the token
    // and silently take the getCart branch instead of merging.
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });

    const server: CartResponse = {
      cartId: 5,
      items: [
        {
          cartItemId: 20,
          productVariantId: 1,
          productId: "p1",
          productName: "Ring",
          sku: "R-1",
          imageUrl: null,
          unitPrice: 100,
          discountPrice: null,
          quantity: 2,
          availableStock: 10,
          lineTotal: 200,
        },
      ],
      subtotal: 200,
      totalItems: 2,
    };
    vi.mocked(api.mergeCart).mockResolvedValue({
      cart: server,
      adjustedLines: [],
      skippedLines: [],
    });

    // First invocation: token flips null -> "jwt-123", schedules the
    // (microtask-deferred) mergeCart call, but does not get a chance to
    // resolve before the next synchronous render below tears it down.
    asAuthenticated();
    act(() => {
      rerender();
    });

    // Second invocation, synchronously right after (no await in between, so
    // no microtask has flushed yet): a fresh `logout` reference forces the
    // effect to clean up and re-run for the same authenticated token.
    asAuthenticated();
    act(() => {
      rerender();
    });

    await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].productVariantId).toBe(1);
  });

  it("hydrates cart state from GET /cart when a user is authenticated", async () => {
    asAuthenticated();
    const server: CartResponse = {
      cartId: 5,
      items: [
        {
          cartItemId: 10,
          productVariantId: 2,
          productId: "p2",
          productName: "Necklace",
          sku: "NL-1",
          imageUrl: null,
          unitPrice: 50,
          discountPrice: null,
          quantity: 3,
          availableStock: 8,
          lineTotal: 150,
        },
      ],
      subtotal: 150,
      totalItems: 3,
    };
    vi.mocked(api.getCart).mockResolvedValue(server);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(api.getCart).toHaveBeenCalledWith("jwt-123");
    expect(result.current.items[0].productName).toBe("Necklace");
    expect(result.current.subtotal).toBe(150);
    expect(result.current.totalItems).toBe(3);
  });

  it("routes an authenticated add through the API and re-syncs from the response", async () => {
    asAuthenticated();
    vi.mocked(api.getCart).mockResolvedValue({
      cartId: 5,
      items: [],
      subtotal: 0,
      totalItems: 0,
    });
    vi.mocked(api.addCartItem).mockResolvedValue({
      cartId: 5,
      items: [
        {
          cartItemId: 11,
          productVariantId: 2,
          productId: "p2",
          productName: "Necklace",
          sku: "NL-1",
          imageUrl: null,
          unitPrice: 50,
          discountPrice: null,
          quantity: 1,
          availableStock: 8,
          lineTotal: 50,
        },
      ],
      subtotal: 50,
      totalItems: 1,
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem({
        productVariantId: 2,
        quantity: 1,
        productName: "Necklace",
        unitPrice: 50,
        availableStock: 8,
      });
    });

    expect(api.addCartItem).toHaveBeenCalledWith(
      { productVariantId: 2, quantity: 1 },
      "jwt-123",
    );
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(1);
  });

  it("surfaces an error and leaves cart state unchanged when an add is rejected for stock", async () => {
    asAuthenticated();
    vi.mocked(api.getCart).mockResolvedValue({
      cartId: 5,
      items: [],
      subtotal: 0,
      totalItems: 0,
    });
    vi.mocked(api.addCartItem).mockRejectedValue(
      new api.CartStockError("cart_stock_exceeded", 4),
    );

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem({
        productVariantId: 9,
        quantity: 5,
        productName: "Bracelet",
        unitPrice: 20,
        availableStock: 4,
      });
    });

    expect(result.current.error).toBe("cart_stock_exceeded");
    expect(result.current.items).toHaveLength(0);
  });

  it("toggles drawer state through openDrawer and closeDrawer", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.isDrawerOpen).toBe(false);
    act(() => result.current.openDrawer());
    expect(result.current.isDrawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.isDrawerOpen).toBe(false);
  });
});
