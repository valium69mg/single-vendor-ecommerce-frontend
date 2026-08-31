import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { CartContextValue } from "@/context/CartContext";
import { useCart } from "@/hooks/useCart";
import NavbarCart from "./NavbarCart";

vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));

const mockedUseCart = vi.mocked(useCart);

function setCart(value: Partial<CartContextValue>) {
  mockedUseCart.mockReturnValue({
    items: [],
    subtotal: 0,
    totalItems: 0,
    isLoading: false,
    error: null,
    isDrawerOpen: false,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    ...value,
  });
}

function renderCart() {
  return render(
    <MemoryRouter>
      <NavbarCart />
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("NavbarCart", () => {
  it("shows the total item count in the badge", () => {
    setCart({ totalItems: 4 });
    renderCart();
    expect(screen.getByTestId("cart-badge")).toHaveTextContent("4");
  });

  it("does not render the badge when the cart is empty", () => {
    setCart({ totalItems: 0 });
    renderCart();
    expect(screen.queryByTestId("cart-badge")).not.toBeInTheDocument();
  });

  it("opens the drawer when the cart button is clicked", () => {
    const openDrawer = vi.fn();
    setCart({ totalItems: 2, openDrawer });
    renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Abrir carrito" }));
    expect(openDrawer).toHaveBeenCalledTimes(1);
  });
});
