import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/lib/authHandler", () => ({ handleUnauthorized: vi.fn() }));
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
import { handleUnauthorized } from "@/lib/authHandler";
import * as api from "@/api/api";
import { API_ERRORS } from "@/constants/apiErrors";
import { CartProvider } from "@/providers/CartProvider";
import { useCart } from "@/hooks/useCart";

const mockedUseUser = vi.mocked(useUser);
const logout = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockedUseUser.mockReturnValue({
    user: {
      userId: "u1",
      email: "a@b.c",
      name: "Ada",
      token: "jwt-123",
      role: "USER",
      isVerified: true,
    },
    setUser: vi.fn(),
    logout,
  });
});

describe("CartProvider hydrate error routing", () => {
  it("routes a 401 during hydrate through the shared logout handler", async () => {
    vi.mocked(api.getCart).mockRejectedValue(
      new Error(API_ERRORS.UNAUTHORIZED),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() =>
      expect(handleUnauthorized).toHaveBeenCalledTimes(1),
    );
    expect(handleUnauthorized).toHaveBeenCalledWith(logout);
    expect(result.current.error).toBeNull();
  });

  it("keeps setError behavior for a non-401 hydrate error and does not log out", async () => {
    vi.mocked(api.getCart).mockRejectedValue(new Error("cart_error_boom"));

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("cart_error_boom"));
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });
});
