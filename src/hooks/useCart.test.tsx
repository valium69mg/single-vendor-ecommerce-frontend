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
  };
});

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

  it("keeps the guest localStorage cart intact after a user logs in", async () => {
    const guest = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      await guest.result.current.addItem({
        productVariantId: 1,
        quantity: 2,
        productName: "Ring",
        unitPrice: 100,
        availableStock: 10,
      });
    });
    guest.unmount();

    asAuthenticated();
    const server: CartResponse = { cartId: 5, items: [], subtotal: 0, totalItems: 0 };
    vi.mocked(api.getCart).mockResolvedValue(server);

    const authed = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.getCart).toHaveBeenCalled());

    const stored = JSON.parse(localStorage.getItem("cart") as string);
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].productVariantId).toBe(1);
    void authed;
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
